"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineCheckBadge,
  HiOutlineMapPin,
  HiOutlineHomeModern,
  HiOutlineHeart,
  HiHeart,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineBanknotes,
  HiOutlineSparkles,
  HiOutlineWrenchScrewdriver,
  HiOutlineShare,
  HiOutlineFlag,
  HiOutlineEye,
  HiOutlineCalendarDays,
  HiOutlinePlayCircle,
  HiOutlineCalculator,
  HiOutlineReceiptPercent,
  HiOutlineShieldCheck,
  HiOutlineBuildingOffice,
  HiOutlineCog6Tooth,
  HiOutlineClipboardDocumentCheck,
  HiOutlineUserCircle,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlinePhoto,
  HiOutlineCreditCard,
  HiOutlinePresentationChartBar,
} from "react-icons/hi2";
import {
  fetchListingById,
  updateListing,
  deleteListing,
  incrementViewCount,
  reportListing,
} from "@/lib/firestoreListings";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { useAuth } from "@/context/AuthContext";
import { isLandlordVerified } from "@/lib/verification";
import { trackEvent } from "@/lib/posthog";
import {
  fetchActiveReservationForListing,
  fetchStudentReservationForListing,
} from "@/lib/firestoreReservations";
import "@/styles/details-page.css";

const REPORT_CATEGORIES = [
  { value: "fake_listing", label: "Fake listing", desc: "This property doesn't exist or is misleading" },
  { value: "scam", label: "Scam / Fraud", desc: "Suspicious activity or fraudulent intent" },
  { value: "wrong_price", label: "Wrong price", desc: "Price is significantly different from reality" },
  { value: "already_rented", label: "Already rented", desc: "This property is no longer available" },
  { value: "bad_photos", label: "Misleading photos", desc: "Photos don't match the actual property" },
  { value: "inappropriate", label: "Inappropriate content", desc: "Content violates community guidelines" },
  { value: "other", label: "Other", desc: "Something else is wrong" },
];

const TABS = ["overview", "costs", "amenities", "location"];

