"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  HiOutlineWrenchScrewdriver,
  HiOutlineShare,
  HiOutlineFlag,
  HiOutlineEye,
  HiOutlinePlayCircle,
  HiOutlineShieldCheck,
  HiOutlineUserCircle,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlinePhoto,
  HiOutlinePhone,
  HiOutlineChatBubbleLeftRight,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineBuildingOffice2,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import {
  fetchListingById,
  fetchSimilarListings,
  updateListing,
  deleteListing,
  incrementViewCount,
  reportListing,
} from "@/lib/firestoreListings";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { useAuth } from "@/context/AuthContext";
import { isLandlordVerified } from "@/lib/verification";
import { trackEvent } from "@/lib/posthog";
import { useStartConversation } from "@/hooks/useStartConversation";
import ListingCard from "@/components/listings/ListingCard";
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

function formatWhatsAppNumber(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}

function getDaysAgo(ts) {
  if (!ts) return null;
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diffMs = Date.now() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return diffHrs + "h ago";
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return diffDays + " days ago";
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function ListingDetailsPage({ initialListing }) {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id;
  const { user } = useAuth();
  const { startConversation, isStarting, error: startError } = useStartConversation();

  const [listing, setListing] = useState(initialListing || null);
  const [loading, setLoading] = useState(!initialListing);
  const [favorites, setFavorites] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(initialListing || {});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeMedia, setActiveMedia] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [similarListings, setSimilarListings] = useState([]);

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
        const data = initialListing || (await fetchListingById(listingId));
        if (data && data.landlordId) {
          let verified = false;
          if (user) {
            try {
              verified = await isLandlordVerified(data.landlordId);
            } catch (verifyError) {
              console.error("Error checking landlord verification:", verifyError);
            }
          }
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
    async function loadSimilar() {
      try {
        const results = await fetchSimilarListings(listing, listingId, 6);
        setSimilarListings(results);
      } catch (e) {
        console.error("Error fetching similar listings:", e);
      }
    }
    loadSimilar();
  }, [listing, listingId]);

  useEffect(() => {
    function handleKey(e) { if (e.key === "Escape") setShowReportModal(false); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

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
  const whatsappNumber = formatWhatsAppNumber(listing.contact);

  function handleToggleFavorite() { setFavorites(toggleFavorite(listing.id)); }
  function handleEditChange(e) { setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value })); }

  function goToImage(delta) {
    if (images.length === 0) return;
    setShowVideo(false);
    setActiveMedia((prev) => (prev + delta + images.length) % images.length);
  }

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
        availability: editForm.availability, amenities: editForm.amenities,
        contact: editForm.contact, description: editForm.description,
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

  function handleCall() {
    if (!listing.contact) return;
    trackEvent("call_click", { listingId, listingTitle: listing.title });
    window.location.href = "tel:" + listing.contact;
  }

  function handleWhatsApp() {
    if (!whatsappNumber) return;
    trackEvent("whatsapp_click", { listingId, listingTitle: listing.title });
    const message = encodeURIComponent(
      "Hi, I'm interested in " + listing.title + " (" + listing.location + ") on Rezidence."
    );
    window.open("https://wa.me/" + whatsappNumber + "?text=" + message, "_blank");
  }

  function handleMessage() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!listing.landlordId) return;
    trackEvent("message_click", { listingId, listingTitle: listing.title });
    startConversation({
      otherUserId: listing.landlordId,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: images[0] || null,
      listingPrice: listing.price,
    });
  }

  const amenityList = listing.amenities
    ? (typeof listing.amenities === "string" ? listing.amenities.split(",").map(a => a.trim()) : listing.amenities)
    : [];

  return (
    <main className="dp">

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
                <label>Contact number (call &amp; WhatsApp)</label>
                <input name="contact" value={editForm.contact || ""} onChange={handleEditChange} placeholder="e.g. 08012345678" />
              </div>
              <div className="dp__edit-field dp__edit-field--full">
                <label>Amenities (comma separated)</label>
                <input name="amenities" value={editForm.amenities || ""} onChange={handleEditChange} />
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>

            <div className="dp__layout">

              {/* ── Gallery ── */}
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

                  {listing.type && (
                    <span className="dp__gallery-badge dp__gallery-badge--type">{listing.type}</span>
                  )}

                  <div className="dp__gallery-top-actions">
                    <button
                      className={"dp__gallery-fav" + (saved ? " active" : "")}
                      onClick={handleToggleFavorite}
                      aria-label={saved ? "Remove from saved" : "Save listing"}
                    >
                      {saved ? <HiHeart /> : <HiOutlineHeart />}
                    </button>
                    <button className="dp__gallery-fav" onClick={handleShare} aria-label="Share">
                      <HiOutlineShare />
                    </button>
                  </div>

                  {images.length > 1 && !showVideo && (
                    <>
                      <button className="dp__gallery-arrow dp__gallery-arrow--left" onClick={() => goToImage(-1)} aria-label="Previous photo">
                        <HiChevronLeft />
                      </button>
                      <button className="dp__gallery-arrow dp__gallery-arrow--right" onClick={() => goToImage(1)} aria-label="Next photo">
                        <HiChevronRight />
                      </button>
                      <span className="dp__gallery-count">
                        <HiOutlinePhoto /> {activeMedia + 1} / {images.length}
                      </span>
                    </>
                  )}

                  {listing.videoUrl && images.length > 0 && (
                    <button
                      className="dp__gallery-video-toggle"
                      onClick={() => setShowVideo((v) => !v)}
                    >
                      <HiOutlinePlayCircle /> {showVideo ? "View photos" : "Watch video"}
                    </button>
                  )}
                </div>
                {copied && <span className="dp__copied-flash">Link copied!</span>}
              </div>

              {/* ── Price card ── */}
              <div className="dp__price-card">
                <p className="dp__price">₦{Number(listing.price).toLocaleString()}</p>
                <p className="dp__price-label">per year</p>
              </div>

              {/* ── Contact / profile card ── */}
              {!isOwner && (
                <div className="dp__contact-card">
                  <div className="dp__contact-top">
                    <div className="dp__landlord-avatar">
                      <HiOutlineUserCircle />
                    </div>
                    <div className="dp__contact-info">
                      <p className="dp__landlord-name">
                        {listing.landlordName || listing.agentName || "Property owner"}
                      </p>
                      <div className="dp__contact-badges">
                        {listing.verified && (
                          <span className="dp__verified-pill">
                            <HiOutlineCheckBadge /> Verified ID
                          </span>
                        )}

                      </div>
                    </div>
                  </div>
                  <div className="dp__ctas">
                    <button
                      className="dp__cta dp__cta--message"
                      onClick={handleMessage}
                      disabled={isStarting}
                    >
                      <HiOutlineChatBubbleLeftRight /> {isStarting ? "Starting chat..." : "Message on Rezidence"}
                    </button>
                    <button className="dp__cta dp__cta--whatsapp" onClick={handleWhatsApp} disabled={!whatsappNumber}>
                      <HiOutlineChatBubbleLeftRight /> Chat on WhatsApp
                    </button>
                    <button className="dp__cta dp__cta--call" onClick={handleCall} disabled={!listing.contact}>
                      <HiOutlinePhone /> Show contact / Call
                    </button>
                  </div>
                  {startError && (
                    <p className="dp__message-error">
                      <HiOutlineExclamationTriangle /> {startError}
                    </p>
                  )}
                  {listing.landlordId && (
                    <Link href={"/agent/" + listing.landlordId} className="dp__view-profile-link">
                      View profile →
                    </Link>
                  )}
                </div>
              )}

              {/* ── Title + meta ── */}
              <div className="dp__title-block">
                <h1 className="dp__title">{listing.title}</h1>
                <p className="dp__meta-line">
                  <HiOutlineMapPin /> {listing.location}
                  {listing.createdAt && <> · {getDaysAgo(listing.createdAt)}</>}
                  {listing.views > 0 && <> · <HiOutlineEye /> {listing.views} views</>}
                </p>
                {listing.address && <p className="dp__address">{listing.address}</p>}
              </div>

              {/* ── Icon facts ── */}
              <div className="dp__icon-facts">
                {listing.type && (
                  <div className="dp__icon-fact">
                    <span className="dp__icon-fact-circle"><HiOutlineBuildingOffice2 /></span>
                    <span className="dp__icon-fact-label">{listing.type}</span>
                  </div>
                )}
                {listing.beds && (
                  <div className="dp__icon-fact">
                    <span className="dp__icon-fact-circle"><HiOutlineHomeModern /></span>
                    <span className="dp__icon-fact-label">{listing.beds} Bedrooms</span>
                  </div>
                )}
                {listing.baths && (
                  <div className="dp__icon-fact">
                    <span className="dp__icon-fact-circle"><HiOutlineSquares2X2 /></span>
                    <span className="dp__icon-fact-label">{listing.baths} Bathrooms</span>
                  </div>
                )}
              </div>

              {/* ── Details grid ── */}
              <div className="dp__details-grid">
                {listing.address && (
                  <div className="dp__detail-item">
                    <span className="dp__detail-label">Property address</span>
                    <span className="dp__detail-val">{listing.address}</span>
                  </div>
                )}
                {listing.furnishing && (
                  <div className="dp__detail-item">
                    <span className="dp__detail-label">Furnishing</span>
                    <span className="dp__detail-val">{listing.furnishing}</span>
                  </div>
                )}
                {listing.availability && (
                  <div className="dp__detail-item">
                    <span className="dp__detail-label">Availability</span>
                    <span className="dp__detail-val">{listing.availability}</span>
                  </div>
                )}
                {listing.createdAt && (
                  <div className="dp__detail-item">
                    <span className="dp__detail-label">Posted</span>
                    <span className="dp__detail-val">{getDaysAgo(listing.createdAt)}</span>
                  </div>
                )}
              </div>

              {/* ── Amenities ── */}
              {amenityList.length > 0 && (
                <div className="dp__amenities-section">
                  <p className="dp__section-label">Amenities</p>
                  <div className="dp__amenities">
                    {amenityList.map((item, i) => (
                      <span key={i} className="dp__amenity">
                        <HiOutlineWrenchScrewdriver /> {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Description ── */}
              <div className="dp__description-section">
                <p className="dp__section-label">Description</p>
                <p className="dp__description">{listing.description || "No description provided."}</p>
              </div>

              {/* ── Safety tips ── */}
              <div className="dp__tips">
                <p className="dp__tips-title">Stay safe while renting</p>
                <ul className="dp__tips-list">
                  <li>Always view the property in person before paying anything.</li>
                  <li>Never send money before you've confirmed the property and the owner.</li>
                  <li>Verify the account details belong to the actual property owner.</li>
                  <li>Report any listing that feels off — it helps keep Rezidence safe.</li>
                </ul>
              </div>

              {/* ── Report ── */}
              <div className="dp__report-wrap">
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

            {/* ── Similar Adverts ── */}
            {similarListings.length > 0 && (
              <div className="dp__similar">
                <p className="dp__similar-title">Similar adverts</p>
                <div className="dp__similar-grid">
                  {similarListings.map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}
        </div>
    </main>
  );
}