// app/listings/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import "@/styles/inspect.css";
import {
  HiOutlineCheckBadge,
  HiOutlineMapPin,
  HiOutlineHomeModern,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
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
  HiOutlineUserGroup,
  HiOutlineUserCircle,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import {
  fetchListingById,
  updateListing,
  deleteListing,
  incrementViewCount,
  reportListing,
  expressInterest,
} from "@/lib/firestoreListings";
import { createNotification } from "@/lib/firestoreNotifications";
import { fetchRoommatePostsByListing } from "@/lib/firestoreRoommates";
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
  { value: "fake_listing",   label: "🚫 Fake listing",         desc: "This property doesn't exist or is misleading" },
  { value: "scam",           label: "⚠️ Scam / Fraud",         desc: "Suspicious activity or fraudulent intent" },
  { value: "wrong_price",    label: "💰 Wrong price",           desc: "Price is significantly different from reality" },
  { value: "already_rented", label: "🔒 Already rented",       desc: "This property is no longer available" },
  { value: "bad_photos",     label: "📷 Misleading photos",    desc: "Photos don't match the actual property" },
  { value: "inappropriate",  label: "🔞 Inappropriate content", desc: "Content violates community guidelines" },
  { value: "other",          label: "📝 Other",                 desc: "Something else is wrong" },
];

