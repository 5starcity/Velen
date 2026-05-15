// components/home/Hero.jsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
  HiOutlineUserGroup,
  HiOutlineArrowRight,
  HiOutlineMapPin,
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

export default function Hero() {
  const { user, userRole } = useAuth();

  return (
    <section className="hero">

      {/* Atmospheric background */}
      <div className="hero__atmosphere">
        <div className="hero__orb hero__orb--amber" />
        <div className="hero__orb hero__orb--blue" />
        <div className="hero__noise" />
      </div>

      <div className="hero__inner">

        {/* Left column — content */}
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
              Browse Rooms
              <HiOutlineArrowRight />
            </Link>
            {!user && (
              <Link href="/signup" className="hero__btn hero__btn--ghost">
                Join Free
              </Link>
            )}
            {userRole === "student" && (
              <Link href="/roommates" className="hero__btn hero__btn--ghost">
                Find Roommate
              </Link>
            )}
            {userRole === "landlord" && (
              <Link href="/add-listing" className="hero__btn hero__btn--ghost">
                List Property
              </Link>
            )}
          </motion.div>

          <motion.div className="hero__trust" {...fade(0.55)}>
            <div className="hero__trust-item">
              <HiOutlineShieldCheck />
              <span>Verified listings</span>
            </div>
            <span className="hero__trust-sep">·</span>
            <div className="hero__trust-item">
              <HiOutlineBanknotes />
              <span>Zero agent fees</span>
            </div>
            <span className="hero__trust-sep">·</span>
            <div className="hero__trust-item">
              <HiOutlineUserGroup />
              <span>Split rent board</span>
            </div>
          </motion.div>

        </div>

        {/* Right column — visual card stack */}
        <motion.div
          className="hero__right"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero__card-stack">

            {/* Background decorative card */}
            <div className="hero__card hero__card--back" />

            {/* Main feature card */}
            <div className="hero__card hero__card--main">
              <div className="hero__card-tag">
                <span className="hero__card-dot" />
                Available Now
              </div>
              <p className="hero__card-title">Self Contain · Choba</p>
              <p className="hero__card-price">₦180,000 <span>/yr</span></p>
              <div className="hero__card-divider" />
              <div className="hero__card-row">
                <span>Caution fee</span>
                <span>₦0</span>
              </div>
              <div className="hero__card-row">
                <span>Agency fee</span>
                <span>₦0</span>
              </div>
              <div className="hero__card-row hero__card-row--total">
                <span>Move-in total</span>
                <strong>₦180,000</strong>
              </div>
              <div className="hero__card-verified">
                <HiOutlineShieldCheck />
                <span>Verified property</span>
              </div>
            </div>

            {/* Floating stat chips */}
            <motion.div
              className="hero__chip hero__chip--tl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="hero__chip-icon">🏠</span>
              <div>
                <p>Near RSU Gate</p>
                <span>5 min walk</span>
              </div>
            </motion.div>

            <motion.div
              className="hero__chip hero__chip--br"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.85, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="hero__chip-icon">✅</span>
              <div>
                <p>No hidden fees</p>
                <span>What you see is what you pay</span>
              </div>
            </motion.div>

          </div>
        </motion.div>

      </div>

      {/* Bottom scroll hint */}
      <motion.div className="hero__scroll" {...fade(1.1)}>
        <div className="hero__scroll-line" />
        <span>Scroll to explore</span>
      </motion.div>

    </section>
  );
}