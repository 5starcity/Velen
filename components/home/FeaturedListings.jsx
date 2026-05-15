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
  HiOutlineClipboardDocumentCheck,
  HiOutlineExclamationTriangle,
  HiOutlineArrowRight,
  HiOutlineMapPin,
  HiOutlineAcademicCap,
  HiOutlineBolt,
} from "react-icons/hi2";
import "@/styles/featured.css";

const FEATURES = [
  {
    icon:   <HiOutlineShieldCheck />,
    title:  "Verified listings",
    desc:   "Every property is checked before it goes live. No ghost apartments, no upfront scams.",
    color:  "blue",
    number: "01",
  },
  {
    icon:   <HiOutlineBanknotes />,
    title:  "Full cost upfront",
    desc:   "Rent, caution fee, legal fee — all visible before you call a single landlord.",
    color:  "amber",
    number: "02",
  },
  {
    icon:   <HiOutlineUserGroup />,
    title:  "Split rent",
    desc:   "Can't cover it alone? Post on the roommate board and split the cost with someone.",
    color:  "purple",
    number: "03",
  },
  {
    icon:   <HiOutlineMapPin />,
    title:  "Near your campus",
    desc:   "Filter by school — RSU, UniPort, IAUE and more. Find housing close to where you actually study.",
    color:  "teal",
    number: "04",
  },
  {
    icon:   <HiOutlineChatBubbleLeftRight />,
    title:  "Direct contact",
    desc:   "WhatsApp landlords directly. No agents taking cuts, no middlemen delaying responses.",
    color:  "green",
    number: "05",
  },
  {
    icon:   <HiOutlineExclamationTriangle />,
    title:  "Scam protection",
    desc:   "Suspicious prices get flagged. Report bad listings and keep the platform clean for everyone.",
    color:  "red",
    number: "06",
  },
];

const inView = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09 } },
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
      } catch (error) {
        setListings([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>

      {/* ══════════════════════════════════════
          WHY VELEN — Features section
      ══════════════════════════════════════ */}
      <section className="why">
        <div className="why__inner">

          <motion.div
            className="why__header"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <span className="why__eyebrow">Why students choose Velen</span>
            <h2 className="why__heading">
              Housing search,
              <br />
              <em>the way it should be.</em>
            </h2>
            <p className="why__sub">
              Built specifically for students in Port Harcourt —
              not a generic listing site with a student filter.
            </p>
          </motion.div>

          <motion.div
            className="why__grid"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                className={"why__card why__card--" + f.color}
                variants={inView}
              >
                <div className="why__card-top">
                  <div className={"why__card-icon why__card-icon--" + f.color}>
                    {f.icon}
                  </div>
                  <span className="why__card-number">{f.number}</span>
                </div>
                <h3 className="why__card-title">{f.title}</h3>
                <p className="why__card-desc">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURED LISTINGS
      ══════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════
          ROOMMATE CTA
      ══════════════════════════════════════ */}
      <section className="split-cta">
        <div className="split-cta__inner">

          <motion.div
            className="split-cta__content"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="split-cta__label">
              <HiOutlineBolt />
              <span>For students</span>
            </div>
            <h2 className="split-cta__heading">
              Can't afford it alone?
              <br />
              <em>Split it.</em>
            </h2>
            <p className="split-cta__body">
              Post on the roommate board, find someone in the same situation,
              and share the rent. Half the cost, double the company.
            </p>
            <div className="split-cta__actions">
              <Link href="/roommates" className="split-cta__btn split-cta__btn--primary">
                Find a Roommate <HiOutlineArrowRight />
              </Link>
              <Link href="/listings" className="split-cta__btn split-cta__btn--ghost">
                Browse Listings
              </Link>
            </div>
          </motion.div>

          {/* Decorative right side */}
          <motion.div
            className="split-cta__visual"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="split-cta__room split-cta__room--a">
              <div className="split-cta__room-avatar">A</div>
              <div>
                <p>Adaeze O.</p>
                <span>300L · UNIPORT</span>
              </div>
              <div className="split-cta__room-cost">₦90k<em>/yr</em></div>
            </div>

            <div className="split-cta__plus">+</div>

            <div className="split-cta__room split-cta__room--b">
              <div className="split-cta__room-avatar">C</div>
              <div>
                <p>Chukwuma B.</p>
                <span>200L · RSU</span>
              </div>
              <div className="split-cta__room-cost">₦90k<em>/yr</em></div>
            </div>

            <div className="split-cta__result">
              <HiOutlineShieldCheck />
              <span>One verified flat · ₦180k/yr total</span>
            </div>
          </motion.div>

        </div>
      </section>

    </>
  );
}