// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineHomeModern,
  HiOutlineEye,
  HiOutlineBolt,
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineChartBarSquare,
  HiOutlineMapPin,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlinePhoto,
  HiOutlinePlayCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingUp,
  HiOutlineClipboardDocumentCheck,
  HiOutlineCalendarDays,
  HiOutlinePhone,
  HiOutlineXCircle,
  HiOutlineCheck,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  fetchListingsByLandlord,
  deleteListing,
  updateListingAvailability,
  renewListing,
} from "@/lib/firestoreListings";
import {
  fetchInspectionsByLandlord,
  updateInspectionStatus,
} from "@/lib/firestoreInspections";
import {
  fetchReservationsByLandlord,
  updateReservationStatus,
} from "@/lib/firestoreReservations";
import { createNotification } from "@/lib/firestoreNotifications";
import "@/styles/dashboard.css";

const AVAILABILITY_OPTIONS = ["Available Now", "Available Soon", "Not Available"];
const EXPIRY_DAYS = 90;
const WARN_DAYS   = 75;

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

function getListingAge(listing) {
  const base = listing.renewedAt ?? listing.createdAt;
  if (!base) return 0;
  const date = base.toDate ? base.toDate() : new Date(base);
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}
function getExpiryStatus(listing) {
  const age = getListingAge(listing);
  if (age >= EXPIRY_DAYS) return "expired";
  if (age >= WARN_DAYS)   return "expiring";
  return "fresh";
}
function daysUntilExpiry(listing) { return Math.max(0, EXPIRY_DAYS - getListingAge(listing)); }
function getConversionRate(listing) {
  const views     = Number(listing.views)     || 0;
  const interests = Number(listing.interests) || 0;
  if (views === 0) return null;
  return Math.round((interests / views) * 1000) / 10;
}
function getConversionLabel(rate, views) {
  if (rate === null || views < 5) return { text: "Not enough data", tier: "neutral" };
  if (rate >= 15) return { text: "High demand",      tier: "hot"     };
  if (rate >= 5)  return { text: "Good",             tier: "good"    };
  if (views >= 10) return { text: "Low conversion",  tier: "low"     };
  return { text: "Not enough data", tier: "neutral" };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();

  const [listings, setListings]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [deletingId, setDeletingId]           = useState(null);
  const [updatingId, setUpdatingId]           = useState(null);
  const [renewingId, setRenewingId]           = useState(null);
  const [filter, setFilter]                   = useState("All");
  const [sortBy, setSortBy]                   = useState("newest");
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // Inspections
  const [inspections, setInspections]               = useState([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(true);
  const [inspectFilter, setInspectFilter]           = useState("pending");
  const [updatingInspectId, setUpdatingInspectId]   = useState(null);
  const [inspectToast, setInspectToast]             = useState(null);

  // Reservations
  const [reservations, setReservations]               = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reserveFilter, setReserveFilter]             = useState("pending");
  const [updatingReserveId, setUpdatingReserveId]     = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    if (userRole && userRole !== "landlord") { router.push("/listings"); return; }
  }, [user, userRole, authLoading]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const data = await fetchListingsByLandlord(user.uid);
        setListings(data);
      } catch (e) {
        console.error("Error loading dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function loadInspections() {
      setInspectionsLoading(true);
      try {
        const data = await fetchInspectionsByLandlord(user.uid);
        setInspections(data);
      } catch (e) {
        console.error("Error loading inspections:", e);
      } finally {
        setInspectionsLoading(false);
      }
    }
    loadInspections();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    async function loadReservations() {
      setReservationsLoading(true);
      try {
        const data = await fetchReservationsByLandlord(user.uid);
        setReservations(data);
      } catch (e) {
        console.error("Error loading reservations:", e);
      } finally {
        setReservationsLoading(false);
      }
    }
    loadReservations();
  }, [user]);

  function showInspectToast(msg, type = "success") {
    setInspectToast({ msg, type });
    setTimeout(() => setInspectToast(null), 3000);
  }

  async function handleInspectionStatus(id, status) {
    setUpdatingInspectId(id);
    try {
      await updateInspectionStatus(id, status);
      setInspections((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
      showInspectToast(status === "confirmed" ? "Inspection confirmed." : "Inspection cancelled.");
    } catch (e) {
      console.error(e);
      showInspectToast("Failed to update inspection.", "error");
    } finally {
      setUpdatingInspectId(null);
    }
  }

  // ── Reservation confirm/decline with student notification ──
  async function handleReservationStatus(id, status) {
    setUpdatingReserveId(id);
    try {
      await updateReservationStatus(id, status);
      setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));

      // Find the reservation to get student details
      const res = reservations.find((r) => r.id === id);
      if (res) {
        try {
          if (status === "confirmed") {
            await createNotification({
              userId:     res.studentId,
              type:       "reservation_confirmed",
              title:      "Your reservation was confirmed! 🎉",
              message:    `Your reservation for "${res.listingTitle}" has been confirmed. Contact the landlord to arrange your move-in.`,
              listingId:  res.listingId,
              senderId:   user.uid,
              senderName: user.displayName || "Landlord",
            });
          } else if (status === "declined") {
            await createNotification({
              userId:     res.studentId,
              type:       "reservation_declined",
              title:      "Reservation update",
              message:    `Your reservation for "${res.listingTitle}" was not confirmed this time. You can browse other available listings.`,
              listingId:  res.listingId,
              senderId:   user.uid,
              senderName: user.displayName || "Landlord",
            });
          }
        } catch (e) {
          console.warn("Notification failed silently:", e);
        }
      }

      showInspectToast(status === "confirmed" ? "Reservation confirmed." : "Reservation declined.");
    } catch (e) {
      console.error(e);
      showInspectToast("Failed to update reservation.", "error");
    } finally {
      setUpdatingReserveId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="dashboard">
        <div className="dashboard__loading">
          <motion.div className="dashboard__loading-inner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="dashboard__spinner" />
            <p>Loading your dashboard...</p>
          </motion.div>
        </div>
      </main>
    );
  }

  if (!user || userRole !== "landlord") return null;

  const expiredListings  = listings.filter((l) => getExpiryStatus(l) === "expired");
  const expiringListings = listings.filter((l) => getExpiryStatus(l) === "expiring");
  const needsAttention   = expiredListings.length + expiringListings.length;
  const highDemandCount  = listings.filter((l) => (getConversionRate(l) ?? 0) >= 15).length;
  const totalViews       = listings.reduce((s, l) => s + (Number(l.views) || 0), 0);
  const totalInterests   = listings.reduce((s, l) => s + (Number(l.interests) || 0), 0);
  const availableCount   = listings.filter((l) => l.availability === "Available Now").length;
  const listingsWithData = listings.filter((l) => (Number(l.views) || 0) >= 5);
  const avgConversion    = listingsWithData.length > 0
    ? Math.round(listingsWithData.reduce((s, l) => s + getConversionRate(l), 0) / listingsWithData.length * 10) / 10
    : null;

  const pendingInspCount   = inspections.filter((i) => i.status === "pending").length;
  const confirmedInspCount = inspections.filter((i) => i.status === "confirmed").length;
  const pendingResCount    = reservations.filter((r) => r.status === "pending").length;

  const filteredInspections  = inspections.filter((i) => inspectFilter === "all" || i.status === inspectFilter);
  const filteredReservations = reservations.filter((r) => reserveFilter === "all" || r.status === reserveFilter);

  const filtered = listings
    .filter((l) => {
      if (filter === "All")         return true;
      if (filter === "High Demand") return (getConversionRate(l) ?? 0) >= 15;
      if (filter === "Expiring")    return getExpiryStatus(l) !== "fresh";
      return l.availability === filter;
    })
    .sort((a, b) => {
      if (sortBy === "newest")     { const at = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0); const bt = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0); return bt - at; }
      if (sortBy === "views")      return (b.views     || 0) - (a.views     || 0);
      if (sortBy === "interests")  return (b.interests || 0) - (a.interests || 0);
      if (sortBy === "price")      return (b.price     || 0) - (a.price     || 0);
      if (sortBy === "expiring")   return getListingAge(b) - getListingAge(a);
      if (sortBy === "conversion") return (getConversionRate(b) ?? -1) - (getConversionRate(a) ?? -1);
      return 0;
    });

  async function handleDelete(id) {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    setDeletingId(id);
    try { await deleteListing(id); setListings((p) => p.filter((l) => l.id !== id)); }
    catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  }

  async function handleAvailabilityChange(id, val) {
    setUpdatingId(id);
    try { await updateListingAvailability(id, val); setListings((p) => p.map((l) => l.id === id ? { ...l, availability: val } : l)); }
    catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  }

  async function handleRenew(id) {
    setRenewingId(id);
    try { const renewedAt = await renewListing(id); setListings((p) => p.map((l) => l.id === id ? { ...l, renewedAt } : l)); }
    catch (e) { console.error(e); }
    finally { setRenewingId(null); }
  }

  function formatDate(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  const stats = [
    { label: "Total Listings",          value: listings.length,                 icon: <HiOutlineHomeModern />,             accent: "blue"   },
    { label: "Total Views",             value: totalViews.toLocaleString(),      icon: <HiOutlineEye />,                    accent: "purple", onClick: () => setSortBy("views"),         tip: "Sort by most viewed" },
    { label: "Expressions of Interest", value: totalInterests.toLocaleString(), icon: <HiOutlineBolt />,                   accent: "amber",  onClick: () => setSortBy("interests"),     tip: "Sort by most interest" },
    { label: "Available Now",           value: availableCount,                  icon: <HiOutlineCheckCircle />,            accent: "green",  onClick: () => setFilter("Available Now"), tip: "Filter available listings" },
    { label: "Pending Inspections",     value: pendingInspCount,                icon: <HiOutlineClipboardDocumentCheck />, accent: pendingInspCount > 0 ? "amber" : "gray", onClick: () => setInspectFilter("pending"), tip: "View pending inspections" },
    { label: "Pending Reservations",    value: pendingResCount,                 icon: <HiOutlineShieldCheck />,            accent: pendingResCount > 0 ? "teal" : "gray",  onClick: () => setReserveFilter("pending"),  tip: "View pending reservations" },
    {
      label:    "Avg Conversion",
      value:    avgConversion !== null ? avgConversion + "%" : "—",
      icon:     <HiOutlineArrowTrendingUp />,
      accent:   avgConversion === null ? "gray" : avgConversion >= 15 ? "hot" : avgConversion >= 5 ? "teal" : "red",
      onClick:  () => setSortBy("conversion"),
      tip:      "Sort by best conversion",
      sublabel: avgConversion !== null
        ? (avgConversion >= 15 ? "High demand overall" : avgConversion >= 5 ? "Performing well" : "Needs attention")
        : "Not enough data yet",
    },
  ];

  const filterTabs = [
    { key: "All",            label: "All" },
    { key: "Available Now",  label: "Available Now" },
    { key: "Available Soon", label: "Available Soon" },
    { key: "Not Available",  label: "Not Available" },
    { key: "High Demand",    label: "High Demand",    hot:   highDemandCount > 0 },
    { key: "Expiring",       label: "Needs Attention", alert: needsAttention > 0 },
  ];

  return (
    <main className="dashboard">

      {/* Toast */}
      <AnimatePresence>
        {inspectToast && (
          <motion.div
            className={"dashboard__inspect-toast" + (inspectToast.type === "error" ? " error" : "")}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          >
            {inspectToast.type === "error" ? <HiOutlineExclamationTriangle /> : <HiOutlineCheck />}
            {inspectToast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expiry Banner */}
      <AnimatePresence>
        {needsAttention > 0 && !dismissedBanner && (
          <motion.div className="dashboard__expiry-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}>
            <div className="dashboard__expiry-banner-inner">
              <HiOutlineExclamationTriangle className="dashboard__expiry-banner-icon" />
              <div className="dashboard__expiry-banner-text">
                <strong>
                  {expiredListings.length > 0 && expiredListings.length + " listing" + (expiredListings.length !== 1 ? "s" : "") + " expired"}
                  {expiredListings.length > 0 && expiringListings.length > 0 && " · "}
                  {expiringListings.length > 0 && expiringListings.length + " listing" + (expiringListings.length !== 1 ? "s" : "") + " expiring soon"}
                </strong>
                <span>Renew to confirm these properties are still available.</span>
              </div>
              <button className="dashboard__expiry-banner-cta" onClick={() => { setFilter("Expiring"); setDismissedBanner(true); }}>Review now</button>
              <button className="dashboard__expiry-banner-dismiss" onClick={() => setDismissedBanner(true)} aria-label="Dismiss">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div className="dashboard__header" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
        <div className="dashboard__header-left">
          <p className="dashboard__eyebrow"><HiOutlineChartBarSquare /> Landlord Dashboard</p>
          <h1>{user.displayName ? user.displayName.split(" ")[0] + "'s Properties" : "Your Properties"}</h1>
          <p className="dashboard__subtitle">Manage your listings, track views and interest, and update availability.</p>
        </div>
        <Link href="/add-listing" className="dashboard__add-btn"><HiOutlinePlus /> Add Listing</Link>
      </motion.div>

      {/* Stats */}
      <motion.div className="dashboard__stats" variants={stagger} initial="hidden" animate="show">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            className={"dashboard__stat dashboard__stat--" + s.accent + (s.onClick ? " dashboard__stat--clickable" : "")}
            variants={fadeUp}
            onClick={s.onClick || undefined}
            title={s.tip}
          >
            <div className="dashboard__stat-icon">{s.icon}</div>
            <div className="dashboard__stat-text">
              <p className="dashboard__stat-value">{s.value}</p>
              <p className="dashboard__stat-label">{s.label}</p>
              {s.sublabel && <p className={"dashboard__stat-sublabel dashboard__stat-sublabel--" + s.accent}>{s.sublabel}</p>}
            </div>
            {s.onClick && <span className="dashboard__stat-arrow">→</span>}
          </motion.div>
        ))}
      </motion.div>

      {/* ── INSPECTIONS SECTION ── */}
      <motion.div className="dashboard__inspections" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <div className="dashboard__inspections-header">
          <div className="dashboard__inspections-title">
            <HiOutlineClipboardDocumentCheck />
            <h2>Inspection Requests</h2>
            {pendingInspCount > 0 && <span className="dashboard__inspections-badge">{pendingInspCount} pending</span>}
          </div>
          <div className="dashboard__inspections-tabs">
            {[
              { key: "pending",   label: "Pending",   count: pendingInspCount },
              { key: "confirmed", label: "Confirmed", count: confirmedInspCount },
              { key: "cancelled", label: "Cancelled", count: inspections.filter((i) => i.status === "cancelled").length },
              { key: "all",       label: "All",       count: inspections.length },
            ].map((tab) => (
              <button
                key={tab.key}
                className={"dashboard__inspect-tab" + (inspectFilter === tab.key ? " active" : "")}
                onClick={() => setInspectFilter(tab.key)}
              >
                {tab.label}
                {tab.count > 0 && <span className="dashboard__inspect-tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>
        </div>

        {inspectionsLoading ? (
          <div className="dashboard__inspections-loading"><span className="dashboard__mini-spinner" /><span>Loading inspections...</span></div>
        ) : filteredInspections.length === 0 ? (
          <div className="dashboard__inspections-empty">
            <HiOutlineClipboardDocumentCheck />
            <p>{inspectFilter === "pending" ? "No pending inspection requests." : "No inspections in this category."}</p>
          </div>
        ) : (
          <div className="dashboard__inspections-list">
            <AnimatePresence>
              {filteredInspections.map((insp) => (
                <motion.div
                  key={insp.id}
                  className={"dashboard__inspect-card dashboard__inspect-card--" + insp.status}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}
                >
                  <div className="dashboard__inspect-card-left">
                    <div className="dashboard__inspect-card-avatar">{(insp.tenantName || "?")[0].toUpperCase()}</div>
                    <div className="dashboard__inspect-card-info">
                      <p className="dashboard__inspect-card-name">
                        {insp.tenantName}
                        <span className={"dashboard__inspect-status dashboard__inspect-status--" + insp.status}>{insp.status}</span>
                      </p>
                      <p className="dashboard__inspect-card-listing">{insp.listingTitle}</p>
                      <div className="dashboard__inspect-card-meta">
                        <span><HiOutlineCalendarDays />{insp.date} at {insp.time}</span>
                        {insp.tenantPhone && <span><HiOutlinePhone />{insp.tenantPhone}</span>}
                      </div>
                      {insp.note && <p className="dashboard__inspect-card-note">"{insp.note}"</p>}
                    </div>
                  </div>
                  {insp.status === "pending" && (
                    <div className="dashboard__inspect-card-actions">
                      <button className="dashboard__inspect-confirm" onClick={() => handleInspectionStatus(insp.id, "confirmed")} disabled={updatingInspectId === insp.id}>
                        <HiOutlineCheck /><span>Confirm</span>
                      </button>
                      <button className="dashboard__inspect-cancel" onClick={() => handleInspectionStatus(insp.id, "cancelled")} disabled={updatingInspectId === insp.id}>
                        <HiOutlineXCircle /><span>Decline</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <motion.div className="dashboard__controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.3 }}>
        <div className="dashboard__filters">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              className={"dashboard__filter-btn" + (filter === tab.key ? " active" : "") + (tab.alert ? " alert" : "") + (tab.hot ? " hot" : "")}
              onClick={() => setFilter(tab.key)}
            >
              {tab.alert && <span className="dashboard__filter-alert-dot" />}
              {tab.hot   && <span className="dashboard__filter-hot-dot" />}
              {tab.label}
              {tab.key === "High Demand" && highDemandCount > 0 && <span className="dashboard__filter-count dashboard__filter-count--hot">{highDemandCount}</span>}
              {tab.key !== "All" && tab.key !== "Expiring" && tab.key !== "High Demand" && <span className="dashboard__filter-count">{listings.filter((l) => l.availability === tab.key).length}</span>}
              {tab.key === "Expiring" && needsAttention > 0 && <span className="dashboard__filter-count dashboard__filter-count--alert">{needsAttention}</span>}
            </button>
          ))}
        </div>
        <select className="dashboard__sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="views">Most viewed</option>
          <option value="interests">Most interest</option>
          <option value="conversion">Best conversion</option>
          <option value="price">Highest price</option>
          <option value="expiring">Expiring first</option>
        </select>
      </motion.div>

      {/* Listings */}
      {listings.length === 0 ? (
        <motion.div className="dashboard__empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <HiOutlineHomeModern className="dashboard__empty-icon" />
          <h2>No listings yet</h2>
          <p>Post your first property and start receiving enquiries.</p>
          <Link href="/add-listing" className="dashboard__add-btn"><HiOutlinePlus /> Add Your First Listing</Link>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div className="dashboard__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p>No listings match this filter.</p>
        </motion.div>
      ) : (
        <motion.div className="dashboard__listings" variants={stagger} initial="hidden" animate="show">
          <AnimatePresence>
            {filtered.map((listing) => {
              const thumb      = listing.images?.[0] || listing.image || null;
              const hasVideo   = !!listing.videoUrl;
              const status     = getExpiryStatus(listing);
              const age        = getListingAge(listing);
              const daysLeft   = daysUntilExpiry(listing);
              const isExpired  = status === "expired";
              const isExpiring = status === "expiring";
              const isRenewing = renewingId === listing.id;
              const views      = Number(listing.views)     || 0;
              const interests  = Number(listing.interests) || 0;
              const rate       = getConversionRate(listing);
              const { text: convLabel, tier: convTier } = getConversionLabel(rate, views);
              const barWidth   = rate !== null ? Math.min(rate, 100) : 0;

              return (
                <motion.div
                  key={listing.id}
                  className={"dashboard__card" + (isExpired ? " dashboard__card--expired" : "") + (isExpiring ? " dashboard__card--expiring" : "")}
                  variants={fadeUp} layout
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
                >
                  <div className="dashboard__card-thumb">
                    {thumb ? <img src={thumb} alt={listing.title} />
                      : hasVideo ? <div className="dashboard__card-thumb-video"><HiOutlinePlayCircle /><span>Video</span></div>
                      : <div className="dashboard__card-thumb-empty"><HiOutlinePhoto /></div>}
                    {listing.verified && <span className="dashboard__card-verified">Verified</span>}
                    {isExpired  && <span className="dashboard__card-expiry-badge dashboard__card-expiry-badge--expired">Expired</span>}
                    {isExpiring && !isExpired && <span className="dashboard__card-expiry-badge dashboard__card-expiry-badge--expiring">{daysLeft}d left</span>}
                  </div>

                  <div className="dashboard__card-body">
                    <div className="dashboard__card-top">
                      <div className="dashboard__card-info">
                        <h3 className="dashboard__card-title">{listing.title}</h3>
                        <p className="dashboard__card-location"><HiOutlineMapPin />{listing.location}</p>
                        <div className="dashboard__card-meta">
                          <span><HiOutlineHomeModern />{listing.type}</span>
                          <span><HiOutlineBanknotes />₦{Number(listing.price).toLocaleString()}<em>/yr</em></span>
                          <span className="dashboard__card-date"><HiOutlineClock />Listed {formatDate(listing.createdAt)}</span>
                          {listing.renewedAt && <span className="dashboard__card-renewed"><HiOutlineArrowPath />Renewed {formatDate(listing.renewedAt)}</span>}
                        </div>
                      </div>
                      <div className="dashboard__card-actions">
                        <Link href={"/listings/" + listing.id} className="dashboard__action-btn dashboard__action-btn--view" title="View listing" target="_blank"><HiOutlineArrowTopRightOnSquare /></Link>
                        <Link href={"/listings/" + listing.id} className="dashboard__action-btn dashboard__action-btn--edit" title="Edit listing"><HiOutlinePencilSquare /></Link>
                        <button className="dashboard__action-btn dashboard__action-btn--delete" onClick={() => handleDelete(listing.id)} disabled={deletingId === listing.id}>
                          {deletingId === listing.id ? <span className="dashboard__mini-spinner" /> : <HiOutlineTrash />}
                        </button>
                      </div>
                    </div>

                    {(isExpired || isExpiring) && (
                      <div className={"dashboard__expiry-prompt" + (isExpired ? " dashboard__expiry-prompt--expired" : " dashboard__expiry-prompt--expiring")}>
                        <div className="dashboard__expiry-prompt-left">
                          <HiOutlineExclamationTriangle />
                          <div>
                            <strong>
                              {isExpired
                                ? "Expired " + (age - EXPIRY_DAYS === 0 ? "today" : (age - EXPIRY_DAYS) + " day" + (age - EXPIRY_DAYS !== 1 ? "s" : "") + " ago")
                                : "Expires in " + daysLeft + " day" + (daysLeft !== 1 ? "s" : "")}
                            </strong>
                            <span>{isExpired ? "Renew to confirm this property is still available." : "Renew soon to keep this listing active and visible."}</span>
                          </div>
                        </div>
                        <button className="dashboard__renew-btn" onClick={() => handleRenew(listing.id)} disabled={isRenewing}>
                          {isRenewing ? <span className="dashboard__mini-spinner" /> : <HiOutlineArrowPath />}
                          {isRenewing ? "Renewing..." : "Renew Listing"}
                        </button>
                      </div>
                    )}

                    <div className="dashboard__card-stats">
                      <div className="dashboard__card-stat"><HiOutlineEye /><span>{views} views</span></div>
                      <div className="dashboard__card-stat dashboard__card-stat--interest"><HiOutlineBolt /><span>{interests} interested</span></div>
                      <div className={"dashboard__conversion dashboard__conversion--" + convTier}>
                        <div className="dashboard__conversion-top">
                          <span className="dashboard__conversion-label">{convLabel}</span>
                          {rate !== null && views >= 5 && <span className="dashboard__conversion-rate">{rate}%</span>}
                        </div>
                        {rate !== null && views >= 5 && (
                          <div className="dashboard__conversion-bar">
                            <div className="dashboard__conversion-fill" style={{ width: barWidth + "%" }} />
                          </div>
                        )}
                      </div>
                      <div className="dashboard__availability-wrap">
                        <select
                          className={"dashboard__availability-select " + (listing.availability === "Available Now" ? "available" : listing.availability === "Available Soon" ? "soon" : "unavailable")}
                          value={listing.availability || "Not Available"}
                          onChange={(e) => handleAvailabilityChange(listing.id, e.target.value)}
                          disabled={updatingId === listing.id}
                        >
                          {AVAILABILITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        {updatingId === listing.id && <span className="dashboard__mini-spinner" />}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </main>
  );
}