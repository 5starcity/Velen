"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchListings } from "@/lib/firestoreListings";
import ListingCard from "@/components/listings/ListingCard";
import { HiOutlineArrowRight } from "react-icons/hi2";
import "@/styles/featured.css";

const inView = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
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
              <span className="featured__eyebrow-dot" aria-hidden="true" />
              Available now
            </span>
            <h2 className="featured__heading">Featured listings</h2>
            <p className="featured__sub">
              Verified properties with transparent pricing and direct contact to owners.
            </p>
          </div>
          <Link href="/listings" className="featured__see-all">
            See all listings <HiOutlineArrowRight aria-hidden="true" />
          </Link>
        </motion.div>

        {loading ? (
          <div className="featured__skeleton-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="featured__skeleton" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="featured__empty">
            <p>No listings available yet.</p>
            <Link href="/listings" className="featured__empty-btn">Browse all listings</Link>
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
                See all available rooms <HiOutlineArrowRight aria-hidden="true" />
              </Link>
            </motion.div>
          </>
        )}

      </div>
    </section>
  );
}