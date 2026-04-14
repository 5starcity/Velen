// components/listings/RoommateSection.jsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineUserGroup,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlinePhone,
  HiOutlineBolt,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineBriefcase,
  HiOutlineSparkles,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineTrash,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  fetchRoommatePostsByListing,
  createRoommatePost,
  deleteRoommatePost,
  expressRoommateInterest,
} from "@/lib/firestoreRoommates";

const GENDER_OPTS     = ["No preference", "Male", "Female"];
const OCCUPATION_OPTS = ["Any", "Student", "Working professional"];
const LIFESTYLE_OPTS  = ["No preference", "Quiet", "Social"];

export default function RoommateSection({ listing }) {
  const { user, userRole } = useAuth();

  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [interestSentId, setInterestSentId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError]           = useState("");

  const [form, setForm] = useState({
    message:     "",
    contact:     "",
    gender:      "No preference",
    occupation:  "Any",
    lifestyle:   "No preference",
    moveInDate:  "",
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRoommatePostsByListing(listing.id);
        setPosts(data);
      } catch (e) {
        console.error("Roommate load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listing.id]);

  // Only tenants see this section
  if (userRole === "landlord") return null;

  const splitCost = Math.ceil(Number(listing.price) / 2);
  const userHasPost = posts.some((p) => p.postedBy === user?.uid);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit() {
    if (!user) return;
    if (!form.contact.trim() || form.contact.trim().length < 11) {
      setError("Enter a valid WhatsApp number (at least 11 digits).");
      return;
    }
    if (!form.message.trim()) {
      setError("Add a short message so people know what you're looking for.");
      return;
    }
    setSubmitting(true);
    try {
      const id = await createRoommatePost({
        listingId:       listing.id,
        listingTitle:    listing.title,
        listingLocation: listing.location,
        listingPrice:    listing.price,
        listingType:     listing.type,
        postedBy:        user.uid,
        posterName:      user.displayName || "Anonymous",
        posterContact:   form.contact.trim(),
        message:         form.message.trim(),
        preferences: {
          gender:     form.gender,
          occupation: form.occupation,
          lifestyle:  form.lifestyle,
          moveInDate: form.moveInDate.trim(),
        },
      });

      const newPost = {
        id,
        listingId:       listing.id,
        listingTitle:    listing.title,
        listingLocation: listing.location,
        listingPrice:    Number(listing.price),
        listingType:     listing.type,
        splitCost,
        postedBy:        user.uid,
        posterName:      user.displayName || "Anonymous",
        posterContact:   form.contact.trim(),
        message:         form.message.trim(),
        preferences: {
          gender:     form.gender,
          occupation: form.occupation,
          lifestyle:  form.lifestyle,
          moveInDate: form.moveInDate.trim(),
        },
        status:    "open",
        interests: 0,
        createdAt: new Date(),
      };

      setPosts((prev) => [newPost, ...prev]);
      setShowForm(false);
      setForm({ message: "", contact: "", gender: "No preference", occupation: "Any", lifestyle: "No preference", moveInDate: "" });
    } catch (e) {
      console.error("Create roommate post error:", e);
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(postId) {
    if (!window.confirm("Remove your roommate post?")) return;
    setDeletingId(postId);
    try {
      await deleteRoommatePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleInterest(post) {
    if (!user) return;
    try {
      await expressRoommateInterest(post.id, user.uid, user.displayName || "Someone");
      setInterestSentId(post.id);
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, interests: (p.interests || 0) + 1 } : p));

      // Open WhatsApp
      const waNum = post.posterContact.startsWith("0")
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

  function prefBadge(label, value) {
    if (!value || value === "No preference" || value === "Any") return null;
    return (
      <span key={label} className="roommate-post__pref">
        {value}
      </span>
    );
  }

  return (
    <div className="roommate-section">
      {/* Header */}
      <div className="roommate-section__header">
        <div className="roommate-section__header-left">
          <HiOutlineUserGroup className="roommate-section__header-icon" />
          <div>
            <h2 className="roommate-section__title">Looking for a Roommate</h2>
            <p className="roommate-section__sub">
              Split the cost — each person pays{" "}
              <strong className="roommate-section__split">
                ₦{splitCost.toLocaleString()}/yr
              </strong>{" "}
              instead of ₦{Number(listing.price).toLocaleString()}
            </p>
          </div>
        </div>

        {user && !userHasPost && !showForm && (
          <button
            className="roommate-section__post-btn"
            onClick={() => setShowForm(true)}
          >
            <HiOutlinePlus /> Post Roommate Request
          </button>
        )}
      </div>

      {/* ── Post form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="roommate-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
          >
            <div className="roommate-form__header">
              <h3>Create a Roommate Post</h3>
              <button
                className="roommate-form__close"
                onClick={() => { setShowForm(false); setError(""); }}
              >
                <HiOutlineXMark />
              </button>
            </div>

            <div className="roommate-form__cost-preview">
              <span>Your share of the rent</span>
              <strong>₦{splitCost.toLocaleString()}<em>/yr</em></strong>
            </div>

            <div className="roommate-form__fields">
              {/* Message */}
              <div className="roommate-form__field roommate-form__field--full">
                <label>Your message</label>
                <textarea
                  name="message"
                  rows={3}
                  placeholder="e.g. Looking for a clean, quiet person. I work during the day and prefer a tidy shared space..."
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              {/* WhatsApp */}
              <div className="roommate-form__field roommate-form__field--full">
                <label>Your WhatsApp number</label>
                <input
                  type="tel"
                  name="contact"
                  placeholder="e.g. 08012345678"
                  value={form.contact}
                  onChange={handleChange}
                />
              </div>

              {/* Preferences */}
              <div className="roommate-form__field">
                <label>Preferred gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  {GENDER_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="roommate-form__field">
                <label>Occupation</label>
                <select name="occupation" value={form.occupation} onChange={handleChange}>
                  {OCCUPATION_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="roommate-form__field">
                <label>Lifestyle</label>
                <select name="lifestyle" value={form.lifestyle} onChange={handleChange}>
                  {LIFESTYLE_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="roommate-form__field">
                <label>Move-in date <span className="roommate-form__optional">(optional)</span></label>
                <input
                  type="text"
                  name="moveInDate"
                  placeholder="e.g. January 2025, ASAP"
                  value={form.moveInDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <p className="roommate-form__error">
                <HiOutlineExclamationTriangle /> {error}
              </p>
            )}

            <div className="roommate-form__actions">
              <button
                className="roommate-form__submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Posting..." : "Post Request"}
              </button>
              <button
                className="roommate-form__cancel"
                onClick={() => { setShowForm(false); setError(""); }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Login prompt ── */}
      {!user && (
        <p className="roommate-section__login-note">
          <a href="/login">Log in</a> to post a roommate request or contact someone.
        </p>
      )}

      {/* ── Posts list ── */}
      {loading ? (
        <p className="roommate-section__loading">Loading roommate posts...</p>
      ) : posts.length === 0 && !showForm ? (
        <div className="roommate-section__empty">
          <HiOutlineUserGroup />
          <p>No roommate requests yet for this property.</p>
          {user && !userHasPost && (
            <button
              className="roommate-section__post-btn"
              onClick={() => setShowForm(true)}
            >
              <HiOutlinePlus /> Be the first to post
            </button>
          )}
        </div>
      ) : (
        <div className="roommate-section__posts">
          {posts.map((post) => {
            const isOwn      = post.postedBy === user?.uid;
            const isDeleting = deletingId === post.id;
            const sentAlready = interestSentId === post.id;

            const waNum = post.posterContact?.startsWith("0")
              ? "234" + post.posterContact.slice(1)
              : post.posterContact;

            const prefs = [
              prefBadge("gender", post.preferences?.gender),
              prefBadge("occupation", post.preferences?.occupation),
              prefBadge("lifestyle", post.preferences?.lifestyle),
            ].filter(Boolean);

            return (
              <motion.div
                key={post.id}
                className={"roommate-post" + (isOwn ? " roommate-post--own" : "")}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="roommate-post__top">
                  <div className="roommate-post__poster-info">
                    <div className="roommate-post__avatar">
                      {(post.posterName || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="roommate-post__poster-name">
                        {post.posterName}
                        {isOwn && <span className="roommate-post__you-badge">You</span>}
                      </p>
                      <p className="roommate-post__split-price">
                        Splitting — pays <strong>₦{post.splitCost?.toLocaleString()}/yr</strong>
                      </p>
                    </div>
                  </div>

                  {isOwn && (
                    <button
                      className="roommate-post__delete"
                      onClick={() => handleDelete(post.id)}
                      disabled={isDeleting}
                      title="Remove your post"
                    >
                      {isDeleting ? <span className="roommate-post__mini-spinner" /> : <HiOutlineTrash />}
                    </button>
                  )}
                </div>

                {post.message && (
                  <p className="roommate-post__message">{post.message}</p>
                )}

                {/* Preference tags */}
                {prefs.length > 0 && (
                  <div className="roommate-post__prefs">
                    {prefs}
                  </div>
                )}

                {/* Move-in date */}
                {post.preferences?.moveInDate && (
                  <p className="roommate-post__movein">
                    <HiOutlineCalendarDays />
                    Move-in: {post.preferences.moveInDate}
                  </p>
                )}

                {/* Interest count */}
                {post.interests > 0 && (
                  <p className="roommate-post__interests">
                    <HiOutlineBolt />
                    {post.interests} {post.interests === 1 ? "person" : "people"} interested
                  </p>
                )}

                {/* Actions — only for other users */}
                {!isOwn && user && (
                  <div className="roommate-post__actions">
                    {!sentAlready ? (
                      <button
                        className="roommate-post__interest-btn"
                        onClick={() => handleInterest(post)}
                      >
                        <HiOutlineBolt /> I'm Interested
                      </button>
                    ) : (
                      <span className="roommate-post__sent">
                        <HiOutlineCheck /> Message sent on WhatsApp
                      </span>
                    )}
                    <a
                      href={`https://wa.me/${waNum}`}
                      target="_blank"
                      rel="noreferrer"
                      className="roommate-post__wa-btn"
                    >
                      <HiOutlineChatBubbleLeftRight />
                    </a>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Link to full board */}
      <div className="roommate-section__board-link">
        <a href="/roommates">
          <HiOutlineArrowTopRightOnSquare />
          Browse all roommate posts in Port Harcourt
        </a>
      </div>
    </div>
  );
}