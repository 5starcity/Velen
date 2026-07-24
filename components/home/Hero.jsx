"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { parseSearchQuery } from "@/lib/searchParser";
import { HiOutlineArrowRight, HiOutlineCheckBadge } from "react-icons/hi2";
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

export default function Hero() {
  const { user, userRole } = useAuth();
  const [category, setCategory] = useState("rent");
  const [query_, setQuery_] = useState("");

  const handleSearchSubmit = () => {
    const q = query_.trim();
    const params = new URLSearchParams();
    if (category !== "rent") params.set("category", category);

    if (!q) {
      window.location.href = `/listings${params.toString() ? `?${params}` : ""}`;
      return;
    }

    const { type, beds, text } = parseSearchQuery(q);
    if (type) params.set("type", type);
    if (beds) params.set("beds", String(beds));
    if (text) params.set("q", text);
    if (!type && !beds && !text) params.set("q", q);

    window.location.href = `/listings?${params.toString()}`;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearchSubmit();
  };

  return (
    <section className="hero">
      <div className="hero__backdrop" aria-hidden="true" />
      <div className="hero__grain" aria-hidden="true" />

      <div className="hero__inner">
        <motion.h1 className="hero__headline" {...rise(0.12)}>
          Find Student Housing Near Your Campus
        </motion.h1>

        <motion.div className="hero__search-card" {...rise(0.3)}>
          <div className="hero__search-row">
            <input
              className="hero__search-input"
              type="text"
              placeholder="Self contain in Rumuokoro, 1 bedroom near RSU..."
              value={query_}
              onChange={(e) => setQuery_(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="hero__search-btn" onClick={handleSearchSubmit}>
              Search
              <HiOutlineArrowRight aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}