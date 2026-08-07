"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createListing } from "@/lib/firestoreListings";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { LOCATIONS, UST_GATE_AREAS, OTHER_PH_AREAS } from "@/lib/locations";
import { trackEvent } from "@/lib/posthog";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";
import "@/styles/add-listing.css";

const STEPS = [
  { id: 1, label: "The Basics" },
  { id: 2, label: "Location" },
  { id: 3, label: "Costs & Details" },
  { id: 4, label: "Media & Contact" },
];

const initialForm = {
  title:         "",
  price:         "",
  location:      "",
  address:       "",
  type:          "",
  beds:          "1",
  baths:         "1",
  furnishing:    "",
  availability:  "",
  paymentTerms:  "",
  cautionFee:    "",
  legalFee:      "",
  agencyFee:     "",
  serviceCharge: "",
  amenities:     "",
  contact:       "",
  description:   "",
};

export default function AddListingPage() {
  const router = useRouter();
  const { user, userRole } = useAuth();

  const [step, setStep]                     = useState(1);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [videoThumbnailPreview, setVideoThumbnailPreview] = useState(null);
  const [formData, setFormData]             = useState(initialForm);
  const [imageFiles, setImageFiles]         = useState([]);
  const [imagePreviews, setImagePreviews]   = useState([]);
  const [videoFile, setVideoFile]           = useState(null);
  const [videoPreview, setVideoPreview]     = useState(null);
  const [errors, setErrors]                 = useState({});
  const [submitted, setSubmitted]           = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  
  const totalMoveInCost = useMemo(() => {
    const rent    = Number(formData.price)         || 0;
    const caution = Number(formData.cautionFee)    || 0;
    const legal   = Number(formData.legalFee)      || 0;
    const agency  = Number(formData.agencyFee)     || 0;
    const service = Number(formData.serviceCharge) || 0;
    return rent + caution + legal + agency + service;
  }, [formData.price, formData.cautionFee, formData.legalFee, formData.agencyFee, formData.serviceCharge]);

  if (!user || userRole !== "landlord") return null;

  const selectedLocation = LOCATIONS.find((l) => l.value === formData.location);

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
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleVideoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    try {
      const thumbBlob = await extractVideoThumbnail(file);
      setVideoThumbnail(thumbBlob);
      setVideoThumbnailPreview(URL.createObjectURL(thumbBlob));
    } catch (err) {
      console.warn("Could not extract video thumbnail:", err);
    }
  }

  function removeVideo() {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoThumbnail(null);
    setVideoThumbnailPreview(null);
  }

  // Per-step validation
  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!formData.title.trim())      e.title = "Give your property a title";
      if (!formData.type.trim())       e.type  = "Select a property type";
      if (!formData.price.trim())      e.price = "Enter the annual rent";
      else if (Number(formData.price) <= 0) e.price = "Price must be greater than 0";
    }
    if (s === 2) {
      if (!formData.location)          e.location = "Select an area";
      if (!formData.address.trim())    e.address  = "Enter the full street address";
    }
    if (s === 3) {
      if (!formData.availability.trim()) e.availability = "Select availability";
      if (!formData.furnishing.trim())   e.furnishing   = "Select furnishing status";
      if (!formData.paymentTerms.trim()) e.paymentTerms = "Describe payment terms";
    }
    if (s === 4) {
      if (imageFiles.length === 0 && !videoFile) e.media = "Upload at least one photo or video";
      if (!formData.contact.trim())    e.contact = "Enter a contact number";
      else if (formData.contact.trim().length < 11) e.contact = "Enter a valid phone number";
      if (!formData.description.trim()) e.description = "Write a short description";
      else if (formData.description.trim().length < 20) e.description = "At least 20 characters please";
    }
    return e;
  }

  function goNext() {
    const e = validateStep(step);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const finalErrors = validateStep(4);
    if (Object.keys(finalErrors).length > 0) { setErrors(finalErrors); return; }

    setSaving(true);
    try {
      const imageUrls = [];
      for (let i = 0; i < imageFiles.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${imageFiles.length}…`);
        const url = await uploadToCloudinary(imageFiles[i]);
        imageUrls.push(url);
      }

      let videoUrl = null;
      let videoThumbnailUrl = null;
      if (videoFile) {
        setUploadProgress("Uploading video…");
        videoUrl = await uploadToCloudinary(videoFile);
        if (videoThumbnail) {
          setUploadProgress("Saving thumbnail…");
          const thumbFile = new File([videoThumbnail], "thumb.jpg", { type: "image/jpeg" });
          videoThumbnailUrl = await uploadToCloudinary(thumbFile);
        }
      }

      setUploadProgress("Saving listing…");

      const mapBase = selectedLocation?.mapQuery || formData.location + ", Port Harcourt, Nigeria";
      const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(formData.address.trim() + ", " + mapBase);

      await createListing({
        title:          formData.title.trim(),
        price:          Number(formData.price),
        location:       formData.location,
        address:        formData.address.trim(),
        mapsUrl,
        type:           formData.type.trim(),
        beds:           formData.beds,
        baths:          formData.baths,
        furnishing:     formData.furnishing,
        availability:   formData.availability,
        paymentTerms:   formData.paymentTerms.trim(),
        cautionFee:     formData.cautionFee     ? Number(formData.cautionFee)    : 0,
        legalFee:       formData.legalFee       ? Number(formData.legalFee)      : 0,
        agencyFee:      formData.agencyFee      ? Number(formData.agencyFee)     : 0,
        serviceCharge:  formData.serviceCharge  ? Number(formData.serviceCharge) : 0,
        totalMoveInCost,
        amenities:      formData.amenities.trim(),
        contact:        formData.contact.trim(),
        description:    formData.description.trim(),
        images:         imageUrls,
        image:          imageUrls[0] || videoThumbnailUrl || null,
        videoUrl:       videoUrl || null,
        videoThumbnailUrl: videoThumbnailUrl || null,
        verified:       false,
        featured:       false,
        landlordId:     user.uid,
        landlordName:   user.displayName,
      });

      trackEvent("listing_created", {
        location: formData.location, type: formData.type,
        price: formData.price, availability: formData.availability,
        hasImages: imageUrls.length > 0, hasVideo: !!videoUrl,
      });

      setSubmitted(true);
      setErrors({});
      setFormData(initialForm);
      setImageFiles([]); setImagePreviews([]);
      setVideoFile(null); setVideoPreview(null);
      setUploadProgress("");
      setTimeout(() => router.push("/listings"), 1500);
    } catch (err) {
      console.error("Error creating listing:", err);
      setErrors({ general: "Something went wrong. Try again." });
      setUploadProgress("");
    } finally {
      setSaving(false);
    }
  }

  const ustAreas   = LOCATIONS.filter((l) => UST_GATE_AREAS.includes(l.value));
  const otherAreas = LOCATIONS.filter((l) => OTHER_PH_AREAS.includes(l.value));

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <main className="alp">

      {/* ── Sticky progress header ── */}
      <div className="alp__header">
        <div className="alp__header-top">
          <span className="alp__step-label">
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </span>
          {step > 1 && !submitted && (
            <button type="button" className="alp__back-link" onClick={goBack}>
              ← Back
            </button>
          )}
        </div>
        <div className="alp__progress-track">
          <div className="alp__progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="alp__body">

        {submitted && (
          <div className="alp__success">
            <span className="alp__success-icon">✓</span>
            Listing submitted! Redirecting you now…
          </div>
        )}

        {errors.general && (
          <div className="alp__error-banner">{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── STEP 1: The Basics ── */}
          {step === 1 && (
            <div className="alp__step">
              <h1 className="alp__step-title">What are you listing?</h1>
              <p className="alp__step-sub">A few quick details to get started.</p>

              <div className="alp__field">
                <label>Property title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Bright self-contain near UST Back Gate"
                  value={formData.title}
                  onChange={handleChange}
                  autoFocus
                />
                {errors.title && <span className="alp__err">{errors.title}</span>}
              </div>

              <div className="alp__field">
                <label>Property type</label>
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
                {errors.type && <span className="alp__err">{errors.type}</span>}
              </div>

              <div className="alp__field">
                <label>Annual rent (₦)</label>
                <input
                  type="number"
                  name="price"
                  placeholder="e.g. 300000"
                  value={formData.price}
                  onChange={handleChange}
                  inputMode="numeric"
                />
                {errors.price && <span className="alp__err">{errors.price}</span>}
              </div>

              {/* Beds + Baths: compact, low visual weight */}
              <div className="alp__row alp__row--sm">
                <div className="alp__field">
                  <label className="alp__label-sm">Bedrooms</label>
                  <select name="beds" value={formData.beds} onChange={handleChange}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div className="alp__field">
                  <label className="alp__label-sm">Bathrooms</label>
                  <select name="baths" value={formData.baths} onChange={handleChange}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3+</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Location ── */}
          {step === 2 && (
            <div className="alp__step">
              <h1 className="alp__step-title">Where is it?</h1>
              <p className="alp__step-sub">Help tenants find it on the map.</p>

              <div className="alp__field">
                <label>Area / neighbourhood</label>
                <select name="location" value={formData.location} onChange={handleChange}>
                  <option value="">Select area</option>
                  <optgroup label="UST Gate Areas">
                    {ustAreas.map((loc) => (
                      <option key={loc.value} value={loc.value}>{loc.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Port Harcourt Areas">
                    {otherAreas.map((loc) => (
                      <option key={loc.value} value={loc.value}>{loc.label}</option>
                    ))}
                  </optgroup>
                </select>
                {selectedLocation && (
                  <span className="alp__hint">{selectedLocation.hint}</span>
                )}
                {errors.location && <span className="alp__err">{errors.location}</span>}
              </div>

              <div className="alp__field">
                <label>Full street address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. No. 5 Alakahia Road, Choba"
                  value={formData.address}
                  onChange={handleChange}
                />
                <span className="alp__hint">Used to generate a Google Maps link</span>
                {errors.address && <span className="alp__err">{errors.address}</span>}
              </div>
            </div>
          )}

          {/* ── STEP 3: Costs & Details ── */}
          {step === 3 && (
            <div className="alp__step">
              <h1 className="alp__step-title">Costs & details</h1>
              <p className="alp__step-sub">Transparency here builds trust with tenants.</p>

              <div className="alp__row">
                <div className="alp__field">
                  <label>Availability</label>
                  <select name="availability" value={formData.availability} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Available Now">Available Now</option>
                    <option value="Available Soon">Available Soon</option>
                    <option value="Not Available">Not Available</option>
                  </select>
                  {errors.availability && <span className="alp__err">{errors.availability}</span>}
                </div>
                <div className="alp__field">
                  <label>Furnishing</label>
                  <select name="furnishing" value={formData.furnishing} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="Furnished">Furnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                  {errors.furnishing && <span className="alp__err">{errors.furnishing}</span>}
                </div>
              </div>

              <div className="alp__field">
                <label>Payment terms</label>
                <input
                  type="text"
                  name="paymentTerms"
                  placeholder="e.g. 1 year upfront, 6 months accepted"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                />
                {errors.paymentTerms && <span className="alp__err">{errors.paymentTerms}</span>}
              </div>

              {/* Fees — labeled as optional, compact */}
              <div className="alp__fees-label">
                Extra move-in fees <span className="alp__optional">optional — enter 0 to skip</span>
              </div>
              <div className="alp__row">
                <div className="alp__field">
                  <label className="alp__label-sm">Caution fee (₦)</label>
                  <input type="number" name="cautionFee" placeholder="0" value={formData.cautionFee} onChange={handleChange} inputMode="numeric" />
                </div>
                <div className="alp__field">
                  <label className="alp__label-sm">Legal fee (₦)</label>
                  <input type="number" name="legalFee" placeholder="0" value={formData.legalFee} onChange={handleChange} inputMode="numeric" />
                </div>
              </div>
              <div className="alp__row">
                <div className="alp__field">
                  <label className="alp__label-sm">Agency fee (₦)</label>
                  <input type="number" name="agencyFee" placeholder="0" value={formData.agencyFee} onChange={handleChange} inputMode="numeric" />
                </div>
                <div className="alp__field">
                  <label className="alp__label-sm">Service charge (₦)</label>
                  <input type="number" name="serviceCharge" placeholder="0" value={formData.serviceCharge} onChange={handleChange} inputMode="numeric" />
                </div>
              </div>

              {totalMoveInCost > 0 && (
                <div className="alp__total">
                  <div className="alp__total-rows">
                    {Number(formData.price) > 0 && (
                      <div className="alp__total-row"><span>Annual Rent</span><span>₦{Number(formData.price).toLocaleString()}</span></div>
                    )}
                    {Number(formData.cautionFee) > 0 && (
                      <div className="alp__total-row"><span>Caution Fee</span><span>₦{Number(formData.cautionFee).toLocaleString()}</span></div>
                    )}
                    {Number(formData.legalFee) > 0 && (
                      <div className="alp__total-row"><span>Legal Fee</span><span>₦{Number(formData.legalFee).toLocaleString()}</span></div>
                    )}
                    {Number(formData.agencyFee) > 0 && (
                      <div className="alp__total-row"><span>Agency Fee</span><span>₦{Number(formData.agencyFee).toLocaleString()}</span></div>
                    )}
                    {Number(formData.serviceCharge) > 0 && (
                      <div className="alp__total-row"><span>Service Charge</span><span>₦{Number(formData.serviceCharge).toLocaleString()}</span></div>
                    )}
                  </div>
                  <div className="alp__total-final">
                    <span>Total move-in cost</span>
                    <strong>₦{totalMoveInCost.toLocaleString()}</strong>
                  </div>
                </div>
              )}

              <div className="alp__field">
                <label>Amenities <span className="alp__optional">optional</span></label>
                <input
                  type="text"
                  name="amenities"
                  placeholder="Running water, Prepaid meter, Parking…"
                  value={formData.amenities}
                  onChange={handleChange}
                />
                <span className="alp__hint">Separate with commas</span>
              </div>
            </div>
          )}

          {/* ── STEP 4: Media & Contact ── */}
          {step === 4 && (
            <div className="alp__step">
              <h1 className="alp__step-title">Photos & final details</h1>
              <p className="alp__step-sub">Good photos get 3× more interest.</p>

              {/* Photos */}
              <div className="alp__field">
                <label>Property photos <span className="alp__optional">up to 5</span></label>
                <label className="alp__upload-btn" htmlFor="photo-input">
                  + Choose photos
                </label>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="alp__file-hidden"
                  onChange={handleImageChange}
                />
                {imagePreviews.length > 0 && (
                  <div className="alp__photo-grid">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="alp__photo-item">
                        <img src={src} alt={"Photo " + (i + 1)} />
                        <button type="button" className="alp__photo-remove" onClick={() => removeImage(i)}>✕</button>
                        {i === 0 && <span className="alp__photo-main">Cover</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video */}
              <div className="alp__field">
                <label>Walkthrough video <span className="alp__optional">optional — max 50MB</span></label>
                {!videoFile ? (
                  <>
                    <label className="alp__upload-btn alp__upload-btn--ghost" htmlFor="video-input">
                      + Add video
                    </label>
                    <input
                      id="video-input"
                      type="file"
                      accept="video/*"
                      className="alp__file-hidden"
                      onChange={handleVideoChange}
                    />
                  </>
                ) : (
                  <div className="alp__video-wrap">
                    {videoThumbnailPreview && (
                      <div className="alp__thumb-wrap">
                        <img src={videoThumbnailPreview} alt="Thumbnail" />
                        <span className="alp__thumb-tag">Thumbnail</span>
                      </div>
                    )}
                    <video src={videoPreview} controls />
                    <button type="button" className="alp__video-remove" onClick={removeVideo}>
                      Remove video
                    </button>
                  </div>
                )}
              </div>

              {errors.media && <span className="alp__err">{errors.media}</span>}

              <div className="alp__field">
                <label>Contact number</label>
                <input
                  type="tel"
                  name="contact"
                  placeholder="08012345678"
                  value={formData.contact}
                  onChange={handleChange}
                  inputMode="tel"
                />
                {errors.contact && <span className="alp__err">{errors.contact}</span>}
              </div>

              <div className="alp__field">
                <label>About this property</label>
                <textarea
                  rows="5"
                  name="description"
                  placeholder="Describe the property, the neighbourhood, proximity to landmarks…"
                  value={formData.description}
                  onChange={handleChange}
                />
                {errors.description && <span className="alp__err">{errors.description}</span>}
              </div>

              {uploadProgress && (
                <div className="alp__progress">{uploadProgress}</div>
              )}
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="alp__nav">
            {step < 4 ? (
              <button type="button" className="alp__btn-next" onClick={goNext}>
                Continue →
              </button>
            ) : (
              <button type="submit" className="alp__btn-next" disabled={saving}>
                {saving ? uploadProgress || "Uploading…" : "Submit listing"}
              </button>
            )}
          </div>

        </form>
      </div>
    </main>
  );
}