"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchListings } from "@/lib/firestoreListings";
import ListingCard from "@/components/listings/ListingCard";
import { HiOutlineArrowRight, HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import "@/styles/featured.css";

const inView = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FeaturedListings() {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | fetch-error
  const [email, setEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState("idle"); // idle | loading | success | error
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchListings();
        if (!isMounted) return;
        const sorted = [...data].sort((a, b) => Number(b.verified) - Number(a.verified));
        setListings(sorted.slice(0, 6));
        setStatus("ready");
      } catch (err) {
        console.error("Failed to load featured listings:", err);
        if (!isMounted) return;
        setStatus("fetch-error");
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNotifyMe = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) {
        setNotifyStatus("error");
        return;
      }

      setNotifyStatus("loading");
      try {
        const res = await fetch("/api/notify-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed }),
        });

        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        setNotifyStatus("success");
        setEmail("");
      } catch (err) {
        console.error("Notify signup failed:", err);
        setNotifyStatus("error");
      }
    },
    [email]
  );

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
           
            <h2 className="featured__heading">Featured listings</h2>
          </div>
          <Link href="/listings" className="featured__see-all">
            See all listings <HiOutlineArrowRight aria-hidden="true" />
          </Link>
        </motion.div>

        {status === "loading" && (
          <div className="featured__skeleton-grid" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <div key={n} className="featured__skeleton" />
            ))}
          </div>
        )}

        {status === "fetch-error" && (
          <div className="featured__empty" role="alert">
            <div className="featured__empty-icon">
              <HiOutlineBuildingOffice2 aria-hidden="true" />
            </div>
            <h3 className="featured__empty-title">Couldn't load listings</h3>
            <p className="featured__empty-subtitle">
              Something went wrong on our end. Please refresh the page or try again shortly.
            </p>
            <Link href="/listings" className="featured__empty-btn">
              Go to listings
            </Link>
          </div>
        )}

        {status === "ready" && listings.length === 0 && (
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
            </div>

            <div className="featured__empty-icon">
              <HiOutlineBuildingOffice2 aria-hidden="true" />
            </div>

            <h3 className="featured__empty-title">New listings are on the way</h3>
            <p className="featured__empty-subtitle">
              We're onboarding verified landlords and agents across Port Harcourt.
              Leave your email and we'll notify you the moment a room goes live.
            </p>

            {notifyStatus === "success" ? (
              <div className="featured__empty-success" role="status" aria-live="polite">
                You're on the list — we'll email you when listings go live.
              </div>
            ) : (
              <form className="featured__empty-form" onSubmit={handleNotifyMe} noValidate>
                <label htmlFor="notify-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="notify-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (notifyStatus === "error") setNotifyStatus("idle");
                  }}
                  className="featured__empty-input"
                  disabled={notifyStatus === "loading"}
                  aria-invalid={notifyStatus === "error"}
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
              <p className="featured__empty-error" role="alert">
                {EMAIL_RE.test(email.trim())
                  ? "Something went wrong. Please try again."
                  : "Enter a valid email address."}
              </p>
            )}

            {!user && (
              <p className="featured__empty-login">
                or <Link href="/login">log in</Link> to browse as they land
              </p>
            )}
          </motion.div>
        )}

        {status === "ready" && listings.length > 0 && (
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
                See more <HiOutlineArrowRight aria-hidden="true" />
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}