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
  HiOutlineMapPin,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlinePhoto,
  HiOutlinePlayCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowPath,
  HiOutlineArrowTrendingUp,
  HiOutlineCheck,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  fetchListingsByLandlord,
  deleteListing,
  updateListingAvailability,
  renewListing,
} from "@/lib/firestoreListings";
import "@/styles/dashboard.css";

/* ─────────────────────────── constants ─────────────────────────── */

const AVAILABILITY_OPTIONS = ["Available Now", "Available Soon", "Not Available"];
const EXPIRY_DAYS = 90;
const WARN_DAYS   = 75;


/* ─────────────────────────── helpers ───────────────────────────── */

function getListingAge(listing) {
  const base = listing.renewedAt ?? listing.createdAt;
  if (!base) return 0;
  const date = base.toDate ? base.toDate() : new Date(base);
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function getExpiryStatus(listing) {
  const age = getListingAge(listing);
  if (age >= EXPIRY_DAYS) return "expired";
  if (age >= WARN_DAYS)   return "expiring";
  return "fresh";
}

function daysUntilExpiry(listing) {
  return Math.max(0, EXPIRY_DAYS - getListingAge(listing));
}

function getConversionRate(listing) {
  const views     = Number(listing.views)     || 0;
  const interests = Number(listing.interests) || 0;
  if (views === 0) return null;
  return Math.round((interests / views) * 1000) / 10;
}

function getConversionLabel(rate, views) {
  if (rate === null || views < 5)  return { text: "Not enough data", tier: "neutral" };
  if (rate >= 15)                  return { text: "High demand",     tier: "hot"     };
  if (rate >= 5)                   return { text: "Good",            tier: "good"    };
  if (views >= 10)                 return { text: "Low conversion",  tier: "low"     };
  return { text: "Not enough data", tier: "neutral" };
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

/* ─────────────────────────── animation ─────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

/* ═══════════════════════════ component ═════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();

  /* listings */
  const [listings, setListings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [deletingId, setDeletingId]   = useState(null);
  const [updatingId, setUpdatingId]   = useState(null);
  const [renewingId, setRenewingId]   = useState(null);
  const [filter, setFilter]           = useState("All");
  const [sortBy, setSortBy]           = useState("newest");
  const [dismissed, setDismissed]     = useState(false);

  /* toast */
  const [toast, setToast] = useState(null);

  /* ── auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    if (userRole && userRole !== "landlord") router.push("/listings");
  }, [user, userRole, authLoading]);

  /* ── data loaders ── */
  useEffect(() => {
    if (!user) return;
    fetchListingsByLandlord(user.uid)
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  /* ── toast helper ── */
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ── handlers ── */
  async function handleDelete(id) {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteListing(id);
      setListings(prev => prev.filter(l => l.id !== id));
      showToast("Listing deleted.");
    } catch {
      showToast("Could not delete listing.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAvailabilityChange(id, val) {
    setUpdatingId(id);
    try {
      await updateListingAvailability(id, val);
      setListings(prev => prev.map(l => l.id === id ? { ...l, availability: val } : l));
    } catch (e) { console.error(e); }
    finally { setUpdatingId(null); }
  }

  async function handleRenew(id) {
    setRenewingId(id);
    try {
      const renewedAt = await renewListing(id);
      setListings(prev => prev.map(l => l.id === id ? { ...l, renewedAt } : l));
      showToast("Listing renewed successfully.");
    } catch {
      showToast("Could not renew listing.", "error");
    } finally {
      setRenewingId(null);
    }
  }

  /* ─────────────────────── derived values ─────────────────────── */

  if (authLoading || loading) {
    return (
      <main className="db">
        <div className="db__inner">
          <div className="db__loading">
            <div className="db__spinner" />
            <p>Loading your dashboard…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || userRole !== "landlord") return null;

  /* aggregates */
  const expiredListings  = listings.filter(l => getExpiryStatus(l) === "expired");
  const expiringListings = listings.filter(l => getExpiryStatus(l) === "expiring");
  const needsAttention   = expiredListings.length + expiringListings.length;
  const totalViews       = listings.reduce((s, l) => s + (Number(l.views) || 0), 0);
  const availableCount   = listings.filter(l => l.availability === "Available Now").length;
  const highDemandCount  = listings.filter(l => (getConversionRate(l) ?? 0) >= 15).length;

  const listingsWithData = listings.filter(l => (Number(l.views) || 0) >= 5);
  const avgConversion    = listingsWithData.length > 0
    ? Math.round(listingsWithData.reduce((s, l) => s + getConversionRate(l), 0) / listingsWithData.length * 10) / 10
    : null;

  /* filtered / sorted listings */
  const filtered = listings
    .filter(l => {
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

  /* stat cards */
  const stats = [
    {
      label: "Listings",
      value: listings.length,
      icon:  <HiOutlineHomeModern />,
      accent: "green",
    },
    {
      label:   "Total views",
      value:   totalViews.toLocaleString(),
      icon:    <HiOutlineEye />,
      accent:  "purple",
      onClick: () => setSortBy("views"),
      tip:     "Sort by most viewed",
    },
    {
      label:   "Available now",
      value:   availableCount,
      icon:    <HiOutlineCheckCircle />,
      accent:  "teal",
      onClick: () => setFilter("Available Now"),
      tip:     "Show available listings",
    },
    {
      label:    "Avg conversion",
      value:    avgConversion !== null ? `${avgConversion}%` : "—",
      icon:     <HiOutlineArrowTrendingUp />,
      accent:   avgConversion === null ? "gray" : avgConversion >= 15 ? "hot" : avgConversion >= 5 ? "teal" : "red",
      onClick:  () => setSortBy("conversion"),
      tip:      "Sort by best conversion",
      sublabel: avgConversion !== null
        ? (avgConversion >= 15 ? "High demand overall" : avgConversion >= 5 ? "Performing well" : "Needs attention")
        : "Not enough data yet",
      subclass: avgConversion === null ? "muted" : avgConversion >= 15 ? "hot" : avgConversion >= 5 ? "good" : "warn",
    },
  ];

  /* filter tabs */
  const filterTabs = [
    { key: "All",            label: "All" },
    { key: "Available Now",  label: "Available Now" },
    { key: "Available Soon", label: "Available Soon" },
    { key: "High Demand",    label: "High demand",  hot:   highDemandCount > 0 },
    { key: "Expiring",       label: "Needs attention", alert: needsAttention > 0 },
  ];

  /* ─────────────────────────── render ─────────────────────────── */

  return (
    <main className="db">
      <div className="db__inner">

        {/* ── Toast ── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`db__toast${toast.type === "error" ? " db__toast--error" : ""}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {toast.type === "error" ? <HiOutlineExclamationTriangle /> : <HiOutlineCheck />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Top bar ── */}
        <motion.div
          className="db__topbar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="db__topbar-left">
            <h1>{user.displayName ? `${user.displayName.split(" ")[0]}'s properties` : "Your properties"}</h1>
            <p>Manage listings, confirm visits, and track interest.</p>
          </div>
          <Link href="/add-listing" className="db__add-btn">
            <HiOutlinePlus /> Add listing
          </Link>
        </motion.div>

        {/* ── Attention banner ── */}
        <AnimatePresence>
          {needsAttention > 0 && !dismissed && (
            <motion.div
              className="db__banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <HiOutlineExclamationTriangle className="db__banner-icon" />
              <div className="db__banner-body">
                <strong>
                  {expiredListings.length > 0 && `${expiredListings.length} listing${expiredListings.length !== 1 ? "s" : ""} expired`}
                  {expiredListings.length > 0 && expiringListings.length > 0 && " · "}
                  {expiringListings.length > 0 && `${expiringListings.length} expiring soon`}
                </strong>
                <span>Renew to let students know these properties are still available.</span>
              </div>
              <div className="db__banner-actions">
                <button
                  className="db__banner-cta"
                  onClick={() => { setFilter("Expiring"); setDismissed(true); }}
                >
                  Review now
                </button>
                <button className="db__banner-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats ── */}
        <motion.div className="db__stats" variants={stagger} initial="hidden" animate="show">
          {stats.map(s => (
            <motion.div
              key={s.label}
              className={`db__stat db__stat--${s.accent}${s.onClick ? " db__stat--clickable" : ""}`}
              variants={fadeUp}
              onClick={s.onClick}
              title={s.tip}
            >
              <div className="db__stat-icon">{s.icon}</div>
              <p className="db__stat-value">{s.value}</p>
              <p className="db__stat-label">{s.label}</p>
              {s.sublabel && (
                <p className={`db__stat-sub db__stat-sub--${s.subclass}`}>{s.sublabel}</p>
              )}
            </motion.div>
          ))}
        </motion.div>
        
         {/* ══════════════════ LISTINGS ══════════════════ */}

        {/* Controls */}
        <motion.div
          className="db__controls"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.26, duration: 0.28 }}
        >
          <div className="db__filters">
            {filterTabs.map(tab => {
              const count =
                tab.key === "All"         ? null :
                tab.key === "High Demand" ? (highDemandCount > 0 ? highDemandCount : null) :
                tab.key === "Expiring"    ? (needsAttention > 0 ? needsAttention : null) :
                listings.filter(l => l.availability === tab.key).length || null;

              return (
                <button
                  key={tab.key}
                  className={`db__filter-btn${filter === tab.key ? " active" : ""}${tab.alert ? " alert" : ""}${tab.hot ? " hot" : ""}`}
                  onClick={() => setFilter(tab.key)}
                >
                  {tab.alert && <span className="db__filter-dot db__filter-dot--amber" />}
                  {tab.hot   && <span className="db__filter-dot db__filter-dot--hot" />}
                  {tab.label}
                  {count !== null && <span className="db__filter-count">{count}</span>}
                </button>
              );
            })}
          </div>

          <select
            className="db__sort"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="views">Most viewed</option>
            <option value="interests">Most interest</option>
            <option value="conversion">Best conversion</option>
            <option value="price">Highest price</option>
            <option value="expiring">Expiring first</option>
          </select>
        </motion.div>

        {/* Listings list */}
        {listings.length === 0 ? (
          <motion.div
            className="db__empty"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <HiOutlineHomeModern />
            <h2>No listings yet</h2>
            <p>Post your first property and start receiving enquiries from students.</p>
            <Link href="/add-listing" className="db__add-btn" style={{ marginTop: 4 }}>
              <HiOutlinePlus /> Add your first listing
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div className="db__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <HiOutlineHomeModern />
            <p>No listings match this filter.</p>
          </motion.div>
        ) : (
          <motion.div className="db__listings" variants={stagger} initial="hidden" animate="show">
            <AnimatePresence>
              {filtered.map(listing => {
                const thumb      = listing.images?.[0] || listing.image || null;
                const hasVideo   = !!listing.videoUrl;
                const status     = getExpiryStatus(listing);
                const age        = getListingAge(listing);
                const daysLeft   = daysUntilExpiry(listing);
                const isExpired  = status === "expired";
                const isExpiring = status === "expiring";
                const isRenewing = renewingId === listing.id;
                const isTaken    = listing.status === "taken";
                const views      = Number(listing.views)     || 0;
                const interests  = Number(listing.interests) || 0;
                const rate       = getConversionRate(listing);
                const { text: convLabel, tier: convTier } = getConversionLabel(rate, views);
                const availClass = listing.availability === "Available Now" ? "available"
                                 : listing.availability === "Available Soon" ? "soon"
                                 : "unavailable";

                return (
                  <motion.div
                    key={listing.id}
                    className={`db__card${isExpired ? " db__card--expired" : ""}${isExpiring ? " db__card--expiring" : ""}${isTaken ? " db__card--taken" : ""}`}
                    variants={fadeUp}
                    layout
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
                  >
                    {/* Thumbnail */}
                    <div className="db__thumb">
                      {thumb
                        ? <img src={thumb} alt={listing.title} />
                        : hasVideo
                          ? <div className="db__thumb-empty"><HiOutlinePlayCircle /><span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--ink-3)" }}>Video</span></div>
                          : <div className="db__thumb-empty"><HiOutlinePhoto /></div>
                      }
                      {listing.verified && (
                        <span className="db__thumb-badge db__thumb-badge--verified">Verified</span>
                      )}
                      {isTaken && (
                        <span className="db__thumb-badge db__thumb-badge--taken">Taken</span>
                      )}
                      {isExpired && !isTaken && (
                        <span className="db__thumb-badge db__thumb-badge--expired">Expired</span>
                      )}
                      {isExpiring && !isExpired && !isTaken && (
                        <span className="db__thumb-badge db__thumb-badge--expiring">{daysLeft}d left</span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="db__card-body">
                      <div className="db__card-top">
                        <div className="db__card-info">
                          <h3 className="db__card-title">{listing.title}</h3>
                          <p className="db__card-location">
                            <HiOutlineMapPin />{listing.location}
                          </p>
                          <div className="db__card-meta">
                            <span><HiOutlineHomeModern />{listing.type}</span>
                            <span><HiOutlineBanknotes />₦{Number(listing.price).toLocaleString()}<em>/yr</em></span>
                            <span className="muted"><HiOutlineClock />Listed {formatDate(listing.createdAt)}</span>
                            {listing.renewedAt && (
                              <span style={{ color: "var(--accent)" }}><HiOutlineArrowPath />Renewed {formatDate(listing.renewedAt)}</span>
                            )}
                            {isTaken && listing.takenAt && (
                              <span style={{ color: "var(--text-secondary)" }}><HiOutlineLockClosed />Taken {formatDate(listing.takenAt)}</span>
                            )}
                          </div>
                        </div>

                        <div className="db__card-actions">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="db__action"
                            title="View listing"
                            target="_blank"
                          >
                            <HiOutlineArrowTopRightOnSquare />
                          </Link>
                          <Link
                            href={`/listings/${listing.id}/edit`}
                            className="db__action"
                            title="Edit listing"
                          >
                            <HiOutlinePencilSquare />
                          </Link>
                          <button
                            className="db__action db__action--delete"
                            onClick={() => handleDelete(listing.id)}
                            disabled={deletingId === listing.id}
                            title="Delete listing"
                          >
                            {deletingId === listing.id
                              ? <span className="db__mini-spin" />
                              : <HiOutlineTrash />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Taken notice — takes priority over expiry prompt */}
                      {isTaken ? (
                        <div className="db__taken-prompt">
                          <div className="db__taken-left">
                            <HiOutlineLockClosed />
                            <div>
                              <strong>This listing has been taken</strong>
                              <span>
                                {listing.takenByName
                                  ? `Paid for by ${listing.takenByName}. It's no longer visible to students browsing.`
                                  : "It's no longer visible to students browsing."}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (isExpired || isExpiring) && (
                        <div className={`db__expiry-prompt db__expiry-prompt--${isExpired ? "expired" : "expiring"}`}>
                          <div className="db__expiry-left">
                            <HiOutlineExclamationTriangle />
                            <div>
                              <strong>
                                {isExpired
                                  ? `Expired ${age - EXPIRY_DAYS === 0 ? "today" : `${age - EXPIRY_DAYS} day${age - EXPIRY_DAYS !== 1 ? "s" : ""} ago`}`
                                  : `Expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
                              </strong>
                              <span>
                                {isExpired
                                  ? "Renew so students know this property is still available."
                                  : "Renew soon to keep this listing visible to students."}
                              </span>
                            </div>
                          </div>
                          <button
                            className="db__renew-btn"
                            onClick={() => handleRenew(listing.id)}
                            disabled={isRenewing}
                          >
                            {isRenewing ? <span className="db__mini-spin" /> : <HiOutlineArrowPath />}
                            {isRenewing ? "Renewing…" : "Renew listing"}
                          </button>
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="db__card-bottom">
                        <span className="db__card-stat">
                          <HiOutlineEye />{views} views
                        </span>
                        <span className="db__card-stat">
                          <HiOutlineBolt />{interests} interested
                        </span>

                        {/* Conversion (label only, no bar) */}
                        <div className={`db__conv db__conv--${convTier}`}>
                          <div className="db__conv-top">
                            <span className="db__conv-label">{convLabel}</span>
                            {rate !== null && views >= 5 && (
                              <span className="db__conv-rate">{rate}%</span>
                            )}
                          </div>
                        </div>

                        {/* Availability */}
                        <div className="db__avail-wrap">
                          {isTaken ? (
                            <span
                              className="db__avail-select db__avail-select--taken"
                              title="This listing has been paid for and is no longer available"
                            >
                              <HiOutlineLockClosed /> Taken
                            </span>
                          ) : (
                            <>
                              <select
                                className={`db__avail-select ${availClass}`}
                                value={listing.availability || "Not Available"}
                                onChange={e => handleAvailabilityChange(listing.id, e.target.value)}
                                disabled={updatingId === listing.id}
                              >
                                {AVAILABILITY_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              {updatingId === listing.id && <span className="db__mini-spin" />}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

      </div>
    </main>
  );
}