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

const FEATURES = [
  {
    icon: <HiOutlineShieldCheck />,
    title: "Verified listings",
    desc: "Every property is checked before it goes live. No ghost apartments, no upfront scams.",
  },
  {
    icon: <HiOutlineBanknotes />,
    title: "Full cost upfront",
    desc: "Rent, caution fee, legal fee — all visible before you call a single landlord.",
  },
  {
    icon: <HiOutlineUserGroup />,
    title: "Split rent board",
    desc: "Can't cover it alone? Find a roommate and split the cost.",
  },
  {
    icon: <HiOutlineMapPin />,
    title: "Near your campus",
    desc: "Filter by school — RSU, UniPort, IAUE and more.",
  },
  {
    icon: <HiOutlineChatBubbleLeftRight />,
    title: "Direct contact",
    desc: "WhatsApp landlords directly. No middlemen, no agent delays.",
  },
  {
    icon: <HiOutlineExclamationTriangle />,
    title: "Scam protection",
    desc: "Suspicious prices get flagged. Report bad listings instantly.",
  },
];

const inView = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function FeaturedListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

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

      {/* ══ WHY rezidence ══ */}
      <section className="why">
        <div className="why__inner">

          <motion.div
            className="why__header"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <span className="why__eyebrow">Why students choose rezidence</span>
            <h2 className="why__heading">
              Housing search,{" "}
              <em>the way it should be.</em>
            </h2>
          </motion.div>

          <motion.div
            className="why__list"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
          >
            {FEATURES.map((f) => (
              <motion.div key={f.title} className="why__item" variants={inView}>
                <div className="why__item-icon">{f.icon}</div>
                <div className="why__item-body">
                  <h3 className="why__item-title">{f.title}</h3>
                  <p className="why__item-desc">{f.desc}</p>
                </div>
              </motion.div>
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
              {[1, 2, 3].map((n) => <div key={n} className="featured__skeleton" />)}
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