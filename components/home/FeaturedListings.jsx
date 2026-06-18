// components/home/FeaturedListings.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchListings } from "@/lib/firestoreListings";
import ListingCard from "@/components/listings/ListingCard";
import {
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUserGroup,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlineMapPin,
  HiOutlineBolt,
} from "react-icons/hi2";
import "@/styles/featured.css";

// Compact chip data — just label + icon, no long descriptions
const FEATURES = [
  { icon: <HiOutlineShieldCheck />, label: "Verified listings"        },
  { icon: <HiOutlineBanknotes />,   label: "Full cost upfront"        },
  { icon: <HiOutlineUserGroup />,   label: "Split rent board"         },
  { icon: <HiOutlineMapPin />,      label: "Near your campus"         },
  { icon: <HiOutlineChatBubbleLeftRight />, label: "Direct contact"   },
  { icon: <HiOutlineExclamationTriangle />, label: "Scam protection"  },
];

const inView = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

export default function FeaturedListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchListings();
        const sorted = data.sort((a, b) => {
          if (a.verified && !b.verified) return -1;
          if (!a.verified && b.verified) return 1;
          return 0;
        });
        setListings(sorted.slice(0, 6));
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>

      {/* ══ WHY REZIDENCE — compact chip bar ══ */}
      <section className="why">
        <div className="why__inner">

          {/* Left: compact label */}
          <motion.div
            className="why__label"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <span className="why__eyebrow">Why us</span>
            <h2 className="why__heading">
              Housing search,{" "}
              <em>done right.</em>
            </h2>
          </motion.div>

          <div className="why__divider" />

          {/* Right: chips */}
          <motion.div
            className="why__chips"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {FEATURES.map((f) => (
              <motion.span key={f.label} className="why__chip" variants={inView}>
                {f.icon}
                {f.label}
              </motion.span>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ══ FEATURED LISTINGS ══ */}
      <section className="featured">
        <div className="featured__inner">

          <motion.div
            className="featured__header"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="featured__header-left">
              <span className="featured__eyebrow">
                <span className="featured__eyebrow-dot" />
                Available Now
              </span>
              <h2>Rooms near your campus</h2>
              <p>
                Verified properties with transparent pricing,
                real photos and direct contact to owners.
              </p>
            </div>
            <Link href="/listings" className="featured__header-link">
              View all listings <HiOutlineArrowRight />
            </Link>
          </motion.div>

          {loading ? (
            <div className="featured__skeleton-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="featured__skeleton" />)}
            </div>
          ) : listings.length === 0 ? (
            <div className="featured__empty">
              <p>No listings available yet.</p>
              <Link href="/listings" className="featured__empty-btn">Browse Listings</Link>
            </div>
          ) : (
            <>
              <motion.div
                className="featured__grid"
                variants={stagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
              >
                {listings.map((listing) => (
                  <motion.div key={listing.id} variants={inView}>
                    <ListingCard listing={listing} />
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="featured__footer"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Link href="/listings" className="featured__view-all">
                  See all available rooms <HiOutlineArrowRight />
                </Link>
              </motion.div>
            </>
          )}

        </div>
      </section>

      {/* ══ ROOMMATE CTA ══ */}
      <section className="split-cta">
        <div className="split-cta__inner">

          <motion.div
            className="split-cta__label"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <HiOutlineBolt />
            <span>For students</span>
          </motion.div>

          <motion.h2
            className="split-cta__heading"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
          >
            Can't afford it alone?{" "}
            <em>Split it.</em>
          </motion.h2>

          <motion.p
            className="split-cta__body"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
          >
            Post on the roommate board, find someone in the same situation,
            and share the rent. Half the cost, double the company.
          </motion.p>

          <motion.div
            className="split-cta__actions"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.24, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/roommates" className="split-cta__btn split-cta__btn--primary">
              Find a Roommate <HiOutlineArrowRight />
            </Link>
            <Link href="/listings" className="split-cta__btn split-cta__btn--ghost">
              Browse Listings
            </Link>
          </motion.div>

        </div>
      </section>

    </>
  );
}