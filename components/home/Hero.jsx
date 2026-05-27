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
              <span>Moderate agent fees</span>
            </div>
            <span className="hero__trust-sep">·</span>
            <div className="hero__trust-item">
              <HiOutlineUserGroup />
              <span>Split rent board</span>
            </div>
          </motion.div>

        </div>

      </div>

      {/* Bottom scroll hint */}
      <motion.div className="hero__scroll" {...fade(1.1)}>
        <div className="hero__scroll-line" />
        <span>Scroll to explore</span>
      </motion.div>

    </section>
  );
}