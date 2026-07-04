"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { parseSearchQuery } from "@/lib/searchParser";
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
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
});

const fade = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, delay },
});

const QUICK_CHIPS = [
  { label: "Near RSU",     href: "/listings?school=RSU" },
  { label: "Near UniPort", href: "/listings?school=UniPort" },
  { label: "Self-con",     href: "/listings?type=self-con" },
  { label: "Under ₦80k",  href: "/listings?maxPrice=80000" },
  { label: "Ensuite",      href: "/listings?type=ensuite" },
];

export default function Hero() {
  const { user, userRole } = useAuth();
  const [query_, setQuery_] = useState("");

  const handleSearchSubmit = () => {
    const q = query_.trim();
    if (!q) {
      window.location.href = "/listings";
      return;
    }
    const { type, beds, text } = parseSearchQuery(q);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (beds) params.set("beds", String(beds));
    if (text) params.set("q", text);
    if (!type && !beds && !text) params.set("q", q); // nothing parsed, fall back to raw text
    window.location.href = `/listings?${params.toString()}`;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearchSubmit();
  };

  return (
    <section className="hero">
      <div className="hero__inner">

        {/* Eyebrow */}
        <motion.div className="hero__eyebrow" {...fade(0.05)}>
          <HiOutlineMapPin aria-hidden="true" />
          <span>Port Harcourt, Nigeria</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 className="hero__headline" {...rise(0.12)}>
          Find student housing
          <em> near your campus</em>
        </motion.h1>

        {/* Sub */}
        <motion.p className="hero__sub" {...rise(0.20)}>
          Verified rooms across PH universities — no agent fees, full costs shown upfront.
        </motion.p>

        {/* Search bar */}
        <motion.div className="hero__search" {...rise(0.28)}>
          <HiMagnifyingGlass className="hero__search-icon" aria-hidden="true" />
          <input
            className="hero__search-input"
            type="text"
            placeholder="Search by location, school or room type…"
            value={query_}
            onChange={(e) => setQuery_(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="hero__search-btn" onClick={handleSearchSubmit}>
            Search
          </button>
        </motion.div>

        {/* Quick chips */}
        <motion.div className="hero__chips" {...fade(0.38)}>
          {QUICK_CHIPS.map((c) => (
            <Link key={c.label} href={c.href} className="hero__chip">
              {c.label}
            </Link>
          ))}
        </motion.div>

        {/* Auth CTAs */}
        <motion.div className="hero__actions" {...fade(0.46)}>
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
    </section>
  );
}