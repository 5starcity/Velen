"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchListings } from "@/lib/firestoreListings";
import ListingCard from "@/components/listings/ListingCard";
import { HiOutlineArrowRight, HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
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
  const [email, setEmail]       = useState("");
  const [notifyStatus, setNotifyStatus] = useState("idle"); // idle | loading | success | error
  const { user } = useAuth();

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

  async function handleNotifyMe(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setNotifyStatus("loading");
    try {
      const res = await fetch("/api/notify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Request failed");
      setNotifyStatus("success");
      setEmail("");
    } catch (err) {
      console.error("Notify signup failed:", err);
      setNotifyStatus("error");
    }
  }

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
          <motion.div
            className="featured__empty"
            variants={inView}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <div className="featured__empty-ghosts" aria-hidden="true">
              <div className="featured__empty-ghost" />
              <div className="featured__empty-ghost" />
              <div className="featured__empty-ghost" />
            </div>

            <div className="featured__empty-icon">
              <HiOutlineBuildingOffice2 aria-hidden="true" />
            </div>

            <h3 className="featured__empty-title">New listings are on the way</h3>
            <p className="featured__empty-subtitle">
              We're onboarding verified landlords across RSU, UniPort, IAUE and KSU.
              Leave your email and we'll notify you the moment a room goes live.
            </p>

            {notifyStatus === "success" ? (
              <div className="featured__empty-success">
                You're on the list — we'll email you when listings go live.
              </div>
            ) : (
              <form className="featured__empty-form" onSubmit={handleNotifyMe}>
                <input
                  type="email"
                  required
                  placeholder="name@school.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="featured__empty-input"
                  disabled={notifyStatus === "loading"}
                />
                <button
                  type="submit"
                  className="featured__empty-btn"
                  disabled={notifyStatus === "loading"}
                >
                  {notifyStatus === "loading" ? "Submitting..." : "Notify me"}
                </button>
              </form>
            )}

            {notifyStatus === "error" && (
              <p className="featured__empty-error">Something went wrong. Please try again.</p>
            )}

            {!user && (
              <p className="featured__empty-login">
                or <Link href="/login">log in</Link> to browse as they land
              </p>
            )}
          </motion.div>
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