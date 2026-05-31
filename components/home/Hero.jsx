// components/home/Hero.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
  HiOutlineUserGroup,
  HiOutlineArrowRight,
  HiOutlineMapPin,
  HiOutlineHeart,
  HiOutlineStar,
  HiCheckBadge,
  HiOutlineClock,
} from "react-icons/hi2";
import "@/styles/hero.css";

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

const fade = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, delay },
});

function naira(n) {
  if (!n && n !== 0) return "—";
  return "₦" + Number(n).toLocaleString("en-NG");
}

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
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Location chip — sits outside the link so it doesn't get styled as one */}
      {(school || location) && (
        <div className="hero__card-chip">
          <HiOutlineMapPin />
          <div>
            <span className="hero__card-chip-title">
              {school ? `Near ${school} Gate` : location}
            </span>
            {distanceToGate && (
              <span className="hero__card-chip-sub">
                <HiOutlineClock /> {distanceToGate}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Clickable area — everything except the heart button navigates to the listing */}
      <Link href={`/listings/${listing.id}`} className="hero__card-link">

        {/* Image */}
        <div className="hero__card-image-wrap">
          {image ? (
            <img src={image} alt={title} className="hero__card-image" />
          ) : (
            <div className="hero__card-image-empty">
              <HiOutlineMapPin />
            </div>
          )}

          {/* Heart — stopPropagation so it doesn't trigger the Link */}
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
            <div className="hero__card-available">
              <span className="hero__card-available-dot" />
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
              <span className={cautionFee === 0 ? "hero__card-fee-zero" : ""}>{naira(cautionFee)}</span>
            </div>
            <div className="hero__card-fee-row">
              <span>Agency fee</span>
              <span className={agencyFee === 0 ? "hero__card-fee-zero" : ""}>{naira(agencyFee)}</span>
            </div>
            <div className="hero__card-fee-row">
              <span>Legal fee</span>
              <span className={legalFee === 0 ? "hero__card-fee-zero" : ""}>{naira(legalFee)}</span>
            </div>
            <div className="hero__card-fee-row hero__card-fee-row--total">
              <span>Move-in total</span>
              <span>{naira(moveInTotal)}</span>
            </div>
          </div>

          {verified && (
            <div className="hero__card-verified">
              <HiCheckBadge />
              Verified property
            </div>
          )}
        </div>

        {/* No hidden fees */}
        <div className="hero__card-nohidden">
          <HiCheckBadge />
          <div>
            <strong>No hidden fees</strong>
            <span>What you see is what you pay</span>
          </div>
        </div>

      </Link>

      {/* Premium ribbon — outside link so hover styles stay clean */}
      <div className="hero__card-premium">
        <HiOutlineStar />
        Featured
      </div>
    </motion.div>
  );
}

// ── Hero ──────────────────────────────────────────────────
export default function Hero() {
  const { user, userRole } = useAuth();
  const [featuredListings, setFeaturedListings] = useState([]);
  const [activeIndex, setActiveIndex]           = useState(0);
  const [status, setStatus]                     = useState("loading"); // loading | ok | empty | error

  useEffect(() => {
    async function fetchFeatured() {
      setStatus("loading");
      try {
        // ── Query: featured listings, ordered by most recent featuredAt ──
        // Firestore index needed: featured ASC + featuredExpiry ASC
        // Create at: Firebase Console → Firestore → Indexes → Add
        // Collection: listings  |  featured: Ascending  |  featuredExpiry: Ascending
        const now = new Date();
        const q = query(
          collection(db, "listings"),
          where("featured", "==", true),
          where("featuredExpiry", ">", now),  // only show non-expired featured slots
          orderBy("featuredExpiry", "asc"),
          limit(6)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          // Fallback: show any 3 verified listings as placeholder preview
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
      } catch (err) {
        console.error("[Hero] Featured listings fetch failed:", err.code, err.message);
        // Graceful fallback — try reading without the expiry filter
        // (happens when Firestore index isn't created yet)
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
        } catch (err2) {
          console.error("[Hero] Fallback fetch also failed:", err2.message);
          setStatus("error");
        }
      }
    }
    fetchFeatured();
  }, []);

  // Auto-rotate every 4 s
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

      <div className="hero__atmosphere">
        <div className="hero__orb hero__orb--amber" />
        <div className="hero__orb hero__orb--blue" />
        <div className="hero__noise" />
      </div>

      <div className="hero__inner">

        {/* ── Left ── */}
        <div className="hero__left">
          <motion.div className="hero__location-tag" {...fade(0.1)}>
            <HiOutlineMapPin />
            <span>Port Harcourt, Nigeria</span>
          </motion.div>

          <motion.h1 className="hero__headline" {...rise(0.15)}>
            Your next
            <br />
            <em className="hero__headline-em">student home</em>
            <br />
            starts here.
          </motion.h1>

          <motion.p className="hero__body" {...rise(0.28)}>
            Verified rooms near RSU, UniPort, IAUE and more.
            See full costs upfront, contact landlords directly —
            no agents, no nonsense.
          </motion.p>

          <motion.div className="hero__actions" {...rise(0.38)}>
            <Link href="/listings" className="hero__btn hero__btn--primary">
              Browse Rooms <HiOutlineArrowRight />
            </Link>
            {!user && (
              <Link href="/signup" className="hero__btn hero__btn--ghost">Join Free</Link>
            )}
            {userRole === "student" && (
              <Link href="/roommates" className="hero__btn hero__btn--ghost">Find Roommate</Link>
            )}
            {userRole === "landlord" && (
              <Link href="/add-listing" className="hero__btn hero__btn--ghost">List Property</Link>
            )}
          </motion.div>

          <motion.div className="hero__trust" {...fade(0.55)}>
            <div className="hero__trust-item"><HiOutlineShieldCheck /><span>Verified listings</span></div>
            <span className="hero__trust-sep">·</span>
            <div className="hero__trust-item"><HiOutlineBanknotes /><span>Moderate agent fees</span></div>
            <span className="hero__trust-sep">·</span>
            <div className="hero__trust-item"><HiOutlineUserGroup /><span>Split rent board</span></div>
          </motion.div>
        </div>

        {/* ── Right ── */}
        <motion.div className="hero__right" {...fade(0.45)}>
          <AnimatePresence mode="wait">
            {status === "loading" ? (
              <motion.div
                key="skeleton"
                className="hero__card hero__card--skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="hero__card-image-wrap hero__card-image-wrap--skeleton" />
                <div className="hero__card-body">
                  <div className="hero__skeleton-line hero__skeleton-line--short" />
                  <div className="hero__skeleton-line" />
                  <div className="hero__skeleton-line hero__skeleton-line--med" />
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

          <motion.div className="hero__feature-cta" {...fade(0.9)}>
            <HiOutlineStar />
            <span>
              {status === "ok" ? "Also want your listing here?" : "Be the first featured listing!"}{" "}
              <Link href="/landlord/feature">Get featured →</Link>
            </span>
          </motion.div>
        </motion.div>

      </div>

      <motion.div className="hero__scroll" {...fade(1.1)}>
        <div className="hero__scroll-line" />
        <span>Scroll to explore</span>
      </motion.div>

    </section>
  );
}