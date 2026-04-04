// app/add-listing/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createListing } from "@/lib/firestoreListings";
import { uploadToCloudinary } from "@/lib/cloudinary";
import "@/styles/add-listing.css";

const initialForm = {
  title: "",
  price: "",
  location: "",
  address: "",
  type: "",
  beds: "1",
  baths: "1",
  furnishing: "",
  availability: "",
  paymentTerms: "",
  cautionFee: "",
  legalFee: "",
  agencyFee: "",
  serviceCharge: "",
  amenities: "",
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

  const totalMoveInCost = useMemo(() => {
    const rent = Number(formData.price) || 0;
    const caution = Number(formData.cautionFee) || 0;
    const legal = Number(formData.legalFee) || 0;
    const agency = Number(formData.agencyFee) || 0;
    const service = Number(formData.serviceCharge) || 0;
    return rent + caution + legal + agency + service;
  }, [formData.price, formData.cautionFee, formData.legalFee, formData.agencyFee, formData.serviceCharge]);

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
    if (!formData.address.trim()) newErrors.address = "Property address is required for map";
    if (!formData.type.trim()) newErrors.type = "Property type is required";
    if (!formData.furnishing.trim()) newErrors.furnishing = "Furnishing status is required";
    if (!formData.availability.trim()) newErrors.availability = "Availability is required";
    if (!formData.paymentTerms.trim()) newErrors.paymentTerms = "Payment terms are required";

    // Must have at least one image OR a video
    if (imageFiles.length === 0 && !videoFile) {
      newErrors.media = "Upload at least one photo or a video";
    }

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
      const imageUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        setUploadProgress("Uploading image " + (i + 1) + " of " + imageFiles.length + "...");
        const url = await uploadToCloudinary(imageFiles[i]);
        imageUrls.push(url);
      }

      let videoUrl = null;
      if (videoFile) {
        setUploadProgress("Uploading video...");
        videoUrl = await uploadToCloudinary(videoFile);
      }

      setUploadProgress("Saving listing...");

      // Build Google Maps URL from address
      const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(formData.address + ", Port Harcourt, Nigeria");

      await createListing({
        title: formData.title.trim(),
        price: formData.price,
        location: formData.location.trim(),
        address: formData.address.trim(),
        mapsUrl,
        type: formData.type.trim(),
        beds: formData.beds,
        baths: formData.baths,
        furnishing: formData.furnishing,
        availability: formData.availability,
        paymentTerms: formData.paymentTerms.trim(),
        cautionFee: formData.cautionFee ? Number(formData.cautionFee) : 0,
        legalFee: formData.legalFee ? Number(formData.legalFee) : 0,
        agencyFee: formData.agencyFee ? Number(formData.agencyFee) : 0,
        serviceCharge: formData.serviceCharge ? Number(formData.serviceCharge) : 0,
        totalMoveInCost,
        amenities: formData.amenities.trim(),
        contact: formData.contact.trim(),
        description: formData.description.trim(),
        images: imageUrls,
        image: imageUrls[0] || null,
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
                <label className="file-label">Annual Rent (₦)</label>
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
                  <option value="1 Bedroom Flat">1 Bedroom Flat</option>
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
              <label className="file-label">Full Property Address</label>
              <input type="text" name="address" placeholder="e.g. No. 5 Alakahia Road, Choba, Port Harcourt" value={formData.address} onChange={handleChange} />
              <p className="form-hint">Used to generate a Google Maps link for students</p>
              {errors.address && <p className="form-error">{errors.address}</p>}
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
          </div>

          {/* Move-in Costs */}
          <div className="form-section">
            <p className="form-section__title">Move-in Costs</p>
            <p className="form-hint" style={{ marginBottom: "12px" }}>
              Enter 0 if a fee doesn't apply. This helps students know the total cost upfront.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label className="file-label">Caution Fee (₦)</label>
                <input type="number" name="cautionFee" placeholder="e.g. 50000" value={formData.cautionFee} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="file-label">Legal Fee (₦)</label>
                <input type="number" name="legalFee" placeholder="e.g. 30000" value={formData.legalFee} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="file-label">Agency Fee (₦)</label>
                <input type="number" name="agencyFee" placeholder="e.g. 0 if no agent" value={formData.agencyFee} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="file-label">Service Charge (₦)</label>
                <input type="number" name="serviceCharge" placeholder="e.g. 20000" value={formData.serviceCharge} onChange={handleChange} />
              </div>
            </div>

            {totalMoveInCost > 0 && (
              <div className="form-total">
                <div className="form-total__breakdown">
                  {Number(formData.price) > 0 && (
                    <div className="form-total__row">
                      <span>Annual Rent</span>
                      <span>₦{Number(formData.price).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(formData.cautionFee) > 0 && (
                    <div className="form-total__row">
                      <span>Caution Fee</span>
                      <span>₦{Number(formData.cautionFee).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(formData.legalFee) > 0 && (
                    <div className="form-total__row">
                      <span>Legal Fee</span>
                      <span>₦{Number(formData.legalFee).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(formData.agencyFee) > 0 && (
                    <div className="form-total__row">
                      <span>Agency Fee</span>
                      <span>₦{Number(formData.agencyFee).toLocaleString()}</span>
                    </div>
                  )}
                  {Number(formData.serviceCharge) > 0 && (
                    <div className="form-total__row">
                      <span>Service Charge</span>
                      <span>₦{Number(formData.serviceCharge).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="form-total__final">
                  <span>Total Move-in Cost</span>
                  <strong>₦{totalMoveInCost.toLocaleString()}</strong>
                </div>
              </div>
            )}
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
            <p className="form-hint" style={{ marginBottom: "12px" }}>
              Upload photos, a video, or both. At least one is required.
            </p>

            <div className="form-group">
              <label className="file-label">Property Photos (up to 5) — optional if video uploaded</label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="file-input"
                onChange={handleImageChange}
              />
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
              <label className="file-label">Property Video — optional if photos uploaded</label>
              <input
                type="file"
                accept="video/*"
                className="file-input"
                onChange={handleVideoChange}
              />
              <p className="form-hint">Short walkthrough videos work best. Max 50MB recommended.</p>
              {videoPreview && (
                <div className="media-preview__video">
                  <video src={videoPreview} controls />
                  <button type="button" className="media-preview__remove-video" onClick={removeVideo}>Remove Video</button>
                </div>
              )}
            </div>

            {errors.media && <p className="form-error">{errors.media}</p>}
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
            <div className="add-listing-page__progress">{uploadProgress}</div>
          )}

          <button type="submit" disabled={saving}>
            {saving ? uploadProgress || "Uploading..." : "Submit Listing"}
          </button>

        </form>
      </section>
    </main>
  );
}