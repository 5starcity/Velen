// app/agent/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineCheckBadge,
  HiOutlineHomeModern,
  HiOutlineStar,
  HiStar,
  HiOutlineCalendarDays,
  HiOutlineArrowLeft,
  HiOutlineUserCircle,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  fetchAgentProfile,
  fetchListingsByLandlord,
  fetchAgentReviews,
  submitAgentReview,
} from "@/lib/firestoreAgents";
import { trackEvent } from "@/lib/posthog";
import ListingCard from "@/components/listings/ListingCard";
import "@/styles/agent-profile.css";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// Both "landlord" and "agent" are the same backend role now — this is a
// display-only label so the profile page can still tell visitors which
// kind of account they're looking at. Adjust the source field name below
// if it's not `accountType` on the user doc.
const ACCOUNT_TYPE_LABELS = {
  landlord: "Landlord",
  agent: "Agent",
};

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={"star-picker__star" + (n <= (hovered || value) ? " active" : "")}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          {n <= (hovered || value) ? <HiStar /> : <HiOutlineStar />}
        </button>
      ))}
      <span className="star-picker__label">
        {value === 0 ? "Select rating" : ["", "Poor", "Fair", "Good", "Very good", "Excellent"][value]}
      </span>
    </div>
  );
}

function ReviewCard({ review }) {
  function formatDate(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="agent-review-card">
      <div className="agent-review-card__header">
        <div className="agent-review-card__avatar">
          {(review.userName || "?")[0].toUpperCase()}
        </div>
        <div className="agent-review-card__meta">
          <p className="agent-review-card__name">{review.userName}</p>
          <p className="agent-review-card__date">{formatDate(review.createdAt)}</p>
        </div>
        <div className="agent-review-card__stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= review.rating ? "star-filled" : "star-empty"}>
              {n <= review.rating ? <HiStar /> : <HiOutlineStar />}
            </span>
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="agent-review-card__comment">"{review.comment}"</p>
      )}
    </div>
  );
}

