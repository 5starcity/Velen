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
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlinePencilSquare,
  HiOutlineAcademicCap,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  fetchRoommatePosts,
  fetchRoommatePostsByUser,
  expressRoommateInterest,
  deleteRoommatePost,
  markRoommatePostFilled,
  updateRoommatePost,
} from "@/lib/firestoreRoommates";
import { createNotification } from "@/lib/firestoreNotifications";
import { LOCATION_FILTER_OPTIONS, UNIVERSITIES } from "@/lib/locations";
import "@/styles/roommates.css";

const LIFESTYLE_TAGS = [
  "Early riser",
  "Night owl",
  "Non-smoker",
  "Quiet/studious",
  "Social",
  "Neat/tidy",
  "Religious",
  "Pet-friendly",
  "Cooking at home",
  "Works from home",
];

const LEVEL_OPTIONS = ["100L", "200L", "300L", "400L", "500L", "PG", "Other"];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

// Deterministic avatar color from uid
const AVATAR_COLORS = [
  { bg: "#e8f5e9", color: "#2d5a28" },
  { bg: "#e3f2fd", color: "#1565c0" },
  { bg: "#fce4ec", color: "#880e4f" },
  { bg: "#fff3e0", color: "#e65100" },
  { bg: "#f3e5f5", color: "#6a1b9a" },
  { bg: "#e0f7fa", color: "#006064" },
];
function avatarColor(uid = "") {
  const idx = uid.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function RoommatesPage() {
  const { user, userRole } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track which post IDs have had interest expressed (for UI state)
  const [interestSentIds, setInterestSentIds] = useState(new Set());
  // Track which post IDs have contact revealed (after interest click)
  const [contactRevealedIds, setContactRevealedIds] = useState(new Set());

  const [myPosts, setMyPosts] = useState([]);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [fillingId, setFillingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Inline edit state
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editGender, setEditGender] = useState("No preference");
  const [editOccupation, setEditOccupation] = useState("Any");
  const [editLifestyleTags, setEditLifestyleTags] = useState([]);
  const [editMoveIn, setEditMoveIn] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [maxSplit, setMaxSplit] = useState("All");
  const [gender, setGender] = useState("All");
  const [postTypeFilter, setPostTypeFilter] = useState("All");

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

  useEffect(() => {
    if (!user || userRole !== "student") return;
    async function loadMine() {
      setMyPostsLoading(true);
      try {
        const data = await fetchRoommatePostsByUser(user.uid);
        setMyPosts(data);
      } catch (e) {
        console.error("My posts load error:", e);
      } finally {
        setMyPostsLoading(false);
      }
    }
    loadMine();
  }, [user, userRole]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function startEdit(post) {
    setEditingId(post.id);
    setEditMessage(post.message || "");
    setEditContact(post.posterContact || "");
    setEditGender(post.preferences?.gender || "No preference");
    setEditOccupation(post.preferences?.occupation || "Any");
    setEditLifestyleTags(post.preferences?.lifestyleTags || []);
    setEditMoveIn(post.preferences?.moveInDate || "");
    setEditLevel(post.level || "");
  }

  function cancelEdit() { setEditingId(null); }

  function toggleEditTag(tag) {
    setEditLifestyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSaveEdit(postId) {
    setSavingEdit(true);
    try {
      const updates = {
        message: editMessage,
        posterContact: editContact,
        level: editLevel,
        preferences: {
          gender: editGender,
          occupation: editOccupation,
          lifestyleTags: editLifestyleTags,
          moveInDate: editMoveIn,
        },
      };
      await updateRoommatePost(postId, updates);
      const updater = (p) => p.id !== postId ? p : { ...p, ...updates };
      setMyPosts((prev) => prev.map(updater));
      setPosts((prev) => prev.map(updater));
      setEditingId(null);
      showToast("Post updated.");
    } catch (e) {
      console.error(e);
      showToast("Failed to save changes.", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(postId) {
    if (!window.confirm("Delete this roommate post? This cannot be undone.")) return;
    setDeletingId(postId);
    try {
      await deleteRoommatePost(postId);
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast("Post deleted.");
    } catch (e) {
      showToast("Failed to delete post.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMarkFilled(postId) {
    setFillingId(postId);
    try {
      await markRoommatePostFilled(postId);
      setMyPosts((prev) => prev.map((p) => p.id === postId ? { ...p, status: "filled" } : p));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      showToast("Marked as filled — removed from the board.");
    } catch (e) {
      showToast("Failed to update post.", "error");
    } finally {
      setFillingId(null);
    }
  }

  // Phase 1 fix: interest reveals contact, doesn't auto-open WhatsApp
  async function handleInterest(post) {
    if (!user) { window.location.href = "/login"; return; }
    if (interestSentIds.has(post.id)) {
      // Already expressed — just reveal contact if not already
      setContactRevealedIds((prev) => new Set([...prev, post.id]));
      return;
    }
    try {
      await expressRoommateInterest(post.id, user.uid, user.displayName || "Someone");
      setInterestSentIds((prev) => new Set([...prev, post.id]));
      setContactRevealedIds((prev) => new Set([...prev, post.id]));
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, interests: (p.interests || 0) + 1 } : p));
      try {
        await createNotification({
          userId: post.postedBy,
          type: "roommate_interest",
          title: "New interest on your post",
          message: `${user.displayName || "Someone"} is interested in your roommate post${post.listingTitle ? ` for "${post.listingTitle}"` : ""}`,
          postId: post.id,
          senderId: user.uid,
          senderName: user.displayName || "Someone",
        });
      } catch (e) { console.warn("Notification failed silently:", e); }
    } catch (e) {
      console.error("Interest error:", e);
    }
  }

  function buildWaUrl(post) {
    const raw = post.posterContact || "";
    const num = raw.startsWith("0") ? "234" + raw.slice(1) : raw;
    const msg = encodeURIComponent(
      `Hi ${post.posterName}, I saw your roommate post on Rezidence${post.listingTitle ? ` for "${post.listingTitle}"` : ""} and I'm interested. My name is ${user?.displayName || "a prospective tenant"}.`
    );
    return `https://wa.me/${num}?text=${msg}`;
  }

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const matchSearch =
        search === "" ||
        p.listingTitle?.toLowerCase().includes(search.toLowerCase()) ||
        p.listingLocation?.toLowerCase().includes(search.toLowerCase()) ||
        p.posterName?.toLowerCase().includes(search.toLowerCase()) ||
        p.message?.toLowerCase().includes(search.toLowerCase()) ||
        p.school?.toLowerCase().includes(search.toLowerCase());
      const matchLocation =
        location === "All" ||
        p.listingLocation === location;
      const matchSplit =
        maxSplit === "All" ||
        (p.postType === "looking"
          ? (p.budgetMax || 0) <= Number(maxSplit)
          : (p.splitCost || 0) <= Number(maxSplit));
      const matchGender =
        gender === "All" ||
        p.preferences?.gender === gender ||
        p.preferences?.gender === "No preference";
      const matchType =
        postTypeFilter === "All" ||
        p.postType === postTypeFilter ||
        (!p.postType && postTypeFilter === "listing");
      return matchSearch && matchLocation && matchSplit && matchGender && matchType;
    });
  }, [posts, search, location, maxSplit, gender, postTypeFilter]);

  const activeFilterCount = [
    search !== "",
    location !== "All",
    maxSplit !== "All",
    gender !== "All",
    postTypeFilter !== "All",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch(""); setLocation("All"); setMaxSplit("All"); setGender("All"); setPostTypeFilter("All");
  }

  function formatDate(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  const ustAreas = LOCATION_FILTER_OPTIONS.filter((l) => l.value !== "All");

  return (
    <main className="roommates-page">

      {toast && (
        <motion.div
          className={"roommates-page__toast" + (toast.type === "error" ? " error" : "")}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {toast.type === "error" ? <HiOutlineExclamationTriangle /> : <HiOutlineCheck />}
          {toast.msg}
        </motion.div>
      )}

      {/* ── Header ── */}
      <motion.div
        className="roommates-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div>
          <p className="roommates-page__eyebrow"><HiOutlineUserGroup /> Roommate Board</p>
          <h1>Find someone to split the rent</h1>
          <p className="roommates-page__sub">
            Browse students looking to share a place or split rent on a listing.
          </p>
        </div>
        <div className="roommates-page__header-actions">
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

      {/* ── My Posts ── */}
      {user && userRole === "student" && (
        <motion.div
          className="roommates-page__my-posts"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <div className="roommates-page__my-posts-header">
            <h2>
              <HiOutlineUserGroup /> My Posts
              {myPosts.length > 0 && (
                <span className="roommates-page__my-posts-count">{myPosts.length}</span>
              )}
            </h2>
            <Link href="/roommates/post" className="roommates-page__my-posts-new">
              <HiOutlinePlus /> New
            </Link>
          </div>

          {myPostsLoading ? (
            <div className="roommates-page__my-posts-skeleton">
              {[1, 2].map((n) => <div key={n} className="roommates-page__my-posts-skel" />)}
            </div>
          ) : myPosts.length === 0 ? (
            <div className="roommates-page__my-posts-empty">
              <p>You haven't posted a roommate request yet.</p>
              <Link href="/roommates/post" className="roommates-page__post-btn">
                <HiOutlinePlus /> Post your first request
              </Link>
            </div>
          ) : (
            <div className="roommates-page__my-posts-list">
              <AnimatePresence>
                {myPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    className={"roommates-page__my-post-row" + (post.status === "filled" ? " filled" : "")}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    {editingId !== post.id ? (
                      <>
                        <div className="roommates-page__my-post-info">
                          <div className="roommates-page__my-post-title">
                            {post.postType === "looking" ? "Looking for a place" : (post.listingTitle || "My post")}
                            <span className={"roommates-page__my-post-status " + (post.status || "open")}>
                              {post.status === "filled" ? "Filled" : "Open"}
                            </span>
                          </div>
                          <div className="roommates-page__my-post-meta">
                            {post.listingLocation && (
                              <span><HiOutlineMapPin />{post.listingLocation}</span>
                            )}
                            {post.postType === "looking" && post.budgetMin && post.budgetMax ? (
                              <span><HiOutlineBanknotes />₦{Number(post.budgetMin).toLocaleString()}–₦{Number(post.budgetMax).toLocaleString()}/yr</span>
                            ) : post.splitCost ? (
                              <span><HiOutlineBanknotes />₦{(post.splitCost || 0).toLocaleString()}/yr each</span>
                            ) : null}
                            {post.interests > 0 && (
                              <span><HiOutlineBolt />{post.interests} interested</span>
                            )}
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                          {post.message && (
                            <p className="roommates-page__my-post-message">"{post.message}"</p>
                          )}
                        </div>
                        <div className="roommates-page__my-post-actions">
                          {post.status !== "filled" && (
                            <>
                              <button
                                className="roommates-page__my-post-edit"
                                onClick={() => startEdit(post)}
                              >
                                <HiOutlinePencilSquare /><span>Edit</span>
                              </button>
                              <button
                                className="roommates-page__my-post-fill"
                                onClick={() => handleMarkFilled(post.id)}
                                disabled={fillingId === post.id}
                              >
                                <HiOutlineCheckCircle />
                                <span>{fillingId === post.id ? "Saving..." : "Mark filled"}</span>
                              </button>
                            </>
                          )}
                          <button
                            className="roommates-page__my-post-delete"
                            onClick={() => handleDelete(post.id)}
                            disabled={deletingId === post.id}
                          >
                            <HiOutlineTrash />
                            <span>{deletingId === post.id ? "Deleting..." : "Delete"}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* ── Inline edit form ── */
                      <motion.div
                        className="roommates-page__inline-edit"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="roommates-page__inline-edit-header">
                          <p>Editing: <strong>{post.postType === "looking" ? "Looking for a place" : post.listingTitle}</strong></p>
                          <button className="roommates-page__inline-edit-cancel" onClick={cancelEdit}>
                            <HiOutlineXMark /> Cancel
                          </button>
                        </div>

                        <div className="roommates-page__inline-edit-grid">
                          <div className="roommates-page__inline-field roommates-page__inline-field--full">
                            <label>Message</label>
                            <textarea
                              value={editMessage}
                              onChange={(e) => setEditMessage(e.target.value)}
                              placeholder="Update your message..."
                              maxLength={280}
                              rows={2}
                            />
                            <span className="roommates-page__inline-char">{editMessage.length}/280</span>
                          </div>

                          <div className="roommates-page__inline-field">
                            <label>WhatsApp number</label>
                            <input
                              type="tel"
                              value={editContact}
                              onChange={(e) => setEditContact(e.target.value)}
                              placeholder="08012345678"
                            />
                          </div>

                          <div className="roommates-page__inline-field">
                            <label>Level</label>
                            <select value={editLevel} onChange={(e) => setEditLevel(e.target.value)}>
                              <option value="">Select level</option>
                              {LEVEL_OPTIONS.map((l) => (
                                <option key={l} value={l}>{l}</option>
                              ))}
                            </select>
                          </div>

                          <div className="roommates-page__inline-field">
                            <label>Gender preference</label>
                            <select value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                              <option value="No preference">No preference</option>
                              <option value="Male">Male only</option>
                              <option value="Female">Female only</option>
                            </select>
                          </div>

                          <div className="roommates-page__inline-field">
                            <label>Occupation</label>
                            <select value={editOccupation} onChange={(e) => setEditOccupation(e.target.value)}>
                              <option value="Any">Any</option>
                              <option value="Student">Student</option>
                              <option value="Working professional">Working professional</option>
                            </select>
                          </div>

                          <div className="roommates-page__inline-field">
                            <label>Move-in date</label>
                            <input
                              type="date"
                              value={editMoveIn}
                              onChange={(e) => setEditMoveIn(e.target.value)}
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>

                          <div className="roommates-page__inline-field roommates-page__inline-field--full">
                            <label>Lifestyle tags</label>
                            <div className="roommates-page__inline-tags">
                              {LIFESTYLE_TAGS.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  className={"roommates-page__inline-tag" + (editLifestyleTags.includes(tag) ? " active" : "")}
                                  onClick={() => toggleEditTag(tag)}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="roommates-page__inline-edit-footer">
                          <button
                            className="roommates-page__inline-save"
                            onClick={() => handleSaveEdit(post.id)}
                            disabled={savingEdit}
                          >
                            {savingEdit ? "Saving..." : "Save changes"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Filters ── */}
      <motion.div
        className="roommates-filters"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="roommates-filters__row roommates-filters__row--search">
          <div className="roommates-filters__search-wrap">
            <HiOutlineMagnifyingGlass className="roommates-filters__search-icon" />
            <input
              type="text"
              className="roommates-filters__search"
              placeholder="Search by name, listing, school, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="roommates-filters__clear-search" onClick={() => setSearch("")}>
                <HiOutlineXMark />
              </button>
            )}
          </div>
        </div>

        <div className="roommates-filters__row roommates-filters__row--selects">
          <select className="roommates-filters__select" value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="All">All areas</option>
            {ustAreas.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select className="roommates-filters__select" value={maxSplit} onChange={(e) => setMaxSplit(e.target.value)}>
            <option value="All">Any budget</option>
            <option value="100000">Up to ₦100k/yr</option>
            <option value="150000">Up to ₦150k/yr</option>
            <option value="200000">Up to ₦200k/yr</option>
            <option value="300000">Up to ₦300k/yr</option>
            <option value="500000">Up to ₦500k/yr</option>
          </select>
          <select className="roommates-filters__select" value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="All">Any gender pref</option>
            <option value="Male">Male preferred</option>
            <option value="Female">Female preferred</option>
          </select>
          <select className="roommates-filters__select" value={postTypeFilter} onChange={(e) => setPostTypeFilter(e.target.value)}>
            <option value="All">All posts</option>
            <option value="listing">Has a listing</option>
            <option value="looking">Looking for place</option>
          </select>
          {activeFilterCount > 0 && (
            <button className="roommates-filters__clear-all" onClick={clearFilters}>
              Clear{activeFilterCount > 1 ? ` (${activeFilterCount})` : ""}
            </button>
          )}
        </div>
      </motion.div>

      {/* Results count */}
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

      {/* ── Board grid ── */}
      {loading ? (
        <div className="roommates-page__skeleton-grid">
          {[1, 2, 3, 4].map((n) => <div key={n} className="roommates-page__skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="roommates-page__empty">
          <HiOutlineUserGroup className="roommates-page__empty-icon" />
          <h2>No roommate posts yet</h2>
          <p>
            {activeFilterCount > 0
              ? "Try adjusting your filters."
              : "Be the first — post a roommate request and find someone to share with."}
          </p>
          <div className="roommates-page__empty-actions">
            {user && userRole === "student" && (
              <Link href="/roommates/post" className="roommates-page__post-btn">
                <HiOutlinePlus /> Post a Request
              </Link>
            )}
            <Link href="/listings" className="roommates-page__empty-btn">Browse Listings</Link>
          </div>
        </div>
      ) : (
        <motion.div className="roommates-page__grid" variants={stagger} initial="hidden" animate="show">
          <AnimatePresence>
            {filtered.map((post) => {
              const isOwn = post.postedBy === user?.uid;
              const sentAlready = interestSentIds.has(post.id);
              const contactRevealed = contactRevealedIds.has(post.id);
              const colors = avatarColor(post.postedBy || "");
              const tags = post.preferences?.lifestyleTags || [];
              const isLooking = post.postType === "looking";

              return (
                <motion.div
                  key={post.id}
                  className={"roommate-card" + (isOwn ? " roommate-card--own" : "")}
                  variants={fadeUp}
                  layout
                  exit={{ opacity: 0, scale: 0.97 }}
                >
                  {/* Header */}
                  <div className="roommate-card__header">
                    <div
                      className="roommate-card__avatar"
                      style={{ background: colors.bg, color: colors.color }}
                    >
                      {(post.posterName || "?")[0].toUpperCase()}
                    </div>
                    <div className="roommate-card__poster">
                      <p className="roommate-card__poster-name">
                        {post.posterName}
                        {isOwn && <span className="roommate-card__you">Your post</span>}
                      </p>
                      <div className="roommate-card__poster-meta">
                        {post.school && (
                          <span className="roommate-card__school">
                            <HiOutlineAcademicCap />
                            {post.school}{post.level ? ` · ${post.level}` : ""}
                          </span>
                        )}
                        <span className="roommate-card__date">{formatDate(post.createdAt)}</span>
                      </div>
                    </div>

                    {/* Price badge */}
                    <div className="roommate-card__price-badge">
                      {isLooking ? (
                        <>
                          <span className="roommate-card__price-badge-label">Budget</span>
                          <strong>
                            ₦{Math.round((post.budgetMin || 0) / 1000)}k–{Math.round((post.budgetMax || 0) / 1000)}k
                          </strong>
                          <em>/yr</em>
                        </>
                      ) : (
                        <>
                          <span className="roommate-card__price-badge-label">Split</span>
                          <strong>₦{(post.splitCost || 0).toLocaleString()}</strong>
                          <em>/yr each</em>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Post type badge */}
                  <div className="roommate-card__type-badge-row">
                    <span className={"roommate-card__type-badge roommate-card__type-badge--" + (isLooking ? "looking" : "listing")}>
                      {isLooking ? <HiOutlineMagnifyingGlass /> : <HiOutlineHomeModern />}
                      {isLooking ? "Looking for a place" : "Has a listing"}
                    </span>
                  </div>

                  {/* Listing info (listing mode only) */}
                  {!isLooking && post.listingTitle && (
                    <div className="roommate-card__listing">
                      <p className="roommate-card__listing-title">{post.listingTitle}</p>
                      <div className="roommate-card__listing-meta">
                        {post.listingLocation && (
                          <span><HiOutlineMapPin />{post.listingLocation}</span>
                        )}
                        {post.listingType && (
                          <span><HiOutlineHomeModern />{post.listingType}</span>
                        )}
                        {post.listingPrice > 0 && (
                          <span><HiOutlineBanknotes />₦{Number(post.listingPrice).toLocaleString()}/yr total</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  {post.message && (
                    <p className="roommate-card__message">"{post.message}"</p>
                  )}

                  {/* Lifestyle tags */}
                  {tags.length > 0 && (
                    <div className="roommate-card__prefs">
                      {tags.slice(0, 4).map((t) => (
                        <span key={t} className="roommate-card__pref-tag">{t}</span>
                      ))}
                      {tags.length > 4 && (
                        <span className="roommate-card__pref-more">+{tags.length - 4}</span>
                      )}
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
                      {(post.interests || 0) > 0 && (
                        <span className="roommate-card__interests">
                          <HiOutlineBolt />{post.interests} interested
                        </span>
                      )}
                    </div>

                    <div className="roommate-card__footer-actions">
                      {/* View listing button (listing mode only) */}
                      {!isLooking && post.listingId && (
                        <Link
                          href={"/listings/" + post.listingId}
                          className="roommate-card__listing-btn"
                          title="View listing"
                          target="_blank"
                        >
                          <HiOutlineArrowTopRightOnSquare />
                        </Link>
                      )}

                      {/* Interest + contact flow */}
                      {!isOwn && user && (
                        <>
                          {contactRevealed ? (
                            // Contact is revealed — show WhatsApp link
                            <a
                              href={buildWaUrl(post)}
                              target="_blank"
                              rel="noreferrer"
                              className="roommate-card__wa-btn roommate-card__wa-btn--revealed"
                            >
                              <HiOutlineChatBubbleLeftRight />
                              <span>Message on WhatsApp</span>
                            </a>
                          ) : sentAlready ? (
                            // Sent but not yet showing contact (shouldn't happen but safety)
                            <span className="roommate-card__sent">
                              <HiOutlineCheck /> Interest sent
                            </span>
                          ) : (
                            // Show interest button
                            <button
                              className="roommate-card__interest-btn"
                              onClick={() => handleInterest(post)}
                            >
                              <HiOutlineBolt /> I'm Interested
                            </button>
                          )}
                        </>
                      )}

                      {/* Logged-out CTA */}
                      {!isOwn && !user && (
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