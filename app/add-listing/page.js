"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createListing } from "@/lib/firestoreListings";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  LOCATIONS,
  UST_GATE_AREAS,
  OTHER_PH_AREAS,
} from "@/lib/locations";
import { trackEvent } from "@/lib/posthog";
import { extractVideoThumbnail } from "@/lib/videoThumbnail";
import "@/styles/add-listing.css";

const PROPERTY_TYPES = [
  "Self Contain",
  "Single Room",
  "Mini Flat",
  "1 Bedroom Flat",
  "2 Bedroom Flat",
  "3 Bedroom Flat",
  "Shared Room",
  "Studio Apartment",
];

// Must match the Firestore rules whitelist exactly:
// userDoc().data.role in ["student", "agent", "landlord"]
const ALLOWED_OWNER_TYPES = ["student", "agent", "landlord"];

const initialForm = {
  price: "",
  location: "",
  address: "",
  type: "",
  beds: "1",
  baths: "1",
  furnishing: "",
  availability: "Available Now",
  paymentTerms: "",
  cautionFee: "",
  legalFee: "",
  agencyFeePercent: "",
  serviceCharge: "",
  amenities: "",
  contact: "",
  caption: "",
};

export default function AddListingPage() {
  const router = useRouter();
  const { user, userRole } = useAuth();

  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [videoThumbnailPreview, setVideoThumbnailPreview] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [showMore, setShowMore] = useState(false);

  const agencyFeeAmount = useMemo(() => {
    const rent = Number(formData.price) || 0;
    const percent = Number(formData.agencyFeePercent) || 0;

    return Math.round((rent * percent) / 100);
  }, [formData.price, formData.agencyFeePercent]);

  const totalMoveInCost = useMemo(() => {
    const rent = Number(formData.price) || 0;
    const caution = Number(formData.cautionFee) || 0;
    const legal = Number(formData.legalFee) || 0;
    const service = Number(formData.serviceCharge) || 0;

    return rent + caution + legal + agencyFeeAmount + service;
  }, [
    formData.price,
    formData.cautionFee,
    formData.legalFee,
    formData.serviceCharge,
    agencyFeeAmount,
  ]);

  const selectedLocation = LOCATIONS.find(
    (l) => l.value === formData.location
  );

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      general: "",
    }));
  }

  function selectType(type) {
    setFormData((prev) => ({
      ...prev,
      type,
    }));

    setErrors((prev) => ({
      ...prev,
      type: "",
      general: "",
    }));
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0, 5);

    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));

    setErrors((prev) => ({
      ...prev,
      media: "",
      general: "",
    }));
  }

  function removeImage(index) {
    setImageFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setImagePreviews((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  async function handleVideoChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));

    setErrors((prev) => ({
      ...prev,
      media: "",
      general: "",
    }));

    try {
      const thumbBlob = await extractVideoThumbnail(file);

      setVideoThumbnail(thumbBlob);
      setVideoThumbnailPreview(
        URL.createObjectURL(thumbBlob)
      );
    } catch (err) {
      console.warn(
        "Could not extract video thumbnail:",
        err
      );
    }
  }

  function removeVideo() {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoThumbnail(null);
    setVideoThumbnailPreview(null);
  }

  function validate() {
    const e = {};

    if (imageFiles.length === 0 && !videoFile) {
      e.media = "Add at least one photo or video";
    }

    if (!formData.type) {
      e.type = "Pick a property type";
    }

    if (!formData.price.trim()) {
      e.price = "Enter the annual rent";
    } else if (Number(formData.price) <= 0) {
      e.price = "Price must be greater than 0";
    }

    if (!formData.location) {
      e.location = "Select an area";
    }

    if (!formData.contact.trim()) {
      e.contact = "Enter a contact number";
    } else if (formData.contact.trim().length < 11) {
      e.contact = "Enter a valid phone number";
    }

    if (!formData.caption.trim()) {
      e.caption = "Say a bit about the place";
    } else if (formData.caption.trim().length < 10) {
      e.caption = "A little more detail please";
    }

    return e;
  }

  function scrollToFirstError(errs) {
    const firstKey = Object.keys(errs)[0];

    if (!firstKey) return;

    const el = document.querySelector(
      `[data-field="${firstKey}"]`
    );

    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const finalErrors = validate();

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      scrollToFirstError(finalErrors);
      return;
    }

    if (!user) {
      setErrors({
        general: "You must be logged in to post a listing.",
      });
      return;
    }

    if (!userRole) {
      setErrors({
        general:
          "We couldn't determine your account type. Please try logging out and back in, then post again.",
      });
      return;
    }

    // ─────────────────────────────────────────────────────────
    // GUARD: Firestore rules only accept ownerType values of
    // "user" | "agent" | "landlord" (see canPostListing() in
    // firestore.rules). If the role on /users/{uid} was written
    // by an older signup flow with a different value (e.g.
    // "student", "Landlord", or with stray whitespace), Firestore
    // will reject the write with permission-denied and the
    // console error alone won't tell you why.
    //
    // This check fails fast, client-side, with a message that
    // actually tells you what's wrong.
    // ─────────────────────────────────────────────────────────
    console.log("DEBUG ownerType being sent:", JSON.stringify(userRole));

    if (!ALLOWED_OWNER_TYPES.includes(userRole)) {
      setErrors({
        general: `Your account role ("${userRole}") isn't recognized by the system. Expected one of: ${ALLOWED_OWNER_TYPES.join(
          ", "
        )}. Please contact support or check your account's role field.`,
      });
      return;
    }

    setSaving(true);

    try {
      const imageUrls = [];

      for (let i = 0; i < imageFiles.length; i++) {
        setUploadProgress(
          `Sending photo ${i + 1} of ${imageFiles.length}…`
        );

        const url = await uploadToCloudinary(
          imageFiles[i]
        );

        imageUrls.push(url);
      }

      let videoUrl = null;
      let videoThumbnailUrl = null;

      if (videoFile) {
        setUploadProgress("Sending video…");

        videoUrl = await uploadToCloudinary(videoFile);

        if (videoThumbnail) {
          setUploadProgress("Saving thumbnail…");

          const thumbFile = new File(
            [videoThumbnail],
            "thumb.jpg",
            {
              type: "image/jpeg",
            }
          );

          videoThumbnailUrl =
            await uploadToCloudinary(thumbFile);
        }
      }

      setUploadProgress("Posting listing…");

      const mapBase =
        selectedLocation?.mapQuery ||
        formData.location +
          ", Port Harcourt, Nigeria";

      const mapsUrl =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(
          (formData.address.trim()
            ? formData.address.trim() + ", "
            : "") + mapBase
        );

      const title = `${formData.type} in ${
        selectedLocation?.label || formData.location
      }`;

      // ─────────────────────────────────────────────────────────
      // DEBUG: log the exact values Firestore rules will check,
      // right before the write. If permission-denied happens again,
      // these four lines tell us which condition in
      // `allow create` on /listings failed:
      //   - title / title.length   -> title is string && title.size() > 3
      //   - price / typeof price   -> price is number && price > 0
      //   - ownerId                -> must equal request.auth.uid
      //   - ownerType              -> must equal userDoc().data.role
      // ─────────────────────────────────────────────────────────
      console.log("DEBUG title:", JSON.stringify(title), "length:", title.length);
      console.log("DEBUG price:", Number(formData.price), "typeof:", typeof Number(formData.price));
      console.log("DEBUG ownerId:", user.uid);
      console.log("DEBUG ownerType:", JSON.stringify(userRole));

      /*
       * IMPORTANT:
       *
       * Firestore rules require:
       *
       * ownerId   == authenticated user's UID
       * ownerType == the user's ACTUAL role stored on their
       *              /users/{uid} Firestore doc ("user" | "agent" | "landlord")
       *
       * Students, agents, and landlords can all post listings now,
       * so ownerType must come from the real, live userRole value
       * from AuthContext — never hardcoded — or the security rules
       * will reject the write with permission-denied.
       *
       * landlordId / landlordName are kept as legacy fields
       * so existing Rezidence code continues to work, regardless
       * of the poster's actual role.
       */

      await createListing({
        title,

        price: Number(formData.price),

        location: formData.location,

        address: formData.address.trim(),

        mapsUrl,

        type: formData.type,

        beds: formData.beds,

        baths: formData.baths,

        furnishing: formData.furnishing,

        availability: formData.availability,

        paymentTerms:
          formData.paymentTerms.trim(),

        cautionFee: formData.cautionFee
          ? Number(formData.cautionFee)
          : 0,

        legalFee: formData.legalFee
          ? Number(formData.legalFee)
          : 0,

        agencyFeePercent:
          formData.agencyFeePercent
            ? Number(formData.agencyFeePercent)
            : 0,

        agencyFee: agencyFeeAmount,

        serviceCharge: formData.serviceCharge
          ? Number(formData.serviceCharge)
          : 0,

        totalMoveInCost,

        amenities:
          formData.amenities.trim(),

        contact:
          formData.contact.trim(),

        description:
          formData.caption.trim(),

        images: imageUrls,

        image:
          imageUrls[0] ||
          videoThumbnailUrl ||
          null,

        videoUrl: videoUrl || null,

        videoThumbnailUrl:
          videoThumbnailUrl || null,

        verified: false,

        featured: false,

        // ─────────────────────────────
        // Firestore security-rule fields
        // ─────────────────────────────
        ownerId: user.uid,
        ownerType: userRole,
        ownerName: user.displayName || "",

        // ─────────────────────────────
        // Existing compatibility fields
        // ─────────────────────────────
        landlordId: user.uid,
        landlordName:
          user.displayName || "",
      });

      trackEvent("listing_created", {
        location: formData.location,
        type: formData.type,
        price: formData.price,
        ownerType: userRole,
        availability:
          formData.availability,
        hasImages: imageUrls.length > 0,
        hasVideo: !!videoUrl,
      });

      setSubmitted(true);
      setErrors({});

      setFormData(initialForm);

      setImageFiles([]);
      setImagePreviews([]);

      setVideoFile(null);
      setVideoPreview(null);

      setVideoThumbnail(null);
      setVideoThumbnailPreview(null);

      setUploadProgress("");

      setTimeout(() => {
        router.push("/listings");
      }, 1200);
    } catch (err) {
      // Log full detail to console for debugging.
      console.error("Error creating listing:", err);
      console.error("DEBUG err.code:", err?.code);
      console.error("DEBUG err.message:", err?.message);

      // ─────────────────────────────────────────────────────────
      // Surface the real code/message on screen too — not just in
      // console — so we're not depending on someone pasting console
      // output every time this fails. Firestore's permission-denied
      // is intentionally vague about WHICH rule condition failed, so
      // this at least confirms which broad category we're dealing
      // with instead of guessing blind.
      // ─────────────────────────────────────────────────────────
      let message = "Something went wrong. Try again.";

      if (err?.code === "permission-denied") {
        message =
          "You don't have permission to create this listing. This usually means your account role doesn't match what's stored in the database — please contact support and mention error code: permission-denied.";
      } else if (err?.code) {
        message = `Something went wrong (${err.code}). Please try again or contact support if this keeps happening.`;
      } else if (err?.message) {
        message = `Something went wrong: ${err.message}`;
      }

      setErrors({ general: message });

      setUploadProgress("");
    } finally {
      setSaving(false);
    }
  }

  const ustAreas = LOCATIONS.filter((l) =>
    UST_GATE_AREAS.includes(l.value)
  );

  const otherAreas = LOCATIONS.filter((l) =>
    OTHER_PH_AREAS.includes(l.value)
  );

  return (
    <main className="alp">
      <div className="alp__header">
        <span className="alp__step-label">
          New listing
        </span>
      </div>

      <div className="alp__body">
        {submitted && (
          <div className="alp__success">
            <span className="alp__success-icon">
              ✓
            </span>
            Listing posted! Taking you there
            now…
          </div>
        )}

        {errors.general && (
          <div className="alp__error-banner">
            {errors.general}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="alp__compose"
        >
          {/* ── Attach ── */}
          <div
            className="alp__field"
            data-field="media"
          >
            <div className="alp__media-row">
              <label
                className="alp__media-add"
                htmlFor="photo-input"
              >
                <span className="alp__media-add-icon">
                  +
                </span>
                <span className="alp__media-add-text">
                  Photos
                </span>
              </label>

              {imagePreviews.map((src, i) => (
                <div
                  key={i}
                  className="alp__media-item"
                >
                  <img
                    src={src}
                    alt={
                      "Photo " + (i + 1)
                    }
                  />

                  <button
                    type="button"
                    className="alp__photo-remove"
                    onClick={() =>
                      removeImage(i)
                    }
                  >
                    ✕
                  </button>

                  {i === 0 && (
                    <span className="alp__photo-main">
                      Cover
                    </span>
                  )}
                </div>
              ))}

              {videoFile && (
                <div className="alp__media-item alp__media-item--video">
                  {videoThumbnailPreview ? (
                    <img
                      src={
                        videoThumbnailPreview
                      }
                      alt="Video thumbnail"
                    />
                  ) : (
                    <video
                      src={videoPreview}
                      muted
                    />
                  )}

                  <span className="alp__media-play">
                    ▶
                  </span>

                  <button
                    type="button"
                    className="alp__photo-remove"
                    onClick={removeVideo}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <input
              id="photo-input"
              type="file"
              accept="image/*"
              multiple
              className="alp__file-hidden"
              onChange={handleImageChange}
            />

            {!videoFile && (
              <label
                className="alp__media-video-link"
                htmlFor="video-input"
              >
                + Add a walkthrough video{" "}
                <span className="alp__optional">
                  optional
                </span>
              </label>
            )}

            <input
              id="video-input"
              type="file"
              accept="video/*"
              className="alp__file-hidden"
              onChange={handleVideoChange}
            />

            {errors.media && (
              <span className="alp__err">
                {errors.media}
              </span>
            )}
          </div>

          {/* ── Rent ── */}
          <div
            className="alp__field"
            data-field="price"
          >
            <label>Annual rent</label>

            <div className="alp__price-input alp__price-input--hero">
              <span className="alp__price-prefix">
                ₦
              </span>

              <input
                type="number"
                name="price"
                placeholder="300,000"
                value={formData.price}
                onChange={handleChange}
                inputMode="numeric"
                autoFocus
              />
            </div>

            {errors.price && (
              <span className="alp__err">
                {errors.price}
              </span>
            )}
          </div>

          {/* ── Agent fee ── */}
          <div className="alp__field">
            <label>
              Agent fee{" "}
              <span className="alp__optional">
                optional — 0 if none
              </span>
            </label>

            <div className="alp__percent-input">
              <input
                type="number"
                name="agencyFeePercent"
                placeholder="10"
                value={
                  formData.agencyFeePercent
                }
                onChange={handleChange}
                inputMode="numeric"
              />

              <span className="alp__percent-suffix">
                %
              </span>
            </div>
          </div>

          {Number(formData.price) > 0 && (
            <div className="alp__total alp__total--top">
              <div className="alp__total-final">
                <span>Total for tenant</span>

                <strong>
                  ₦
                  {totalMoveInCost.toLocaleString()}
                </strong>
              </div>

              {agencyFeeAmount > 0 && (
                <span className="alp__hint">
                  Rent ₦
                  {Number(
                    formData.price
                  ).toLocaleString()}{" "}
                  + agent fee ₦
                  {agencyFeeAmount.toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* ── Type ── */}
          <div
            className="alp__field"
            data-field="type"
          >
            <label>What is it?</label>

            <div className="alp__chip-row">
              {PROPERTY_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={
                    "alp__chip" +
                    (formData.type === t
                      ? " alp__chip--active"
                      : "")
                  }
                  onClick={() =>
                    selectType(t)
                  }
                  aria-pressed={
                    formData.type === t
                  }
                >
                  {t}
                </button>
              ))}
            </div>

            {errors.type && (
              <span className="alp__err">
                {errors.type}
              </span>
            )}
          </div>

          {/* ── Area ── */}
          <div
            className="alp__field"
            data-field="location"
          >
            <label>Area</label>

            <select
              name="location"
              value={formData.location}
              onChange={handleChange}
            >
              <option value="">
                Select area
              </option>

              <optgroup label="UST Gate Areas">
                {ustAreas.map((loc) => (
                  <option
                    key={loc.value}
                    value={loc.value}
                  >
                    {loc.label}
                  </option>
                ))}
              </optgroup>

              <optgroup label="Other Port Harcourt Areas">
                {otherAreas.map((loc) => (
                  <option
                    key={loc.value}
                    value={loc.value}
                  >
                    {loc.label}
                  </option>
                ))}
              </optgroup>
            </select>

            {selectedLocation && (
              <span className="alp__hint">
                {selectedLocation.hint}
              </span>
            )}

            {errors.location && (
              <span className="alp__err">
                {errors.location}
              </span>
            )}
          </div>

          {/* ── Contact ── */}
          <div
            className="alp__field"
            data-field="contact"
          >
            <label>Contact number</label>

            <input
              type="tel"
              name="contact"
              placeholder="08012345678"
              value={formData.contact}
              onChange={handleChange}
              inputMode="tel"
            />

            {errors.contact && (
              <span className="alp__err">
                {errors.contact}
              </span>
            )}
          </div>

          {/* ── Caption ── */}
          <div
            className="alp__field"
            data-field="caption"
          >
            <label>Add a caption</label>

            <textarea
              className="alp__caption"
              name="caption"
              placeholder="Tell tenants about the place — more detailed location if area isnt available above, condition, lights, move in date, condition/s if any"
              value={formData.caption}
              onChange={handleChange}
            />

            {errors.caption && (
              <span className="alp__err">
                {errors.caption}
              </span>
            )}
          </div>

          {/* ── More details ── */}
          <div className="alp__more">
            <button
              type="button"
              className="alp__more-toggle"
              onClick={() =>
                setShowMore((v) => !v)
              }
              aria-expanded={showMore}
            >
              <span>
                {showMore
                  ? "Hide extra details"
                  : "Add more details"}
              </span>

              <span className="alp__optional">
                optional — beds, fees,
                furnishing…
              </span>

              <span
                className={
                  "alp__chevron" +
                  (showMore
                    ? " alp__chevron--open"
                    : "")
                }
              >
                ⌄
              </span>
            </button>

            {showMore && (
              <div className="alp__more-body">
                <div className="alp__field">
                  <label>
                    Street address{" "}
                    <span className="alp__optional">
                      optional — helps tenants
                      find it on the map
                    </span>
                  </label>

                  <input
                    type="text"
                    name="address"
                    placeholder="e.g. No. 5 Alakahia Road, Choba"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="alp__row alp__row--sm">
                  <div className="alp__field">
                    <label className="alp__label-sm">
                      Bedrooms
                    </label>

                    <select
                      name="beds"
                      value={formData.beds}
                      onChange={handleChange}
                    >
                      <option value="1">
                        1
                      </option>
                      <option value="2">
                        2
                      </option>
                      <option value="3">
                        3
                      </option>
                      <option value="4">
                        4+
                      </option>
                    </select>
                  </div>

                  <div className="alp__field">
                    <label className="alp__label-sm">
                      Bathrooms
                    </label>

                    <select
                      name="baths"
                      value={formData.baths}
                      onChange={handleChange}
                    >
                      <option value="1">
                        1
                      </option>
                      <option value="2">
                        2
                      </option>
                      <option value="3">
                        3+
                      </option>
                    </select>
                  </div>
                </div>

                <div className="alp__row">
                  <div className="alp__field">
                    <label>
                      Availability{" "}
                      <span className="alp__optional">
                        optional
                      </span>
                    </label>

                    <select
                      name="availability"
                      value={
                        formData.availability
                      }
                      onChange={handleChange}
                    >
                      <option value="Available Now">
                        Available Now
                      </option>
                      <option value="Available Soon">
                        Available Soon
                      </option>
                      <option value="Not Available">
                        Not Available
                      </option>
                    </select>
                  </div>

                  <div className="alp__field">
                    <label>
                      Furnishing{" "}
                      <span className="alp__optional">
                        optional
                      </span>
                    </label>

                    <select
                      name="furnishing"
                      value={
                        formData.furnishing
                      }
                      onChange={handleChange}
                    >
                      <option value="">
                        Select
                      </option>
                      <option value="Furnished">
                        Furnished
                      </option>
                      <option value="Semi-Furnished">
                        Semi-Furnished
                      </option>
                      <option value="Unfurnished">
                        Unfurnished
                      </option>
                    </select>
                  </div>
                </div>

                <div className="alp__field">
                  <label>
                    Payment terms{" "}
                    <span className="alp__optional">
                      optional
                    </span>
                  </label>

                  <input
                    type="text"
                    name="paymentTerms"
                    placeholder="e.g. 1 year upfront, 6 months accepted"
                    value={
                      formData.paymentTerms
                    }
                    onChange={handleChange}
                  />
                </div>

                <div className="alp__fees-label">
                  Extra move-in fees{" "}
                  <span className="alp__optional">
                    enter 0 to skip
                  </span>
                </div>

                <div className="alp__row">
                  <div className="alp__field">
                    <label className="alp__label-sm">
                      Caution fee (₦)
                    </label>

                    <input
                      type="number"
                      name="cautionFee"
                      placeholder="0"
                      value={
                        formData.cautionFee
                      }
                      onChange={handleChange}
                      inputMode="numeric"
                    />
                  </div>

                  <div className="alp__field">
                    <label className="alp__label-sm">
                      Legal fee (₦)
                    </label>

                    <input
                      type="number"
                      name="legalFee"
                      placeholder="0"
                      value={
                        formData.legalFee
                      }
                      onChange={handleChange}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="alp__row">
                  <div className="alp__field">
                    <label className="alp__label-sm">
                      Service charge (₦)
                    </label>

                    <input
                      type="number"
                      name="serviceCharge"
                      placeholder="0"
                      value={
                        formData.serviceCharge
                      }
                      onChange={handleChange}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                {totalMoveInCost > 0 && (
                  <div className="alp__total">
                    <div className="alp__total-final">
                      <span>
                        Total move-in cost
                      </span>

                      <strong>
                        ₦
                        {totalMoveInCost.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="alp__field">
                  <label>
                    Amenities{" "}
                    <span className="alp__optional">
                      optional
                    </span>
                  </label>

                  <input
                    type="text"
                    name="amenities"
                    placeholder="Running water, Prepaid meter, Parking.."
                    value={
                      formData.amenities
                    }
                    onChange={handleChange}
                  />

                  <span className="alp__hint">
                    Separate with commas
                  </span>
                </div>
              </div>
            )}
          </div>

          {uploadProgress && (
            <div className="alp__progress">
              {uploadProgress}
            </div>
          )}

          <div className="alp__nav">
            <button
              type="submit"
              className="alp__btn-next"
              disabled={saving}
            >
              {saving
                ? uploadProgress ||
                  "Posting…"
                : "Post listing"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}