export default function AgentProfilePage() {
  const { id: agentId } = useParams();
  const { user, userRole } = useAuth();
  const router = useRouter();

  const [agent, setAgent]       = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [agentData, listingsData, reviewsData] = await Promise.all([
          fetchAgentProfile(agentId),
          fetchListingsByLandlord(agentId),
          fetchAgentReviews(agentId),
        ]);
        setAgent(agentData);
        setListings(listingsData);
        setReviews(reviewsData);
      } catch (e) {
        console.error("Agent profile load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentId]);

  async function handleSubmitReview() {
    setReviewError("");
    if (rating === 0)      { setReviewError("Please select a star rating."); return; }
    if (!comment.trim())   { setReviewError("Please leave a comment."); return; }
    if (!user)             { router.push("/login"); return; }

    setSubmitting(true);
    try {
      await submitAgentReview(agentId, user.uid, user.displayName || "Anonymous", {
        rating,
        comment: comment.trim(),
      });

      trackEvent("agent_review_submitted", {
        agentId,
        agentName: agent?.name,
        rating,
      });

      const newReview = {
        id:        Date.now().toString(),
        agentId,
        userId:    user.uid,
        userName:  user.displayName || "Anonymous",
        rating,
        comment:   comment.trim(),
        createdAt: new Date(),
      };
      setReviews((prev) => [newReview, ...prev]);
      setReviewSuccess(true);
      setShowReviewForm(false);
      setRating(0);
      setComment("");
    } catch (e) {
      if (e.message === "already_reviewed") {
        setReviewError("You've already reviewed this agent.");
      } else {
        setReviewError("Failed to submit review. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const alreadyReviewed = reviews.some((r) => r.userId === user?.uid);

  function formatJoinDate(createdAt) {
    if (!createdAt) return "";
    const d = new Date(createdAt);
    return d.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
  }

  if (loading) {
    return (
      <main className="agent-page">
        <div className="agent-page__loading">
          <span className="agent-page__spinner" />
        </div>
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="agent-page">
        <div className="agent-page__not-found">
          <h2>Agent not found</h2>
          <Link href="/listings">Back to listings</Link>
        </div>
      </main>
    );
  }

  // Front-end-only label — landlord and agent share one backend role now,
  // so this reads a separate display field rather than `userRole`.
  const accountTypeLabel = ACCOUNT_TYPE_LABELS[agent.accountType] || null;

  return (
    <main className="agent-page">

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <button className="agent-page__back" onClick={() => router.back()}>
          <HiOutlineArrowLeft /> Back
        </button>
      </motion.div>

      <motion.div
        className="agent-page__profile"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="agent-page__avatar">
          {agent.avatar
            ? <img src={agent.avatar} alt={agent.name} />
            : <HiOutlineUserCircle />
          }
        </div>

        <div className="agent-page__profile-info">
          <div className="agent-page__name-row">
            <h1>{agent.name}</h1>
            {accountTypeLabel && (
              <span className={`agent-page__account-badge agent-page__account-badge--${agent.accountType}`}>
                {accountTypeLabel}
              </span>
            )}
            {agent.verified && (
              <span className="agent-page__verified">
                <HiOutlineCheckBadge /> Verified
              </span>
            )}
          </div>

          <div className="agent-page__profile-meta">
            {agent.createdAt && (
              <span><HiOutlineCalendarDays /> Member since {formatJoinDate(agent.createdAt)}</span>
            )}
            <span><HiOutlineHomeModern /> {listings.length} listing{listings.length !== 1 ? "s" : ""}</span>
            {avgRating && (
              <span className="agent-page__rating-pill">
                <HiStar /> {avgRating} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="agent-page__stats"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <div className="agent-page__stat">
          <strong>{listings.length}</strong>
          <span>Listings</span>
        </div>
        <div className="agent-page__stat-divider" />
        <div className="agent-page__stat">
          <strong>{listings.filter((l) => l.verified).length}</strong>
          <span>Verified</span>
        </div>
        <div className="agent-page__stat-divider" />
        <div className="agent-page__stat">
          <strong>{avgRating || "—"}</strong>
          <span>Avg rating</span>
        </div>
        <div className="agent-page__stat-divider" />
        <div className="agent-page__stat">
          <strong>{reviews.length}</strong>
          <span>Reviews</span>
        </div>
      </motion.div>

      <motion.section
        className="agent-page__section"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        <h2 className="agent-page__section-title">
          <HiOutlineHomeModern /> Listings by {agent.name}
        </h2>

        {listings.length === 0 ? (
          <div className="agent-page__empty">
            <p>No active listings from this agent.</p>
          </div>
        ) : (
          <motion.div
            className="agent-page__listings-grid"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {listings.map((listing) => (
              <motion.div key={listing.id} variants={fadeUp}>
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.section>

      <motion.section
        className="agent-page__section"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
      >
        <div className="agent-page__reviews-header">
          <h2 className="agent-page__section-title">
            <HiOutlineStar />Reviews
            {avgRating && <span className="agent-page__avg-badge">{avgRating} ★</span>}
          </h2>

          {userRole === "student" && !alreadyReviewed && !reviewSuccess && (
            <button
              className="agent-page__review-btn"
              onClick={() => setShowReviewForm((v) => !v)}
            >
              <HiOutlineChatBubbleLeftRight />
              {showReviewForm ? "Cancel" : "Leave a review"}
            </button>
          )}
          {reviewSuccess && (
            <span className="agent-page__review-success">✅ Review submitted!</span>
          )}
          {alreadyReviewed && !reviewSuccess && (
            <span className="agent-page__review-done">You've reviewed this agent</span>
          )}
        </div>

        <AnimatePresence>
          {showReviewForm && (
            <motion.div
              className="agent-page__review-form"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <StarPicker value={rating} onChange={setRating} />
              <textarea
                className="agent-page__review-textarea"
                rows={3}
                placeholder="Share your experience with this landlord/agent — reliability, communication, property condition..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={400}
              />
              <div className="agent-page__review-form-footer">
                <span className="agent-page__review-char">{comment.length}/400</span>
                {reviewError && <p className="agent-page__review-error">{reviewError}</p>}
                <button
                  className="agent-page__review-submit"
                  onClick={handleSubmitReview}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {reviews.length === 0 ? (
          <div className="agent-page__empty">
            <p>No reviews yet. Be the first to review this agent.</p>
          </div>
        ) : (
          <motion.div
            className="agent-page__reviews-list"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {reviews.map((review) => (
              <motion.div key={review.id} variants={fadeUp}>
                <ReviewCard review={review} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!user && (
          <p className="agent-page__login-prompt">
            <Link href="/login">Log in</Link> to leave a review.
          </p>
        )}
      </motion.section>

    </main>
  );
}