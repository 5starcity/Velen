"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  HiOutlineMapPin,
  HiOutlineArrowRight,
  HiOutlineHeart,
  HiOutlineStar,
  HiCheckBadge,
  HiOutlineClock,
  HiMagnifyingGlass,
} from "react-icons/hi2";
import "@/styles/hero.css";

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] },
});

const fade = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.55, delay },
});

function naira(n) {
  if (!n && n !== 0) return "—";
  return "₦" + Number(n).toLocaleString("en-NG");
}

const QUICK_CHIPS = [
  { label: "Near RSU",      href: "/listings?school=RSU" },
  { label: "Near UniPort",  href: "/listings?school=UniPort" },
  { label: "Self-con",      href: "/listings?type=self-con" },
  { label: "Under ₦80k",   href: "/listings?maxPrice=80000" },
];

// ── Featured listing card ─────────────────────────────────
function FeaturedCard({ listing, index, total }) {
  if (!listing) return null;

  const {
    title,
    location,
    price,
    cautionFee = 0,
    agencyFee = 0,
    legalFee = 0,
    images = [],
    verified,
    available,
    school,
    distanceToGate,
  } = listing;

  const image = images[0] || null;
  const moveInTotal =
    Number(price || 0) +
    Number(cautionFee || 0) +
    Number(agencyFee || 0) +
    Number(legalFee || 0);

  return (
    <motion.div
      key={listing.id}
      className="hero__card"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Featured ribbon */}
      <div className="hero__card-ribbon">
        <HiOutlineStar aria-hidden="true" />
        Featured
      </div>

      {/* Location chip */}
      {(school || location) && (
        <div className="hero__card-chip">
          <HiOutlineMapPin aria-hidden="true" />
          <div>
            <span className="hero__card-chip-title">
              {school ? `Near ${school} Gate` : location}
            </span>
            {distanceToGate && (
              <span className="hero__card-chip-sub">
                <HiOutlineClock aria-hidden="true" /> {distanceToGate}
              </span>
            )}
          </div>
        </div>
      )}

      <Link href={`/listings/${listing.id}`} className="hero__card-link">

        {/* Image */}
        <div className="hero__card-img-wrap">
          {image ? (
            <img src={image} alt={title} className="hero__card-img" />
          ) : (
            <div className="hero__card-img-empty">
              <HiOutlineMapPin aria-hidden="true" />
            </div>
          )}

          <button
            className="hero__card-heart"
            aria-label="Save listing"
            onClick={(e) => e.preventDefault()}
          >
            <HiOutlineHeart />
          </button>

          {total > 1 && (
            <div className="hero__card-dots">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`hero__card-dot${i === index ? " active" : ""}`} />
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="hero__card-body">
          {available !== false && (
            <div className="hero__card-avail">
              <span className="hero__card-avail-dot" />
              Available Now
            </div>
          )}
          <div className="hero__card-title">{title}</div>
          <div className="hero__card-price">
            {naira(price)}<span>/yr</span>
          </div>

          <div className="hero__card-fees">
            <div className="hero__card-fee-row">
              <span>Caution fee</span>
              <span className={cautionFee === 0 ? "zero" : ""}>{naira(cautionFee)}</span>
            </div>
            <div className="hero__card-fee-row">
              <span>Agency fee</span>
              <span className={agencyFee === 0 ? "zero" : ""}>{naira(agencyFee)}</span>
            </div>
            <div className="hero__card-fee-row">
              <span>Legal fee</span>
              <span className={legalFee === 0 ? "zero" : ""}>{naira(legalFee)}</span>
            </div>
            <div className="hero__card-fee-row hero__card-fee-row--total">
              <span>Move-in total</span>
              <span>{naira(moveInTotal)}</span>
            </div>
          </div>

          {verified && (
            <div className="hero__card-verified">
              <HiCheckBadge aria-hidden="true" />
              Verified property
            </div>
          )}
        </div>

        <div className="hero__card-nohidden">
          <HiCheckBadge aria-hidden="true" />
          <div>
            <strong>No hidden fees</strong>
            <span>What you see is what you pay</span>
          </div>
        </div>

      </Link>
    </motion.div>
  );
}

