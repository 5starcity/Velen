// app/add-listing/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createListing } from "@/lib/firestoreListings";
import { uploadToCloudinary } from "@/lib/cloudinary";
import "@/styles/add-listing.css";

const initialForm = {
  title: "",
  price: "",
  location: "",
  distanceFromRSU: "",
  type: "",
  beds: "1",
  baths: "1",
  furnishing: "",
  availability: "",
  paymentTerms: "",
  amenities: "",
  additionalCosts: "",
  contact: "",
  description: "",
};

export default function AddListingPage() {
  const router = useRouter();
  const { user, userRole } = useAuth();

  const [formData, setFormData] = useState(initialForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  useEffect(() => {
    if (!user) router.push("/login");
    else if (userRole && userRole !== "landlord") router.push("/listings");
  }, [user, userRole]);

  if (!user || userRole === "student") return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0, 5);
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(index) {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  }

  function handleVideoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  }

  function removeVideo() {
    setVideoFile(null);
    setVideoPreview(null);
  }

  function validateForm() {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Property title is required";
    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else if (Number(formData.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.distanceFromRSU.trim()) newErrors.distanceFromRSU = "Distance from RSU is required";
    if (!formData.type.trim()) newErrors.type = "Property type is required";
    if (!formData.furnishing.trim()) newErrors.furnishing = "Furnishing status is required";
    if (!formData.availability.trim()) newErrors.availability = "Availability is required";
    if (!formData.paymentTerms.trim()) newErrors.paymentTerms = "Payment terms are required";
    if (imageFiles.length === 0) newErrors.images = "At least one image is required";
    if (!formData.contact.trim()) {
      newErrors.contact = "Contact number is required";
    } else if (formData.contact.trim().length < 11) {
      newErrors.contact = "Enter a valid phone number";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description should be at least 20 characters";
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSaving(true);
    try {
      // Upload images
      setUploadProgress("Uploading images...");
      const imageUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        setUploadProgress("Uploading image " + (i + 1) + " of " + imageFiles.length + "...");
        const url = await uploadToCloudinary(imageFiles[i]);
        imageUrls.push(url);
      }

      // Upload video if exists
      let videoUrl = null;
      if (videoFile) {
        setUploadProgress("Uploading video...");
        videoUrl = await uploadToCloudinary(videoFile);
      }

      setUploadProgress("Saving listing...");

      await createListing({
        title: formData.title.trim(),
        price: formData.price,
        location: formData.location.trim(),
        distanceFromRSU: formData.distanceFromRSU.trim(),
        type: formData.type.trim(),
        beds: formData.beds,
        baths: formData.baths,
        furnishing: formData.furnishing,
        availability: formData.availability,
        paymentTerms: formData.paymentTerms.trim(),
        amenities: formData.amenities.trim(),
        additionalCosts: formData.additionalCosts.trim(),
        contact: formData.contact.trim(),
        description: formData.description.trim(),
        images: imageUrls,
        image: imageUrls[0], // keep first image as main for cards
        videoUrl: videoUrl || null,
        verified: false,
        featured: false,
        landlordId: user.uid,
        landlordName: user.displayName,
      });

      setSubmitted(true);
      setErrors({});
      setFormData(initialForm);
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFile(null);
      setVideoPreview(null);
      setUploadProgress("");
      setTimeout(() => router.push("/listings"), 1500);
    } catch (error) {
      console.error("Error creating listing:", error);
      setErrors({ general: "Failed to save listing. Try again." });
      setUploadProgress("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="add-listing-page">
      <section className="add-listing-page__card">
        <p className="add-listing-page__tag">Post a Property</p>
        <h1>Add a New Listing</h1>
        <p className="add-listing-page__text">
          Fill in as much detail as possible — the more info you provide, the
          fewer questions students will need to ask before deciding.
        </p>

        {submitted && (
          <div className="add-listing-page__success">
            Listing submitted successfully. Redirecting...
          </div>
        )}
        {errors.general && (
          <div className="add-listing-page__error-banner">{errors.general}</div>
        )}

        <form className="add-listing-form" onSubmit={handleSubmit}>

          {/* Basic Info */}
          <div className="form-section">
            <p className="form-section__title">Basic Information</p>
            <div className="form-group">
              <label className="file-label">Property Title</label>
              <input type="text" name="title" placeholder="e.g. Modern self contain in Alakahia" value={formData.title} onChange={handleChange} />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="file-label">Price (₦ / year)</label>
                <input type="number" name="price" placeholder="e.g. 250000" value={formData.price} onChange={handleChange} />
                {errors.price && <p className="form-error">{errors.price}</p>}
              </div>
              <div className="form-group">
                <label className="file-label">Property Type</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="">Select type</option>
                  <option value="Self Contain">Self Contain</option>
                  <option value="Single Room">Single Room</option>
                  <option value="Mini Flat">Mini Flat</option>
                  <option value="2 Bedroom Flat">2 Bedroom Flat</option>
                  <option value="3 Bedroom Flat">3 Bedroom Flat</option>
                  <option value="Shared Room">Shared Room</option>
                  <option value="Studio Apartment">Studio Apartment</option>
                </select>
                {errors.type && <p className="form-error">{errors.type}</p>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="file-label">Bedrooms</label>
                <select name="beds" value={formData.beds} onChange={handleChange}>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4+ Bedrooms</option>
                </select>
              </div>
              <div className="form-group">
                <label className="file-label">Bathrooms</label>
                <select name="baths" value={formData.baths} onChange={handleChange}>
                  <option value="1">1 Bathroom</option>
                  <option value="2">2 Bathrooms</option>
                  <option value="3">3+ Bathrooms</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <p className="form-section__title">Location</p>
            <div className="form-group">
              <label className="file-label">Area / Street</label>
              <input type="text" name="location" placeholder="e.g. Alakahia, Choba, Rumuola" value={formData.location} onChange={handleChange} />
              {errors.location && <p className="form-error">{errors.location}</p>}
            </div>
            <div className="form-group">
              <label className="file-label">Distance from RSU Gate</label>
              <input type="text" name="distanceFromRSU" placeholder="e.g. 5 mins walk, 1.2km" value={formData.distanceFromRSU} onChange={handleChange} />
              {errors.distanceFromRSU && <p className="form-error">{errors.distanceFromRSU}</p>}
            </div>
          </div>

          {/* Availability & Terms */}
          <div className="form-section">
            <p className="form-section__title">Availability & Terms</p>
            <div className="form-row">
              <div className="form-group">
                <label className="file-label">Availability</label>
                <select name="availability" value={formData.availability} onChange={handleChange}>
                  <option value="">Select status</option>
                  <option value="Available Now">Available Now</option>
                  <option value="Available Soon">Available Soon</option>
                  <option value="Not Available">Not Available</option>
                </select>
                {errors.availability && <p className="form-error">{errors.availability}</p>}
              </div>
              <div className="form-group">
                <label className="file-label">Furnishing</label>
                <select name="furnishing" value={formData.furnishing} onChange={handleChange}>
                  <option value="">Select furnishing</option>
                  <option value="Furnished">Furnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Unfurnished">Unfurnished</option>
                </select>
                {errors.furnishing && <p className="form-error">{errors.furnishing}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="file-label">Payment Terms</label>
              <input type="text" name="paymentTerms" placeholder="e.g. 1 year upfront, 6 months accepted" value={formData.paymentTerms} onChange={handleChange} />
              {errors.paymentTerms && <p className="form-error">{errors.paymentTerms}</p>}
            </div>
            <div className="form-group">
              <label className="file-label">Additional Costs</label>
              <input type="text" name="additionalCosts" placeholder="e.g. ₦20k service charge, no caution fee" value={formData.additionalCosts} onChange={handleChange} />
            </div>
          </div>

          {/* Amenities */}
          <div className="form-section">
            <p className="form-section__title">Amenities & Features</p>
            <div className="form-group">
              <label className="file-label">Amenities</label>
              <input type="text" name="amenities" placeholder="e.g. Running water, Prepaid meter, Security, Parking" value={formData.amenities} onChange={handleChange} />
              <p className="form-hint">Separate each amenity with a comma</p>
            </div>
          </div>

          {/* Media */}
          <div className="form-section">
            <p className="form-section__title">Photos & Video</p>

            <div className="form-group">
              <label className="file-label">Property Images (up to 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="file-input"
                onChange={handleImageChange}
              />
              {errors.images && <p className="form-error">{errors.images}</p>}
              {imagePreviews.length > 0 && (
                <div className="media-preview__grid">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="media-preview__item">
                      <img src={src} alt={"Preview " + (i + 1)} />
                      <button type="button" className="media-preview__remove" onClick={() => removeImage(i)}>✕</button>
                      {i === 0 && <span className="media-preview__main-tag">Main</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="file-label">Property Video (optional)</label>
              <input
                type="file"
                accept="video/*"
                className="file-input"
                onChange={handleVideoChange}
              />
              <p className="form-hint">Max recommended: 50MB. Short walkthrough videos work best.</p>
              {videoPreview && (
                <div className="media-preview__video">
                  <video src={videoPreview} controls />
                  <button type="button" className="media-preview__remove-video" onClick={removeVideo}>Remove Video</button>
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="form-section">
            <p className="form-section__title">Contact</p>
            <div className="form-group">
              <label className="file-label">Contact Number</label>
              <input type="text" name="contact" placeholder="e.g. 08012345678" value={formData.contact} onChange={handleChange} />
              {errors.contact && <p className="form-error">{errors.contact}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="form-section">
            <p className="form-section__title">Description</p>
            <div className="form-group">
              <label className="file-label">About this property</label>
              <textarea rows="5" name="description" placeholder="Describe the property, neighbourhood, what makes it a good place to live..." value={formData.description} onChange={handleChange} />
              {errors.description && <p className="form-error">{errors.description}</p>}
            </div>
          </div>

          {uploadProgress && (
            <div className="add-listing-page__progress">
              {uploadProgress}
            </div>
          )}

          <button type="submit" disabled={saving}>
            {saving ? uploadProgress || "Uploading..." : "Submit Listing"}
          </button>

        </form>
      </section>
    </main>
  );
}