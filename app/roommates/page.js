// app/roommates/page.js
"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineUserGroup,
  HiOutlineMapPin,
  HiOutlineHomeModern,
  HiOutlineBanknotes,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBolt,
  HiOutlineCheck,
  HiOutlineCalendarDays,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineXMark,
  HiOutlinePlus,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  fetchRoommatePosts,
  expressRoommateInterest,
} from "@/lib/firestoreRoommates";
import { LOCATION_FILTER_OPTIONS } from "@/lib/locations";
import "@/styles/roommates.css";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

export default function RoommatesPage() {
  const { user, userRole } = useAuth();

  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [interestSentIds, setInterestSentIds] = useState(new Set());

  // Filters
  const [search, setSearch]         = useState("");
  const [location, setLocation]     = useState("All");
  const [maxSplit, setMaxSplit]      = useState("All");
  const [gender, setGender]         = useState("All");
  const [occupation, setOccupation] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRoommatePosts();
        setPosts(data);
      } catch (e) {
        console.error("Roommate board load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        search === "" ||
        p.listingTitle?.toLowerCase().includes(search.toLowerCase()) ||
        p.listingLocation?.toLowerCase().includes(search.toLowerCase()) ||
        p.posterName?.toLowerCase().includes(search.toLowerCase()) ||
        p.message?.toLowerCase().includes(search.toLowerCase());

      const matchLocation =
        location === "All" || p.listingLocation === location;

      const matchSplit =
        maxSplit === "All" || (p.splitCost || 0) <= Number(maxSplit);

      const matchGender =
        gender === "All" ||
        p.preferences?.gender === gender ||
        p.preferences?.gender === "No preference";

      const matchOccupation =
        occupation === "All" ||
        p.preferences?.occupation === occupation ||
        p.preferences?.occupation === "Any";

      return matchSearch && matchLocation && matchSplit && matchGender && matchOccupation;
    });
  }, [posts, search, location, maxSplit, gender, occupation]);

  const activeFilterCount = [
    search !== "",
    location !== "All",
    maxSplit !== "All",
    gender !== "All",
    occupation !== "All",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setLocation("All");
    setMaxSplit("All");
    setGender("All");
    setOccupation("All");
  }

  async function handleInterest(post) {
    if (!user) { window.location.href = "/login"; return; }
    try {
      await expressRoommateInterest(post.id, user.uid, user.displayName || "Someone");
      setInterestSentIds((prev) => new Set([...prev, post.id]));
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, interests: (p.interests || 0) + 1 } : p));

      const waNum = post.posterContact?.startsWith("0")
        ? "234" + post.posterContact.slice(1)
        : post.posterContact;
      const msg = encodeURIComponent(
        `Hi ${post.posterName}, I saw your roommate post on Velen for "${post.listingTitle}" and I'm interested in splitting the rent. My name is ${user.displayName || "a prospective tenant"}.`
      );
      window.open(`https://wa.me/${waNum}?text=${msg}`, "_blank");
    } catch (e) {
      console.error("Interest error:", e);
    }
  }

  function formatDate(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  const ustAreas = LOCATION_FILTER_OPTIONS.filter((l) => l.value !== "All");

  return (
    <main className="roommates-page">

      {/* ── Header ── */}
      <motion.div
        className="roommates-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div>
          <p className="roommates-page__eyebrow">
            <HiOutlineUserGroup /> Roommate Board
          </p>
          <h1>Find someone to split the rent</h1>
          <p className="roommates-page__sub">
            Browse roommate requests from people who found a listing they love but want to share the cost.
          </p>
        </div>

        <div className="roommates-page__header-actions">
          {/* Only students can post a roommate request */}
          {user && userRole === "student" && (
            <Link href="/roommates/post" className="roommates-page__post-btn">
              <HiOutlinePlus /> Post Request
            </Link>
          )}
          <Link href="/listings" className="roommates-page__browse-btn">
            <HiOutlineHomeModern /> Browse Listings
          </Link>
        </div>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        className="roommates-filters"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Search */}
        <div className="roommates-filters__search-wrap">
          <HiOutlineMagnifyingGlass className="roommates-filters__search-icon" />
          <input
            type="text"
            className="roommates-filters__search"
            placeholder="Search by location, listing, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="roommates-filters__clear-search" onClick={() => setSearch("")}>
              <HiOutlineXMark />
            </button>
          )}
        </div>

        {/* Location */}
        <select
          className="roommates-filters__select"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="All">All Areas</option>
          {ustAreas.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        {/* Max split cost */}
        <select
          className="roommates-filters__select"
          value={maxSplit}
          onChange={(e) => setMaxSplit(e.target.value)}
        >
          <option value="All">Any Split Cost</option>
          <option value="100000">Up to ₦100k/yr</option>
          <option value="150000">Up to ₦150k/yr</option>
          <option value="200000">Up to ₦200k/yr</option>
          <option value="300000">Up to ₦300k/yr</option>
          <option value="500000">Up to ₦500k/yr</option>
        </select>

        {/* Gender pref */}
        <select
          className="roommates-filters__select"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="All">Any Gender Pref</option>
          <option value="Male">Male preferred</option>
          <option value="Female">Female preferred</option>
        </select>

        {/* Occupation */}
        <select
          className="roommates-filters__select"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
        >
          <option value="All">Any Occupation</option>
          <option value="Student">Student</option>
          <option value="Working professional">Working professional</option>
        </select>

        {activeFilterCount > 0 && (
          <button className="roommates-filters__clear-all" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </motion.div>

      {/* ── Results count ── */}
      <div className="roommates-page__results">
        {!loading && (
          <p>
            {filtered.length} post{filtered.length !== 1 ? "s" : ""} found
            {activeFilterCount > 0 && (
              <span className="roommates-page__filter-count">
                · {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
              </span>
            )}
          </p>
        )}
      </div>

      {/* ── Posts grid ── */}
      {loading ? (
        <div className="roommates-page__skeleton-grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="roommates-page__skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="roommates-page__empty">
          <HiOutlineUserGroup className="roommates-page__empty-icon" />
          <h2>No roommate posts yet</h2>
          <p>
            {activeFilterCount > 0
              ? "Try adjusting your filters."
              : "Be the first — find a listing and post a roommate request."}
          </p>
          <div className="roommates-page__empty-actions">
            {user && userRole === "student" && (
              <Link href="/roommates/post" className="roommates-page__post-btn">
                <HiOutlinePlus /> Post a Request
              </Link>
            )}
            <Link href="/listings" className="roommates-page__empty-btn">
              Browse Listings
            </Link>
          </div>
        </div>
      ) : (
        <motion.div
          className="roommates-page__grid"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {filtered.map((post) => {
              const isOwn       = post.postedBy === user?.uid;
              const sentAlready = interestSentIds.has(post.id);
              const waNum = post.posterContact?.startsWith("0")
                ? "234" + post.posterContact.slice(1)
                : post.posterContact;

              const prefTags = [
                post.preferences?.gender      !== "No preference" && post.preferences?.gender,
                post.preferences?.occupation  !== "Any"           && post.preferences?.occupation,
                post.preferences?.lifestyle   !== "No preference" && post.preferences?.lifestyle,
              ].filter(Boolean);

              return (
                <motion.div
                  key={post.id}
                  className={"roommate-card" + (isOwn ? " roommate-card--own" : "")}
                  variants={fadeUp}
                  layout
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  {/* Card header */}
                  <div className="roommate-card__header">
                    <div className="roommate-card__avatar">
                      {(post.posterName || "?")[0].toUpperCase()}
                    </div>
                    <div className="roommate-card__poster">
                      <p className="roommate-card__poster-name">
                        {post.posterName}
                        {isOwn && <span className="roommate-card__you">Your post</span>}
                      </p>
                      <p className="roommate-card__date">{formatDate(post.createdAt)}</p>
                    </div>
                    <div className="roommate-card__split-badge">
                      <span>Split</span>
                      <strong>₦{(post.splitCost || 0).toLocaleString()}</strong>
                      <em>/yr each</em>
                    </div>
                  </div>

                  {/* Listing info */}
                  <div className="roommate-card__listing">
                    <p className="roommate-card__listing-title">{post.listingTitle}</p>
                    <div className="roommate-card__listing-meta">
                      <span><HiOutlineMapPin />{post.listingLocation}</span>
                      {post.listingType && <span><HiOutlineHomeModern />{post.listingType}</span>}
                      <span><HiOutlineBanknotes />₦{(post.listingPrice || 0).toLocaleString()}/yr total</span>
                    </div>
                  </div>

                  {/* Message */}
                  {post.message && (
                    <p className="roommate-card__message">"{post.message}"</p>
                  )}

                  {/* Pref tags */}
                  {prefTags.length > 0 && (
                    <div className="roommate-card__prefs">
                      {prefTags.map((t) => (
                        <span key={t} className="roommate-card__pref-tag">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Move-in */}
                  {post.preferences?.moveInDate && (
                    <p className="roommate-card__movein">
                      <HiOutlineCalendarDays />
                      Move-in: {post.preferences.moveInDate}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="roommate-card__footer">
                    <div className="roommate-card__footer-left">
                      {post.interests > 0 && (
                        <span className="roommate-card__interests">
                          <HiOutlineBolt />
                          {post.interests} interested
                        </span>
                      )}
                    </div>

                    <div className="roommate-card__footer-actions">
                      {/* View original listing */}
                      <Link
                        href={"/listings/" + post.listingId}
                        className="roommate-card__listing-btn"
                        title="View listing"
                        target="_blank"
                      >
                        <HiOutlineArrowTopRightOnSquare />
                      </Link>

                      {/* Contact / interest */}
                      {!isOwn && user && (
                        <>
                          {sentAlready ? (
                            <span className="roommate-card__sent">
                              <HiOutlineCheck /> Sent
                            </span>
                          ) : (
                            <button
                              className="roommate-card__interest-btn"
                              onClick={() => handleInterest(post)}
                            >
                              <HiOutlineBolt /> I'm Interested
                            </button>
                          )}
                          <a
                            href={`https://wa.me/${waNum}`}
                            target="_blank"
                            rel="noreferrer"
                            className="roommate-card__wa-btn"
                          >
                            <HiOutlineChatBubbleLeftRight />
                          </a>
                        </>
                      )}

                      {!user && (
                        <Link href="/login" className="roommate-card__interest-btn">
                          Log in to contact
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </main>
  );
}