export default function ListingDetailsPage() {
  const params    = useParams();
  const router    = useRouter();
  const listingId = params?.id;
  const { user }  = useAuth();

  const [listing, setListing]                 = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [favorites, setFavorites]             = useState([]);
  const [isEditing, setIsEditing]             = useState(false);
  const [editForm, setEditForm]               = useState({});
  const [saving, setSaving]                   = useState(false);
  const [deleting, setDeleting]               = useState(false);
  const [copied, setCopied]                   = useState(false);
  const [activeMedia, setActiveMedia]         = useState(0);
  const [showVideo, setShowVideo]             = useState(false);
  const [interestSent, setInterestSent]       = useState(false);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [roommatePost, setRoommatePost]       = useState(null);

  // Reservation status
  const [listingReserved, setListingReserved]             = useState(false);
  const [studentHasReservation, setStudentHasReservation] = useState(false);

  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCategory, setReportCategory]   = useState("");
  const [reportDetail, setReportDetail]       = useState("");
  const [reportSent, setReportSent]           = useState(false);
  const [reportError, setReportError]         = useState("");
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
        try { await incrementViewCount(listingId); } catch (e) {}
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
    if (!listingId) return;
    async function checkRoommate() {
      try {
        const posts = await fetchRoommatePostsByListing(listingId);
        if (posts.length > 0) setRoommatePost(posts[0]);
      } catch (e) {}
    }
    checkRoommate();
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
        if (mine)   setStudentHasReservation(true);
      } catch (e) {}
    }
    checkReservationStatus();
  }, [listing, user]);

  // Close report modal on Escape
  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") setShowReportModal(false); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  if (loading) {
    return (
      <main className="details-page">
        <motion.div className="details-page__not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="details-page__tag">Loading</p>
          <h1>Loading property...</h1>
          <p>Please wait a moment.</p>
        </motion.div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="details-page">
        <motion.div className="details-page__not-found" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="details-page__tag">Listing Not Found</p>
          <h1>Property not found</h1>
          <p>This property may have been removed or the link is invalid.</p>
        </motion.div>
      </main>
    );
  }

  const images  = listing.images?.length > 0 ? listing.images : listing.image ? [listing.image] : [];
  const isOwner = user && user.uid === listing.landlordId;
  const saved   = favorites.includes(listing.id);

  const whatsappNumber = typeof listing.contact === "string" && listing.contact.startsWith("0")
    ? "234" + listing.contact.slice(1)
    : listing.contact;
  const whatsappHref = "https://wa.me/" + whatsappNumber;
  const telHref      = "tel:" + listing.contact;

  const hasCostBreakdown = listing.cautionFee || listing.legalFee || listing.agencyFee || listing.serviceCharge;
  const totalMoveInCost  = listing.totalMoveInCost ||
    (Number(listing.price) || 0) + (Number(listing.cautionFee) || 0) +
    (Number(listing.legalFee) || 0) + (Number(listing.agencyFee) || 0) +
    (Number(listing.serviceCharge) || 0);

  const mapsUrl = listing.mapsUrl ||
    (listing.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(listing.address + ", Port Harcourt, Nigeria") : null);

  function handleToggleFavorite() { setFavorites(toggleFavorite(listing.id)); }
  function handleEditChange(e)    { setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

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
    if (!reportCategory) {
      setReportError("Please select a reason for reporting.");
      return;
    }
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
      console.error("Error reporting listing:", error);
    } finally {
      setSubmittingReport(false);
    }
  }

  async function handleExpressInterest() {
    if (!user) { router.push("/login"); return; }
    setSendingInterest(true);
    try {
      await expressInterest(listingId, user.uid, user.displayName || "A prospective tenant");
      try {
        await createNotification({
          userId:     listing.landlordId,
          type:       "listing_interest",
          title:      "New interest on your listing",
          message:    `${user.displayName || "Someone"} is interested in "${listing.title}"`,
          listingId,
          senderId:   user.uid,
          senderName: user.displayName || "Someone",
        });
      } catch (e) { console.warn("Notification failed silently:", e); }
      setInterestSent(true);
      trackEvent("express_interest", { listingId, listingTitle: listing.title, location: listing.location, price: listing.price });
    } catch (error) {
      console.error("Error expressing interest:", error);
    } finally {
      setSendingInterest(false);
    }
  }

  function handleBookInspection() {
    if (!user) { router.push("/login"); return; }
    trackEvent("inspection_click", { listingId, listingTitle: listing.title, location: listing.location });
    router.push("/inspect/" + listingId);
  }

  function handleReserve() {
    if (listingReserved || studentHasReservation) return;
    if (!user) { router.push("/login"); return; }
    trackEvent("reserve_click", { listingId, listingTitle: listing.title });
    router.push("/reserve/" + listingId);
  }

  function formatDate(ts) {
    if (!ts) return null;
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  const costIcons = {
    rent:    <HiOutlineBanknotes />,
    caution: <HiOutlineShieldCheck />,
    legal:   <HiOutlineReceiptPercent />,
    agency:  <HiOutlineBuildingOffice />,
    service: <HiOutlineCog6Tooth />,
  };

  return (
    <main className="details-page">

      {/* ── Report Modal ── */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            className="report-modal__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              className="report-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="report-modal__header">
                <div className="report-modal__header-left">
                  <HiOutlineFlag className="report-modal__header-icon" />
                  <div>
                    <h2>Report this listing</h2>
                    <p>Help us keep Velen safe for everyone.</p>
                  </div>
                </div>
                <button className="report-modal__close" onClick={() => setShowReportModal(false)}>
                  <HiOutlineXMark />
                </button>
              </div>

              <div className="report-modal__body">
                <p className="report-modal__label">What&apos;s wrong with this listing?</p>
                <div className="report-modal__categories">
                  {REPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      className={"report-modal__cat" + (reportCategory === cat.value ? " active" : "")}
                      onClick={() => setReportCategory(cat.value)}
                    >
                      <span className="report-modal__cat-label">{cat.label}</span>
                      <span className="report-modal__cat-desc">{cat.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="report-modal__detail-wrap">
                  <label className="report-modal__detail-label">
                    Additional details <span>(optional)</span>
                  </label>
                  <textarea
                    className="report-modal__detail"
                    placeholder="Tell us more about the issue..."
                    value={reportDetail}
                    onChange={(e) => setReportDetail(e.target.value)}
                    maxLength={400}
                    rows={3}
                  />
                  <span className="report-modal__char-count">{reportDetail.length}/400</span>
                </div>

                {reportError && (
                  <div className="report-modal__error">
                    <HiOutlineExclamationTriangle /> {reportError}
                  </div>
                )}
              </div>

              <div className="report-modal__footer">
                <button className="report-modal__cancel" onClick={() => setShowReportModal(false)}>
                  Cancel
                </button>
                <button
                  className="report-modal__submit"
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

      <section className="details-page__grid">

        {/* Left — Media */}
        <motion.div className="details-page__media-col" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
          <div className="details-page__media">
            {showVideo && listing.videoUrl ? (
              <video src={listing.videoUrl} controls autoPlay className="details-page__video" />
            ) : images.length > 0 ? (
              <img src={images[activeMedia]} alt={listing.title} className="details-page__image" />
            ) : (
              <div className="details-page__no-media"><HiOutlineHomeModern /><p>No photos available</p></div>
            )}
          </div>
          {(images.length > 1 || listing.videoUrl) && (
            <div className="details-page__thumbnails">
              {images.map((src, i) => (
                <button key={i} className={"details-page__thumb" + (activeMedia === i && !showVideo ? " active" : "")} onClick={() => { setActiveMedia(i); setShowVideo(false); }}>
                  <img src={src} alt={"Photo " + (i + 1)} />
                </button>
              ))}
              {listing.videoUrl && (
                <button className={"details-page__thumb details-page__thumb--video" + (showVideo ? " active" : "")} onClick={() => setShowVideo(true)}>
                  <HiOutlinePlayCircle /><span>Video</span>
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Right — Content */}
        <motion.div className="details-page__content" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}>
          {isOwner && !isEditing && (
            <div className="details-page__owner-actions">
              <button className="details-page__edit-btn" onClick={() => setIsEditing(true)}><HiOutlinePencilSquare /> Edit Listing</button>
              <button className="details-page__delete-btn" onClick={handleDelete} disabled={deleting}><HiOutlineTrash /> {deleting ? "Deleting..." : "Delete"}</button>
            </div>
          )}

          {isEditing ? (
            <motion.div className="details-page__edit-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <p className="details-page__tag">Editing Listing</p>
              <h2>Update Property Details</h2>
              <div className="edit-form__grid">
                <div className="edit-form__field edit-form__field--full"><label>Title</label><input name="title" value={editForm.title || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Price (₦)</label><input type="number" name="price" value={editForm.price || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Type</label><input name="type" value={editForm.type || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Location / Area</label><input name="location" value={editForm.location || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field edit-form__field--full"><label>Full Address (for map)</label><input name="address" value={editForm.address || ""} onChange={handleEditChange} placeholder="e.g. No. 5 Alakahia Road, Choba" /></div>
                <div className="edit-form__field"><label>Bedrooms</label><input type="number" name="beds" value={editForm.beds || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Bathrooms</label><input type="number" name="baths" value={editForm.baths || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Furnishing</label><input name="furnishing" value={editForm.furnishing || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Availability</label><input name="availability" value={editForm.availability || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field edit-form__field--full"><label>Payment Terms</label><input name="paymentTerms" value={editForm.paymentTerms || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Caution Fee (₦)</label><input type="number" name="cautionFee" value={editForm.cautionFee || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Legal Fee (₦)</label><input type="number" name="legalFee" value={editForm.legalFee || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Agency Fee (₦)</label><input type="number" name="agencyFee" value={editForm.agencyFee || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field"><label>Service Charge (₦)</label><input type="number" name="serviceCharge" value={editForm.serviceCharge || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field edit-form__field--full"><label>Amenities</label><input name="amenities" value={editForm.amenities || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field edit-form__field--full"><label>Contact</label><input name="contact" value={editForm.contact || ""} onChange={handleEditChange} /></div>
                <div className="edit-form__field edit-form__field--full"><label>Description</label><textarea rows="4" name="description" value={editForm.description || ""} onChange={handleEditChange} /></div>
              </div>
              <div className="edit-form__actions">
                <button className="edit-form__save" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                <button className="edit-form__cancel" onClick={() => { setIsEditing(false); setEditForm(listing); }}>Cancel</button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
              <div className="details-page__header">
                <div>
                  <p className="details-page__tag">Property Details</p>
                  <h1>{listing.title}</h1>
                  {listing.landlordId && (listing.landlordName || listing.agentName) && (
                    <Link href={"/agent/" + listing.landlordId} className="details-page__agent-link">
                      <HiOutlineUserCircle />
                      Listed by {listing.landlordName || listing.agentName}
                    </Link>
                  )}
                  <p className="details-page__location"><HiOutlineMapPin /><span>{listing.location}</span></p>
                  {listing.address && <p className="details-page__address-text">{listing.address}</p>}
                  <div className="details-page__meta">
                    {listing.createdAt && <span><HiOutlineCalendarDays />{formatDate(listing.createdAt)}</span>}
                    {listing.views > 0 && <span><HiOutlineEye />{listing.views} {listing.views === 1 ? "view" : "views"}</span>}
                  </div>
                </div>
                <div className="details-page__price-wrap">
                  <p className="details-page__price">₦{Number(listing.price).toLocaleString()}</p>
                  <p className="details-page__price-label">per year</p>
                  <div className="details-page__top-actions">
                    <button type="button" onClick={handleToggleFavorite} className={"details-page__favorite-icon" + (saved ? " active" : "")}>
                      {saved ? <HiHeart /> : <HiOutlineHeart />}
                    </button>
                    <button type="button" className="details-page__share-btn" onClick={handleShare}><HiOutlineShare /></button>
                    {listing.verified && <span className="details-page__verified"><HiOutlineCheckBadge /> Verified</span>}
                    {listing.availability && (
                      <span className={"details-page__availability " + (listing.availability === "Available Now" ? "available" : listing.availability === "Available Soon" ? "soon" : "unavailable")}>
                        {listing.availability}
                      </span>
                    )}
                  </div>
                  {copied && <p className="details-page__copied">Link copied!</p>}
                </div>
              </div>

              <div className="details-page__facts">
                <div className="details-page__fact"><HiOutlineHomeModern /><div><span>Type</span><strong>{listing.type}</strong></div></div>
                <div className="details-page__fact"><HiOutlineHomeModern /><div><span>Bedrooms</span><strong>{listing.beds || 1} Bed</strong></div></div>
                <div className="details-page__fact"><HiOutlineHomeModern /><div><span>Bathrooms</span><strong>{listing.baths || 1} Bath</strong></div></div>
                {listing.furnishing && <div className="details-page__fact"><HiOutlineSparkles /><div><span>Furnishing</span><strong>{listing.furnishing}</strong></div></div>}
                {listing.paymentTerms && <div className="details-page__fact"><HiOutlineBanknotes /><div><span>Payment</span><strong>{listing.paymentTerms}</strong></div></div>}
              </div>

              {mapsUrl && (
                <div className="details-page__map-btn-wrap">
                  <a href={mapsUrl} target="_blank" rel="noreferrer" className="details-page__map-btn">
                    <HiOutlineMapPin /> View Location on Google Maps
                  </a>
                </div>
              )}

              {hasCostBreakdown && (
                <div className="details-page__section">
                  <div className="cost-card">
                    <div className="cost-card__header">
                      <div className="cost-card__title-row">
                        <div className="cost-card__icon-wrap"><HiOutlineCalculator /></div>
                        <div>
                          <h2 className="cost-card__title">Move-in Cost Breakdown</h2>
                          <p className="cost-card__subtitle">Full upfront cost to move into this property</p>
                        </div>
                      </div>
                    </div>
                    <div className="cost-card__rows">
                      <div className="cost-card__row">
                        <div className="cost-card__row-left"><span className="cost-card__row-icon cost-card__row-icon--rent">{costIcons.rent}</span><span className="cost-card__row-label">Annual Rent</span></div>
                        <span className="cost-card__row-value">₦{Number(listing.price).toLocaleString()}</span>
                      </div>
                      {listing.cautionFee !== undefined && (
                        <div className={"cost-card__row" + (Number(listing.cautionFee) === 0 ? " cost-card__row--free" : "")}>
                          <div className="cost-card__row-left"><span className="cost-card__row-icon cost-card__row-icon--caution">{costIcons.caution}</span><span className="cost-card__row-label">Caution Fee</span></div>
                          {Number(listing.cautionFee) === 0 ? <span className="cost-card__row-free">None ✓</span> : <span className="cost-card__row-value">₦{Number(listing.cautionFee).toLocaleString()}</span>}
                        </div>
                      )}
                      {listing.legalFee !== undefined && (
                        <div className={"cost-card__row" + (Number(listing.legalFee) === 0 ? " cost-card__row--free" : "")}>
                          <div className="cost-card__row-left"><span className="cost-card__row-icon cost-card__row-icon--legal">{costIcons.legal}</span><span className="cost-card__row-label">Legal Fee</span></div>
                          {Number(listing.legalFee) === 0 ? <span className="cost-card__row-free">None ✓</span> : <span className="cost-card__row-value">₦{Number(listing.legalFee).toLocaleString()}</span>}
                        </div>
                      )}
                      {listing.agencyFee !== undefined && (
                        <div className={"cost-card__row" + (Number(listing.agencyFee) === 0 ? " cost-card__row--free" : "")}>
                          <div className="cost-card__row-left"><span className="cost-card__row-icon cost-card__row-icon--agency">{costIcons.agency}</span><span className="cost-card__row-label">Agency Fee</span></div>
                          {Number(listing.agencyFee) === 0 ? <span className="cost-card__row-free">No Agent ✓</span> : <span className="cost-card__row-value">₦{Number(listing.agencyFee).toLocaleString()}</span>}
                        </div>
                      )}
                      {Number(listing.serviceCharge) > 0 && (
                        <div className="cost-card__row">
                          <div className="cost-card__row-left"><span className="cost-card__row-icon cost-card__row-icon--service">{costIcons.service}</span><span className="cost-card__row-label">Service Charge</span></div>
                          <span className="cost-card__row-value">₦{Number(listing.serviceCharge).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="cost-card__total">
                      <div className="cost-card__total-left">
                        <span className="cost-card__total-label">Total Move-in Cost</span>
                        <span className="cost-card__total-note">One-time payment to secure this property</span>
                      </div>
                      <strong className="cost-card__total-value">₦{totalMoveInCost.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              )}

              {listing.amenities && (
                <div className="details-page__section">
                  <h2>Amenities</h2>
                  <div className="details-page__amenities">
                    {(typeof listing.amenities === "string" ? listing.amenities.split(",") : listing.amenities).map((item, i) => (
                      <span key={i} className="details-page__amenity-tag">
                        <HiOutlineWrenchScrewdriver />{item.trim ? item.trim() : item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="details-page__section">
                <h2>Description</h2>
                <p>{listing.description}</p>
              </div>

              <div className="details-page__section">
                <h2>Quick Actions</h2>
                <div className="details-page__actions">
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="details-page__button details-page__button--primary">
                    <HiOutlineChatBubbleLeftRight /> Chat on WhatsApp
                  </a>
                  <a href={telHref} className="details-page__button details-page__button--secondary">
                    <HiOutlinePhone /> Call Now
                  </a>
                </div>

                {!isOwner && (
                  <button className="details-page__inspect-btn" onClick={handleBookInspection}>
                    <HiOutlineClipboardDocumentCheck /> Book Inspection
                  </button>
                )}

                {!isOwner && (
                  <button
                    className={"details-page__reserve-btn" + (listingReserved ? " reserved" : "") + (studentHasReservation ? " mine" : "")}
                    onClick={handleReserve}
                    disabled={listingReserved || studentHasReservation}
                  >
                    <HiOutlineShieldCheck />
                    {listingReserved ? "Room Already Reserved" : studentHasReservation ? "You Reserved This Room" : "Reserve this Room"}
                  </button>
                )}

                {!isOwner && (
                  <button
                    className="details-page__pay-btn"
                    onClick={() => {
                      if (!user) { router.push("/login"); return; }
                      trackEvent("pay_click", { listingId, listingTitle: listing.title });
                      router.push("/pay/" + listingId);
                    }}
                  >
                    <HiOutlineBanknotes /> Pay Rent Now
                  </button>
                )}

                {roommatePost && !isOwner && (
                  <div className="details-page__roommate-cta">
                    <div className="details-page__roommate-cta-left">
                      <span className="details-page__roommate-cta-icon">🤝</span>
                      <div>
                        <p className="details-page__roommate-cta-title">Split the rent</p>
                        <p className="details-page__roommate-cta-sub">
                          {roommatePost.posterName} is looking for a roommate — ₦{(roommatePost.splitCost || 0).toLocaleString()}/yr each
                        </p>
                      </div>
                    </div>
                    <Link href="/roommates" className="details-page__roommate-cta-btn">
                      <HiOutlineUserGroup /> View post
                    </Link>
                  </div>
                )}

                <div className="details-page__interest">
                  {!interestSent ? (
                    <button className="details-page__interest-btn" onClick={handleExpressInterest} disabled={sendingInterest || isOwner}>
                      {sendingInterest ? "Sending..." : "⚡ Express Interest"}
                    </button>
                  ) : (
                    <div className="details-page__interest-sent">
                      <p>✅ Interest sent! The property owner has been notified.</p>
                    </div>
                  )}
                  {!user && <p className="details-page__interest-note"><a href="/login">Log in</a> to express interest in this property.</p>}
                  {isOwner && <p className="details-page__interest-note">This is your listing.</p>}
                  {listing.interests > 0 && (
                    <p className="details-page__interest-count">⚡ {listing.interests} {listing.interests === 1 ? "person has" : "people have"} expressed interest</p>
                  )}
                </div>
              </div>

              <div className="details-page__section">
                <h2>Contact</h2>
                <p className="details-page__contact-text">Reach out directly to the property owner or manager.</p>
                <p className="details-page__phone">{listing.contact}</p>
              </div>

              {/* ── Report section ── */}
              <div className="details-page__section">
                {!reportSent ? (
                  <div className="details-page__report">
                    <button className="details-page__report-btn" onClick={() => { if (!user) { router.push("/login"); return; } setShowReportModal(true); }}>
                      <HiOutlineFlag /> Report this listing
                    </button>
                  </div>
                ) : (
                  <div className="details-page__report-sent-card">
                    <HiOutlineCheckCircle className="details-page__report-sent-icon" />
                    <div>
                      <p className="details-page__report-sent-title">Report submitted</p>
                      <p className="details-page__report-sent-sub">Thank you — our team will review this listing shortly.</p>
                    </div>
                  </div>
                )}
              </div>

            </motion.div>
          )}
        </motion.div>
      </section>
    </main>
  );
}