// ── Hero ──────────────────────────────────────────────────
export default function Hero() {
  const { user, userRole } = useAuth();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [activeIndex, setActiveIndex]           = useState(0);
  const [status, setStatus]                     = useState("loading");

  useEffect(() => {
    async function fetchFeatured() {
      setStatus("loading");
      try {
        const now = new Date();
        const q = query(
          collection(db, "listings"),
          where("featured", "==", true),
          where("featuredExpiry", ">", now),
          orderBy("featuredExpiry", "asc"),
          limit(6)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          const fallback = query(
            collection(db, "listings"),
            where("verified", "==", true),
            limit(3)
          );
          const fallbackSnap = await getDocs(fallback);
          const data = fallbackSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setFeaturedListings(data);
          setStatus(data.length > 0 ? "fallback" : "empty");
        } else {
          const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setFeaturedListings(data);
          setStatus("ok");
        }
      } catch {
        try {
          const simpleQ = query(
            collection(db, "listings"),
            where("featured", "==", true),
            limit(6)
          );
          const snap2 = await getDocs(simpleQ);
          const data = snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
          setFeaturedListings(data);
          setStatus(data.length > 0 ? "ok" : "empty");
        } catch {
          setStatus("error");
        }
      }
    }
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (featuredListings.length <= 1) return;
    const t = setInterval(
      () => setActiveIndex((i) => (i + 1) % featuredListings.length),
      4000
    );
    return () => clearInterval(t);
  }, [featuredListings.length]);

  const activeListing = featuredListings[activeIndex] ?? null;

  return (
    <section className="hero">
      <div className="hero__inner">

        {/* ── Left ── */}
        <div className="hero__left">
          <motion.div className="hero__eyebrow" {...fade(0.05)}>
            <HiOutlineMapPin aria-hidden="true" />
            <span>Port Harcourt, Nigeria</span>
          </motion.div>

          <motion.h1 className="hero__headline" {...rise(0.12)}>
            Find your next place
            <em> near campus</em>
          </motion.h1>

          <motion.p className="hero__sub" {...rise(0.22)}>
            Verified listings across Port Harcourt universities —
            no agent fees, full costs upfront.
          </motion.p>

          {/* Search bar */}
          <motion.div className="hero__search" {...rise(0.30)}>
            <HiMagnifyingGlass className="hero__search-icon" aria-hidden="true" />
            <input
              className="hero__search-input"
              type="text"
              placeholder="Search by location or school…"
              readOnly
              onClick={() => window.location.href = "/listings"}
            />
            <Link href="/listings" className="hero__search-btn">
              Search
            </Link>
          </motion.div>

          {/* Quick chips */}
          <motion.div className="hero__chips" {...fade(0.42)}>
            {QUICK_CHIPS.map((c) => (
              <Link key={c.label} href={c.href} className="hero__chip">
                {c.label}
              </Link>
            ))}
          </motion.div>

          {/* Auth CTAs */}
          <motion.div className="hero__actions" {...fade(0.50)}>
            {!user && (
              <>
                <Link href="/listings" className="hero__btn hero__btn--primary">
                  Browse Rooms <HiOutlineArrowRight aria-hidden="true" />
                </Link>
                <Link href="/signup" className="hero__btn hero__btn--ghost">
                  Join Free
                </Link>
              </>
            )}
            {userRole === "student" && (
              <>
                <Link href="/listings" className="hero__btn hero__btn--primary">
                  Browse Rooms <HiOutlineArrowRight aria-hidden="true" />
                </Link>
                <Link href="/roommates" className="hero__btn hero__btn--ghost">
                  Find Roommate
                </Link>
              </>
            )}
            {userRole === "landlord" && (
              <>
                <Link href="/listings" className="hero__btn hero__btn--primary">
                  Browse Rooms <HiOutlineArrowRight aria-hidden="true" />
                </Link>
                <Link href="/add-listing" className="hero__btn hero__btn--ghost">
                  List Property
                </Link>
              </>
            )}
          </motion.div>
        </div>

        {/* ── Right — Featured card ── */}
        <motion.div className="hero__right" {...fade(0.40)}>
          <AnimatePresence mode="wait">
            {status === "loading" ? (
              <motion.div
                key="skeleton"
                className="hero__card hero__card--skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="hero__card-img-wrap hero__card-img-wrap--skeleton" />
                <div className="hero__card-body">
                  <div className="hero__skel-line hero__skel-line--short" />
                  <div className="hero__skel-line" />
                  <div className="hero__skel-line hero__skel-line--med" />
                </div>
              </motion.div>
            ) : activeListing ? (
              <FeaturedCard
                key={activeListing.id}
                listing={activeListing}
                index={activeIndex}
                total={featuredListings.length}
              />
            ) : null}
          </AnimatePresence>

          <motion.div className="hero__feature-cta" {...fade(0.85)}>
            <HiOutlineStar aria-hidden="true" />
            <span>
              {status === "ok"
                ? "Want your listing here? "
                : "Be the first featured listing! "}
              <Link href="/landlord/feature">Get featured →</Link>
            </span>
          </motion.div>
        </motion.div>

      </div>

      {/* Stats bar */}
      <motion.div className="hero__stats" {...fade(0.60)}>
        <div className="hero__stat">
          <span className="hero__stat-num">120+</span>
          <span className="hero__stat-lbl">Listings</span>
        </div>
        <div className="hero__stat-divider" />
        <div className="hero__stat">
          <span className="hero__stat-num">4</span>
          <span className="hero__stat-lbl">Universities</span>
        </div>
        <div className="hero__stat-divider" />
        <div className="hero__stat">
          <span className="hero__stat-num">100%</span>
          <span className="hero__stat-lbl">Verified</span>
        </div>
        <div className="hero__stat-divider" />
        <div className="hero__stat">
          <span className="hero__stat-num">₦0</span>
          <span className="hero__stat-lbl">Agent fee</span>
        </div>
      </motion.div>
    </section>
  );
}