export default function ListingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id;
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [listing, setListing] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeMedia, setActiveMedia] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [listingReserved, setListingReserved] = useState(false);
  const [studentHasReservation, setStudentHasReservation] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory] = useState("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    function handleFavoritesUpdate() { setFavorites(getFavorites()); }
    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () => window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
  }, []);

  useEffect(() => {
    async function loadListing() {
      if (!listingId) { setLoading(false); return; }
      try {
        const data = await fetchListingById(listingId);
        if (data && data.landlordId) {
          const verified = await isLandlordVerified(data.landlordId);
          setListing({ ...data, verified });
          setEditForm({ ...data, verified });
        } else {
          setListing(data);
          setEditForm(data);
        }
        const hasImagesOnLoad = (data?.images?.length > 0) || !!data?.image;
        if (!hasImagesOnLoad && data?.videoUrl) setShowVideo(true);
        try { await incrementViewCount(listingId); } catch (e) { }
      } catch (error) {
        console.error("Error fetching listing:", error);
        setListing(null);
      } finally {
        setLoading(false);
      }
    }
    loadListing();
  }, [listingId]);

  useEffect(() => {
    if (!listing) return;
    async function checkReservationStatus() {
      try {
        const [active, mine] = await Promise.all([
          fetchActiveReservationForListing(listingId),
          user ? fetchStudentReservationForListing(listingId, user.uid) : Promise.resolve(null),
        ]);
        if (active) setListingReserved(true);
        if (mine) setStudentHasReservation(true);
      } catch (e) { }
    }
    checkReservationStatus();
  }, [listing, user]);

  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") setShowReportModal(false); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setPaymentSuccess(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("reference");
      window.history.replaceState({}, "", url.toString());
      const t = setTimeout(() => setPaymentSuccess(false), 6000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <main className="dp">
        <div className="dp__state-wrap">
          <div className="dp__state-spinner" />
          <p className="dp__state-label">Loading property...</p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="dp">
        <motion.div className="dp__state-wrap" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <HiOutlineHomeModern className="dp__state-icon" />
          <h1 className="dp__state-title">Property not found</h1>
          <p className="dp__state-sub">This listing may have been removed or the link is invalid.</p>
          <Link href="/listings" className="dp__state-back">Browse all listings</Link>
        </motion.div>
      </main>
    );
  }

  const images = listing.images?.length > 0 ? listing.images : listing.image ? [listing.image] : [];
  const isOwner = user && user.uid === listing.landlordId;
  const saved = favorites.includes(listing.id);

  const hasCostBreakdown = listing.cautionFee !== undefined || listing.legalFee !== undefined || listing.agencyFee !== undefined || listing.serviceCharge;
  const totalMoveInCost = listing.totalMoveInCost ||
    (Number(listing.price) || 0) + (Number(listing.cautionFee) || 0) +
    (Number(listing.legalFee) || 0) + (Number(listing.agencyFee) || 0) +
    (Number(listing.serviceCharge) || 0);

  const mapsUrl = listing.mapsUrl ||
    (listing.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(listing.address + ", Port Harcourt, Nigeria") : null);

  function handleToggleFavorite() { setFavorites(toggleFavorite(listing.id)); }
  function handleEditChange(e) { setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

  async function handleSave() {
    setSaving(true);
    try {
      const newMapsUrl = editForm.address
        ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(editForm.address + ", Port Harcourt, Nigeria")
        : listing.mapsUrl || null;
      await updateListing(listingId, {
        title: editForm.title, price: editForm.price, location: editForm.location,
        address: editForm.address, mapsUrl: newMapsUrl, type: editForm.type,
        beds: editForm.beds, baths: editForm.baths, furnishing: editForm.furnishing,
        availability: editForm.availability, paymentTerms: editForm.paymentTerms,
        cautionFee: editForm.cautionFee, legalFee: editForm.legalFee,
        agencyFee: editForm.agencyFee, serviceCharge: editForm.serviceCharge,
        amenities: editForm.amenities, contact: editForm.contact, description: editForm.description,
      });
      setListing({ ...listing, ...editForm, mapsUrl: newMapsUrl });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating listing:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    setDeleting(true);
    try {
      await deleteListing(listingId);
      router.push("/listings");
    } catch (error) {
      console.error("Error deleting listing:", error);
      setDeleting(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: listing.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleReport() {
    if (!reportCategory) { setReportError("Please select a reason."); return; }
    setReportError("");
    setSubmittingReport(true);
    try {
      await reportListing(listingId, user?.uid, reportCategory, reportDetail);
      setReportSent(true);
      setShowReportModal(false);
      trackEvent("listing_reported", { listingId, listingTitle: listing.title, category: reportCategory });
    } catch (error) {
      if (error.message === "already_reported") {
        setReportError("You have already reported this listing.");
      } else {
        setReportError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmittingReport(false);
    }
  }

  function handleBookInspection() {
    if (!user) { router.push("/login"); return; }
    trackEvent("inspection_click", { listingId, listingTitle: listing.title, location: listing.location });
    router.push("/inspect/" + listingId);
  }

  function handlePayRent() {
    if (!user) { router.push("/login"); return; }
    trackEvent("pay_click", { listingId, listingTitle: listing.title });
    router.push("/pay/" + listingId);
  }

  function formatDate(ts) {
    if (!ts) return null;
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  function getDaysAgo(ts) {
    if (!ts) return null;
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "1d ago";
    return diff + "d ago";
  }

  const amenityList = listing.amenities
    ? (typeof listing.amenities === "string" ? listing.amenities.split(",").map(a => a.trim()) : listing.amenities)
    : [];

  return (
    <main className="dp">

      {/* ── Payment Success Toast ── */}
      <AnimatePresence>
        {paymentSuccess && (
          <motion.div
            className="dp__toast dp__toast--success"
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <HiOutlineCheckCircle className="dp__toast-icon" />
            <div>
              <p className="dp__toast-title">Payment successful!</p>
              <p className="dp__toast-sub">Your rent has been submitted to the landlord.</p>
            </div>
            <button className="dp__toast-close" onClick={() => setPaymentSuccess(false)}>
              <HiOutlineXMark />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report Modal ── */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            className="dp__modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              className="dp__modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dp__modal-header">
                <div className="dp__modal-header-left">
                  <HiOutlineFlag className="dp__modal-flag-icon" />
                  <div>
                    <h2>Report this listing</h2>
                    <p>Help us keep Rezidence safe for everyone.</p>
                  </div>
                </div>
                <button className="dp__modal-close" onClick={() => setShowReportModal(false)}>
                  <HiOutlineXMark />
                </button>
              </div>
              <div className="dp__modal-body">
                <p className="dp__modal-question">What&apos;s wrong with this listing?</p>
                <div className="dp__report-cats">
                  {REPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      className={"dp__report-cat" + (reportCategory === cat.value ? " active" : "")}
                      onClick={() => setReportCategory(cat.value)}
                    >
                      <span className="dp__report-cat-label">{cat.label}</span>
                      <span className="dp__report-cat-desc">{cat.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="dp__report-detail-wrap">
                  <label className="dp__report-detail-label">
                    Additional details <span>(optional)</span>
                  </label>
                  <textarea
                    className="dp__report-textarea"
                    placeholder="Tell us more about the issue..."
                    value={reportDetail}
                    onChange={(e) => setReportDetail(e.target.value)}
                    maxLength={400}
                    rows={3}
                  />
                  <span className="dp__report-char">{reportDetail.length}/400</span>
                </div>
                {reportError && (
                  <div className="dp__report-error">
                    <HiOutlineExclamationTriangle /> {reportError}
                  </div>
                )}
              </div>
              <div className="dp__modal-footer">
                <button className="dp__modal-cancel" onClick={() => setShowReportModal(false)}>Cancel</button>
                <button
                  className="dp__modal-submit"
                  onClick={handleReport}
                  disabled={submittingReport || !reportCategory}
                >
                  {submittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="dp__inner">

        {/* ── Breadcrumb ── */}
        <nav className="dp__breadcrumb">
          <Link href="/listings">Listings</Link>
          <span>/</span>
          <span>{listing.location}</span>
          <span>/</span>
          <span className="dp__breadcrumb-current">{listing.title}</span>
        </nav>

        {/* ── Owner edit/delete bar ── */}
        {isOwner && !isEditing && (
          <div className="dp__owner-bar">
            <span className="dp__owner-bar-label">You own this listing</span>
            <div className="dp__owner-bar-actions">
              <button className="dp__owner-edit" onClick={() => setIsEditing(true)}>
                <HiOutlinePencilSquare /> Edit
              </button>
              <button className="dp__owner-delete" onClick={handleDelete} disabled={deleting}>
                <HiOutlineTrash /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}

        {isEditing ? (
          /* ── Edit Form ── */
          <motion.div className="dp__edit-wrap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <h2 className="dp__edit-title">Edit listing</h2>
            <div className="dp__edit-grid">
              <div className="dp__edit-field dp__edit-field--full">
                <label>Title</label>
                <input name="title" value={editForm.title || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Price (₦ / yr)</label>
                <input type="number" name="price" value={editForm.price || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Type</label>
                <input name="type" value={editForm.type || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Location / Area</label>
                <input name="location" value={editForm.location || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Availability</label>
                <input name="availability" value={editForm.availability || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field dp__edit-field--full">
                <label>Full Address</label>
                <input name="address" value={editForm.address || ""} onChange={handleEditChange} placeholder="e.g. No. 5 Alakahia Road, Choba" />
              </div>
              <div className="dp__edit-field">
                <label>Bedrooms</label>
                <input type="number" name="beds" value={editForm.beds || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Bathrooms</label>
                <input type="number" name="baths" value={editForm.baths || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Furnishing</label>
                <input name="furnishing" value={editForm.furnishing || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Payment Terms</label>
                <input name="paymentTerms" value={editForm.paymentTerms || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Caution Fee (₦)</label>
                <input type="number" name="cautionFee" value={editForm.cautionFee || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Legal Fee (₦)</label>
                <input type="number" name="legalFee" value={editForm.legalFee || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Agency Fee (₦)</label>
                <input type="number" name="agencyFee" value={editForm.agencyFee || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field">
                <label>Service Charge (₦)</label>
                <input type="number" name="serviceCharge" value={editForm.serviceCharge || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field dp__edit-field--full">
                <label>Amenities (comma separated)</label>
                <input name="amenities" value={editForm.amenities || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field dp__edit-field--full">
                <label>Contact</label>
                <input name="contact" value={editForm.contact || ""} onChange={handleEditChange} />
              </div>
              <div className="dp__edit-field dp__edit-field--full">
                <label>Description</label>
                <textarea rows={4} name="description" value={editForm.description || ""} onChange={handleEditChange} />
              </div>
            </div>
            <div className="dp__edit-actions">
              <button className="dp__edit-save" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button className="dp__edit-cancel" onClick={() => { setIsEditing(false); setEditForm(listing); }}>
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── Main Content ── */
          <motion.div className="dp__layout" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>

            {/* ── LEFT COLUMN ── */}
            <div className="dp__left">

              {/* Gallery */}
              <div className="dp__gallery">
                <div className="dp__gallery-main">
                  {showVideo && listing.videoUrl ? (
                    <video src={listing.videoUrl} controls autoPlay className="dp__gallery-video" />
                  ) : images.length > 0 ? (
                    <img src={images[activeMedia]} alt={listing.title} className="dp__gallery-img" />
                  ) : (
                    <div className="dp__gallery-empty">
                      <HiOutlinePhoto />
                      <p>No photos available</p>
                    </div>
                  )}

                  {/* Overlaid badges */}
                  {listing.type && (
                    <span className="dp__gallery-badge dp__gallery-badge--type">{listing.type}</span>
                  )}
                  {listing.availability && (
                    <span className={"dp__gallery-badge dp__gallery-badge--avail " + (
                      listing.availability === "Available Now" ? "avail-now" :
                      listing.availability === "Available Soon" ? "avail-soon" : "avail-no"
                    )}>
                      <span className="dp__avail-dot" />
                      {listing.availability}
                    </span>
                  )}
                  {images.length > 1 && (
                    <span className="dp__gallery-count">
                      <HiOutlinePhoto /> {activeMedia + 1} / {images.length}
                    </span>
                  )}
                </div>

                {(images.length > 1 || listing.videoUrl) && (
                  <div className="dp__gallery-thumbs">
                    {images.map((src, i) => (
                      <button
                        key={i}
                        className={"dp__gallery-thumb" + (activeMedia === i && !showVideo ? " active" : "")}
                        onClick={() => { setActiveMedia(i); setShowVideo(false); }}
                      >
                        <img src={src} alt={"Photo " + (i + 1)} />
                        {i === 3 && images.length > 4 && (
                          <div className="dp__gallery-thumb-more">+{images.length - 4}</div>
                        )}
                      </button>
                    ))}
                    {listing.videoUrl && (
                      <button
                        className={"dp__gallery-thumb dp__gallery-thumb--video" + (showVideo ? " active" : "")}
                        onClick={() => setShowVideo(true)}
                      >
                        <HiOutlinePlayCircle />
                        <span>Video</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Title + meta */}
              <div className="dp__title-row">
                <div className="dp__title-left">
                  <h1 className="dp__title">{listing.title}</h1>
                  <div className="dp__location">
                    <HiOutlineMapPin />
                    <span>{listing.location}</span>
                  </div>
                  {listing.address && (
                    <p className="dp__address">{listing.address}</p>
                  )}
                </div>
                <div className="dp__title-actions">
                  <button
                    className={"dp__icon-btn" + (saved ? " dp__icon-btn--saved" : "")}
                    onClick={handleToggleFavorite}
                    title={saved ? "Remove from saved" : "Save listing"}
                  >
                    {saved ? <HiHeart /> : <HiOutlineHeart />}
                  </button>
                  <button className="dp__icon-btn" onClick={handleShare} title="Share">
                    <HiOutlineShare />
                  </button>
                </div>
              </div>

              {/* Verified + meta row */}
              <div className="dp__meta-row">
                {listing.verified && (
                  <span className="dp__verified-pill">
                    <HiOutlineCheckBadge /> Verified
                  </span>
                )}
                {listing.createdAt && (
                  <span className="dp__meta-chip">
                    <HiOutlineCalendarDays /> {formatDate(listing.createdAt)}
                  </span>
                )}
                {listing.views > 0 && (
                  <span className="dp__meta-chip">
                    <HiOutlineEye /> {listing.views} views
                  </span>
                )}
                {listing.interests > 0 && (
                  <span className="dp__meta-chip dp__meta-chip--interest">
                    <HiOutlinePresentationChartBar /> {listing.interests} interested
                  </span>
                )}
                {copied && <span className="dp__copied-flash">Link copied!</span>}
              </div>

              {/* Landlord card */}
              {listing.landlordId && (listing.landlordName || listing.agentName) && (
                <Link href={"/agent/" + listing.landlordId} className="dp__landlord-card">
                  <div className="dp__landlord-avatar">
                    <HiOutlineUserCircle />
                  </div>
                  <div className="dp__landlord-info">
                    <p className="dp__landlord-name">{listing.landlordName || listing.agentName}</p>
                    <p className="dp__landlord-sub">
                      <HiOutlineShieldCheck /> Direct landlord
                    </p>
                  </div>
                  <span className="dp__landlord-link">View profile →</span>
                </Link>
              )}

              {/* Tabs */}
              <div className="dp__tabs">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    className={"dp__tab" + (activeTab === tab ? " active" : "")}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab: Overview */}
              {activeTab === "overview" && (
                <motion.div key="overview" className="dp__tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <p className="dp__section-label">About this property</p>
                  <p className="dp__description">{listing.description || "No description provided."}</p>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="dp__map-link">
                      <HiOutlineMapPin /> View on Google Maps
                    </a>
                  )}
                </motion.div>
              )}

              {/* Tab: Costs */}
              {activeTab === "costs" && (
                <motion.div key="costs" className="dp__tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  {hasCostBreakdown ? (
                    <div className="dp__cost-card">
                      <div className="dp__cost-header">
                        <div className="dp__cost-header-icon"><HiOutlineCalculator /></div>
                        <div>
                          <p className="dp__cost-header-title">Move-in cost breakdown</p>
                          <p className="dp__cost-header-sub">Full upfront cost to secure this property</p>
                        </div>
                      </div>
                      <div className="dp__cost-rows">
                        <div className="dp__cost-row">
                          <div className="dp__cost-row-left">
                            <HiOutlineBanknotes className="dp__cost-icon dp__cost-icon--rent" />
                            <span>Annual rent</span>
                          </div>
                          <span className="dp__cost-val">₦{Number(listing.price).toLocaleString()}</span>
                        </div>
                        {listing.cautionFee !== undefined && (
                          <div className="dp__cost-row">
                            <div className="dp__cost-row-left">
                              <HiOutlineShieldCheck className="dp__cost-icon dp__cost-icon--caution" />
                              <span>Caution fee</span>
                            </div>
                            {Number(listing.cautionFee) === 0
                              ? <span className="dp__cost-free">None ✓</span>
                              : <span className="dp__cost-val">₦{Number(listing.cautionFee).toLocaleString()}</span>}
                          </div>
                        )}
                        {listing.legalFee !== undefined && (
                          <div className="dp__cost-row">
                            <div className="dp__cost-row-left">
                              <HiOutlineReceiptPercent className="dp__cost-icon dp__cost-icon--legal" />
                              <span>Legal fee</span>
                            </div>
                            {Number(listing.legalFee) === 0
                              ? <span className="dp__cost-free">None ✓</span>
                              : <span className="dp__cost-val">₦{Number(listing.legalFee).toLocaleString()}</span>}
                          </div>
                        )}
                        {listing.agencyFee !== undefined && (
                          <div className="dp__cost-row">
                            <div className="dp__cost-row-left">
                              <HiOutlineBuildingOffice className="dp__cost-icon dp__cost-icon--agency" />
                              <span>Agency fee</span>
                            </div>
                            {Number(listing.agencyFee) === 0
                              ? <span className="dp__cost-free">No agent ✓</span>
                              : <span className="dp__cost-val">₦{Number(listing.agencyFee).toLocaleString()}</span>}
                          </div>
                        )}
                        {Number(listing.serviceCharge) > 0 && (
                          <div className="dp__cost-row">
                            <div className="dp__cost-row-left">
                              <HiOutlineCog6Tooth className="dp__cost-icon dp__cost-icon--service" />
                              <span>Service charge</span>
                            </div>
                            <span className="dp__cost-val">₦{Number(listing.serviceCharge).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="dp__cost-total">
                        <div>
                          <p className="dp__cost-total-label">Total move-in</p>
                          <p className="dp__cost-total-note">One-time payment to secure this property</p>
                        </div>
                        <strong className="dp__cost-total-val">₦{totalMoveInCost.toLocaleString()}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="dp__description">No cost breakdown provided for this listing.</p>
                  )}
                </motion.div>
              )}

              {/* Tab: Amenities */}
              {activeTab === "amenities" && (
                <motion.div key="amenities" className="dp__tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  {amenityList.length > 0 ? (
                    <>
                      <p className="dp__section-label">Included in this property</p>
                      <div className="dp__amenities">
                        {amenityList.map((item, i) => (
                          <span key={i} className="dp__amenity">
                            <HiOutlineWrenchScrewdriver /> {item}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="dp__description">No amenities listed.</p>
                  )}
                </motion.div>
              )}

              {/* Tab: Location */}
              {activeTab === "location" && (
                <motion.div key="location" className="dp__tab-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                  <p className="dp__section-label">Address</p>
                  <p className="dp__description">{listing.address || listing.location || "No address provided."}</p>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noreferrer" className="dp__map-link">
                      <HiOutlineMapPin /> Open full map
                    </a>
                  )}
                </motion.div>
              )}

            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <aside className="dp__sidebar">
              <div className="dp__sidebar-card">

                {/* Price */}
                <div className="dp__price-block">
                  <p className="dp__price">₦{Number(listing.price).toLocaleString()}</p>
                  <p className="dp__price-label">per year · {listing.paymentTerms || "annually"}</p>
                </div>

                <div className="dp__sidebar-divider" />

                {/* Key facts */}
                <div className="dp__sidebar-facts">
                  <div className="dp__sidebar-fact">
                    <span className="dp__sidebar-fact-label"><HiOutlineHomeModern /> Type</span>
                    <span className="dp__sidebar-fact-val">{listing.type || "—"}</span>
                  </div>
                  <div className="dp__sidebar-fact">
                    <span className="dp__sidebar-fact-label"><HiOutlineCalendarDays /> Availability</span>
                    <span className={"dp__sidebar-fact-val" + (listing.availability === "Available Now" ? " dp__sidebar-fact-val--green" : "")}>
                      {listing.availability || "—"}
                    </span>
                  </div>
                  {hasCostBreakdown && (
                    <div className="dp__sidebar-fact">
                      <span className="dp__sidebar-fact-label"><HiOutlineCalculator /> Move-in total</span>
                      <span className="dp__sidebar-fact-val">₦{totalMoveInCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="dp__sidebar-divider" />

                {/* CTAs — only for non-owners */}
                {!isOwner && (
                  <div className="dp__ctas">
                    <button className="dp__cta dp__cta--primary" onClick={handleBookInspection}>
                      <HiOutlineClipboardDocumentCheck /> Book Inspection
                    </button>
                    <button className="dp__cta dp__cta--secondary" onClick={handlePayRent}>
                      <HiOutlineCreditCard /> Pay Rent
                    </button>
                  </div>
                )}

                {/* Trust strip */}
                {listing.verified && (
                  <div className="dp__trust-strip">
                    <HiOutlineShieldCheck className="dp__trust-icon" />
                    <p>
                      <strong>Verified landlord.</strong> This property has been field-checked by the Rezidence team.
                    </p>
                  </div>
                )}

                {/* Report */}
                <div className="dp__sidebar-report">
                  {!reportSent ? (
                    <button
                      className="dp__report-btn"
                      onClick={() => { if (!user) { router.push("/login"); return; } setShowReportModal(true); }}
                    >
                      <HiOutlineFlag /> Report this listing
                    </button>
                  ) : (
                    <div className="dp__report-sent">
                      <HiOutlineCheckCircle />
                      <span>Report submitted — thank you.</span>
                    </div>
                  )}
                </div>

              </div>
            </aside>

          </motion.div>
        )}
      </div>
    </main>
  );
}