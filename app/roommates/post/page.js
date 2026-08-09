// app/roommates/post/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlineHomeModern,
  HiOutlineMapPin,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft,
  HiOutlinePhone,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineSparkles,
  HiOutlineInformationCircle,
  HiOutlineAcademicCap,
  HiOutlineLink,
  HiOutlinePencilSquare,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { fetchListings, fetchListingById } from "@/lib/firestoreListings";
import { createRoommatePost } from "@/lib/firestoreRoommates";
import { UNIVERSITIES } from "@/lib/locations";
import { trackEvent } from "@/lib/posthog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "@/styles/roommate-post.css";

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

function sleepToTag(sleep) {
  if (sleep === "early") return "Early riser";
  if (sleep === "late") return "Night owl";
  return null;
}

function mapGenderPref(pref) {
  if (pref === "Male") return "Male";
  if (pref === "Female") return "Female";
  return "No preference";
}

export default function PostRoommatePage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillListingId = searchParams.get("listingId");

  // ── Mode toggle ──
  const [postType, setPostType] = useState("listing"); // "listing" | "looking"

  // ── Listing search ──
  const [query, setQuery] = useState("");
  const [allListings, setAllListings] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // ── Prefill (arrived from a listing page) ──
  const [lockedFromListing, setLockedFromListing] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(!!prefillListingId);
  const [prefillError, setPrefillError] = useState("");

  // ── Core fields ──
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [school, setSchool] = useState("");
  const [level, setLevel] = useState("");
  const [prefGender, setPrefGender] = useState("No preference");
  const [prefOccupation, setPrefOccupation] = useState("Any");
  const [lifestyleTags, setLifestyleTags] = useState([]);
  const [moveInDate, setMoveInDate] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  // ── UI state ──
  const [profilePrefsLoaded, setProfilePrefsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (userRole === undefined || user === undefined) return;
    setAuthChecked(true);
    if (!user) { router.push("/login"); return; }
    if (userRole && userRole !== "student") router.push("/roommates");
  }, [user, userRole]);

  useEffect(() => {
    if (!user) return;
    async function loadProfilePrefs() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) return;
        const data = snap.data();
        if (data.phone) setContact(data.phone);
        if (data.university) setSchool(data.university);
        const prefs = data.roommatePrefs;
        if (prefs) {
          if (prefs.genderPref) setPrefGender(mapGenderPref(prefs.genderPref));
          const tag = sleepToTag(prefs.sleepSchedule);
          if (tag) setLifestyleTags([tag]);
          if (prefs.extraNotes) setMessage(prefs.extraNotes);
        }
        setProfilePrefsLoaded(true);
      } catch (e) {
        console.error("Failed to load profile prefs:", e);
      }
    }
    loadProfilePrefs();
  }, [user]);

  // ── Prefill from ?listingId= (arrived via "Find a roommate" on a listing page) ──
  useEffect(() => {
    if (!prefillListingId || !user) return;
    let cancelled = false;
    async function loadPrefill() {
      setPostType("listing");
      setPrefillLoading(true);
      setPrefillError("");
      try {
        const listing = await fetchListingById(prefillListingId);
        if (cancelled) return;
        if (!listing) {
          setPrefillError("That listing couldn't be found. Search for it below instead.");
          return;
        }
        setSelectedListing(listing);
        setQuery(listing.title || "");
        setLockedFromListing(true);
      } catch (e) {
        console.error("Failed to prefill listing:", e);
        if (!cancelled) setPrefillError("Couldn't load that listing. Search for it below instead.");
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    }
    loadPrefill();
    return () => { cancelled = true; };
  }, [prefillListingId, user]);

  useEffect(() => {
    if (postType !== "listing" || lockedFromListing) return;
    async function load() {
      try {
        const data = await fetchListings();
        setAllListings(data);
      } catch (e) {
        console.error("Failed to load listings:", e);
      }
    }
    load();
  }, [postType, lockedFromListing]);

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); setShowDropdown(false); return; }
    const q = query.toLowerCase();
    const matches = allListings
      .filter((l) => l.title?.toLowerCase().includes(q) || l.location?.toLowerCase().includes(q))
      .slice(0, 6);
    setSuggestions(matches);
    setShowDropdown(matches.length > 0);
  }, [query, allListings]);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(listing) {
    setSelectedListing(listing);
    setQuery(listing.title);
    setShowDropdown(false);
  }

  function clearListing() {
    setSelectedListing(null);
    setQuery("");
  }

  function handleChangeListing() {
    setLockedFromListing(false);
    setSelectedListing(null);
    setQuery("");
  }

  function toggleTag(tag) {
    setLifestyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit() {
    setError("");

    if (postType === "listing" && !selectedListing) {
      setError("Please search and select a listing.");
      return;
    }
    if (postType === "looking" && (!budgetMin || !budgetMax)) {
      setError("Please enter your budget range.");
      return;
    }
    if (!contact.trim()) {
      setError("Please enter your WhatsApp contact number.");
      return;
    }

    setSubmitting(true);
    try {
      const postData = {
        postType,
        postedBy: user.uid,
        posterName: user.displayName || "Anonymous",
        posterContact: contact.trim(),
        message: message.trim(),
        school: school || "",
        level: level || "",
        preferences: {
          gender: prefGender || "No preference",
          occupation: prefOccupation || "Any",
          lifestyleTags,
          moveInDate: moveInDate || "",
        },
      };

      if (postType === "listing") {
        Object.assign(postData, {
          listingId: selectedListing.id,
          listingTitle: selectedListing.title || "Untitled Listing",
          listingLocation: selectedListing.location || "Port Harcourt",
          listingPrice: selectedListing.price || 0,
          listingType: selectedListing.type || "",
        });
      } else {
        Object.assign(postData, {
          listingId: null,
          budgetMin: Number(budgetMin),
          budgetMax: Number(budgetMax),
          listingLocation: "",
        });
      }

      await createRoommatePost(postData);

      trackEvent("roommate_post_created", {
        postType,
        school,
        lifestyleTags,
        fromListingCta: !!prefillListingId,
        ...(postType === "listing" && {
          listingId: selectedListing.id,
          listingTitle: selectedListing.title,
          splitCost: Math.ceil(Number(selectedListing.price || 0) / 2),
        }),
      });

      setSubmitted(true);
    } catch (e) {
      console.error("Post error:", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSubmitted(false);
    setPostType("listing");
    setSelectedListing(null);
    setQuery("");
    setMessage("");
    setContact("");
    setSchool("");
    setLevel("");
    setPrefGender("No preference");
    setPrefOccupation("Any");
    setLifestyleTags([]);
    setMoveInDate("");
    setBudgetMin("");
    setBudgetMax("");
    setError("");
    setLockedFromListing(false);
  }

  if (!authChecked) {
    return (
      <main className="roommate-post-page">
        <div className="roommate-post-page__auth-loading"><p>Checking access...</p></div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="roommate-post-page">
        <motion.div
          className="roommate-post-page__success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="roommate-post-page__success-icon"><HiOutlineCheckCircle /></div>
          <h1>Post published!</h1>
          <p>Your roommate request is now live on the board. Interested students will reach out via WhatsApp.</p>
          <div className="roommate-post-page__success-actions">
            <Link href="/roommates" className="roommate-post-page__back-btn">View the board</Link>
            <button className="roommate-post-page__another-btn" onClick={resetForm}>Post another</button>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="roommate-post-page">
      <motion.div
        className="roommate-post-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/roommates" className="roommate-post-page__back">
          <HiOutlineArrowLeft /> Back to board
        </Link>
        <p className="roommate-post-page__eyebrow">
          {lockedFromListing ? <HiOutlineLink /> : <HiOutlineUserGroup />}
          {lockedFromListing ? "Posting about a listing" : "New Roommate Request"}
        </p>
        <h1>Post a roommate request</h1>
        <p className="roommate-post-page__sub">
          {lockedFromListing
            ? "You're posting about the listing you just viewed. Fill in the rest and publish."
            : "Looking for someone to share a place with? Post here and connect via WhatsApp."}
        </p>
      </motion.div>

      <motion.div
        className="roommate-post-page__form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >

        {/* ── Mode toggle (hidden while locked to a specific listing) ── */}
        {!lockedFromListing && (
          <div className="roommate-post-page__mode-toggle">
            <button
              className={"roommate-post-page__mode-btn" + (postType === "listing" ? " active" : "")}
              onClick={() => setPostType("listing")}
              type="button"
            >
              <HiOutlineHomeModern />
              I have a listing to share
            </button>
            <button
              className={"roommate-post-page__mode-btn" + (postType === "looking" ? " active" : "")}
              onClick={() => setPostType("looking")}
              type="button"
            >
              <HiOutlineMagnifyingGlass />
              I'm looking for a place
            </button>
          </div>
        )}

        {/* Profile prefs banner */}
        {profilePrefsLoaded && (
          <motion.div
            className="roommate-post-page__prefs-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <HiOutlineInformationCircle />
            <p>Some fields were pre-filled from your <Link href="/profile">profile preferences</Link>. You can edit them below.</p>
          </motion.div>
        )}

        {/* ── Section 1a — Listing (prefill lock OR search) ── */}
        {postType === "listing" && (
          <motion.div
            className="roommate-post-page__section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="roommate-post-page__section-label">
              <HiOutlineHomeModern />
              <span>Which listing are you posting about?</span>
            </div>

            {prefillLoading ? (
              <div className="roommate-post-page__prefill-loading">
                <span className="roommate-post-page__prefill-spinner" />
                Loading listing details...
              </div>
            ) : lockedFromListing && selectedListing ? (
              <motion.div
                className="roommate-post-page__locked-listing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="roommate-post-page__locked-badge">
                  <HiOutlineLink /> From listing
                </div>
                <div className="roommate-post-page__preview">
                  <div className="roommate-post-page__preview-row">
                    <span className="roommate-post-page__preview-label">Listing</span>
                    <span className="roommate-post-page__preview-val">{selectedListing.title || "Untitled"}</span>
                  </div>
                  <div className="roommate-post-page__preview-row">
                    <span className="roommate-post-page__preview-label">Location</span>
                    <span className="roommate-post-page__preview-val">{selectedListing.location || "Port Harcourt"}</span>
                  </div>
                  <div className="roommate-post-page__preview-row">
                    <span className="roommate-post-page__preview-label">Full rent</span>
                    <span className="roommate-post-page__preview-val">₦{Number(selectedListing.price || 0).toLocaleString()}/yr</span>
                  </div>
                  <div className="roommate-post-page__preview-row roommate-post-page__preview-row--highlight">
                    <span className="roommate-post-page__preview-label">Your split</span>
                    <span className="roommate-post-page__preview-val">
                      ₦{Math.ceil(Number(selectedListing.price || 0) / 2).toLocaleString()}/yr each
                    </span>
                  </div>
                </div>
                <button type="button" className="roommate-post-page__change-listing" onClick={handleChangeListing}>
                  <HiOutlinePencilSquare /> Not this one? Search another listing
                </button>
              </motion.div>
            ) : (
              <>
                {prefillError && (
                  <p className="roommate-post-page__prefill-error">{prefillError}</p>
                )}
                <div className="roommate-post-page__search-wrap" ref={dropdownRef}>
                  <div className={"roommate-post-page__search-box" + (selectedListing ? " selected" : "")}>
                    <HiOutlineMagnifyingGlass className="roommate-post-page__search-icon" />
                    <input
                      type="text"
                      placeholder="Search by listing name or area..."
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); if (selectedListing) setSelectedListing(null); }}
                      onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                      className="roommate-post-page__search-input"
                    />
                    {selectedListing && (
                      <button className="roommate-post-page__clear-btn" onClick={clearListing}>✕</button>
                    )}
                  </div>

                  {showDropdown && (
                    <motion.div
                      className="roommate-post-page__dropdown"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {suggestions.map((l) => (
                        <button key={l.id} className="roommate-post-page__dropdown-item" onClick={() => handleSelect(l)}>
                          <div className="roommate-post-page__dropdown-title">{l.title}</div>
                          <div className="roommate-post-page__dropdown-meta">
                            <span><HiOutlineMapPin />{l.location || "Port Harcourt"}</span>
                            <span><HiOutlineBanknotes />₦{Number(l.price || 0).toLocaleString()}/yr</span>
                            {l.type && <span><HiOutlineHomeModern />{l.type}</span>}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {selectedListing && (
                  <motion.div
                    className="roommate-post-page__preview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="roommate-post-page__preview-row">
                      <span className="roommate-post-page__preview-label">Listing</span>
                      <span className="roommate-post-page__preview-val">{selectedListing.title || "Untitled"}</span>
                    </div>
                    <div className="roommate-post-page__preview-row">
                      <span className="roommate-post-page__preview-label">Location</span>
                      <span className="roommate-post-page__preview-val">{selectedListing.location || "Port Harcourt"}</span>
                    </div>
                    <div className="roommate-post-page__preview-row">
                      <span className="roommate-post-page__preview-label">Full rent</span>
                      <span className="roommate-post-page__preview-val">₦{Number(selectedListing.price || 0).toLocaleString()}/yr</span>
                    </div>
                    <div className="roommate-post-page__preview-row roommate-post-page__preview-row--highlight">
                      <span className="roommate-post-page__preview-label">Your split</span>
                      <span className="roommate-post-page__preview-val">
                        ₦{Math.ceil(Number(selectedListing.price || 0) / 2).toLocaleString()}/yr each
                      </span>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── Section 1b — Budget range (looking mode) ── */}
        {postType === "looking" && (
          <motion.div
            className="roommate-post-page__section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="roommate-post-page__section-label">
              <HiOutlineBanknotes />
              <span>What's your budget range? <em>(per year)</em></span>
            </div>
            <div className="roommate-post-page__budget-row">
              <div className="roommate-post-page__budget-field">
                <label>Min (₦/yr)</label>
                <input
                  type="number"
                  className="roommate-post-page__input"
                  placeholder="e.g. 80000"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  min="0"
                />
              </div>
              <span className="roommate-post-page__budget-sep">to</span>
              <div className="roommate-post-page__budget-field">
                <label>Max (₦/yr)</label>
                <input
                  type="number"
                  className="roommate-post-page__input"
                  placeholder="e.g. 200000"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Section 2 — Contact ── */}
        <div className="roommate-post-page__section">
          <div className="roommate-post-page__section-label">
            <HiOutlinePhone />
            <span>Your WhatsApp number</span>
          </div>
          <input
            type="tel"
            className="roommate-post-page__input"
            placeholder="e.g. 08012345678"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <p className="roommate-post-page__hint">Interested students will contact you directly via WhatsApp.</p>
        </div>

        {/* ── Section 3 — Message ── */}
        <div className="roommate-post-page__section">
          <div className="roommate-post-page__section-label">
            <HiOutlineChatBubbleBottomCenterText />
            <span>A short message <em>(optional)</em></span>
          </div>
          <textarea
            className="roommate-post-page__textarea"
            rows={3}
            placeholder="e.g. Looking for a clean and responsible roommate. I'm a 300L student at RSU."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={280}
          />
          <p className="roommate-post-page__char-count">{message.length}/280</p>
        </div>

        {/* ── Section 4 — About you (school + level) ── */}
        <div className="roommate-post-page__section">
          <div className="roommate-post-page__section-label">
            <HiOutlineAcademicCap />
            <span>About you</span>
          </div>
          <div className="roommate-post-page__prefs-grid">
            <div className="roommate-post-page__pref-field">
              <label>Your university</label>
              <select value={school} onChange={(e) => setSchool(e.target.value)}>
                <option value="">Select school</option>
                {UNIVERSITIES.filter((u) => u.value !== "All").map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
            <div className="roommate-post-page__pref-field">
              <label>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">Select level</option>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Section 5 — Roommate preferences ── */}
        <div className="roommate-post-page__section">
          <div className="roommate-post-page__section-label">
            <HiOutlineSparkles />
            <span>Roommate preferences <em>(optional)</em></span>
          </div>

          <div className="roommate-post-page__prefs-grid">
            <div className="roommate-post-page__pref-field">
              <label>Gender preference</label>
              <select value={prefGender} onChange={(e) => setPrefGender(e.target.value)}>
                <option value="No preference">No preference</option>
                <option value="Male">Male only</option>
                <option value="Female">Female only</option>
              </select>
            </div>

            <div className="roommate-post-page__pref-field">
              <label>Occupation</label>
              <select value={prefOccupation} onChange={(e) => setPrefOccupation(e.target.value)}>
                <option value="Any">Any</option>
                <option value="Student">Student</option>
                <option value="Working professional">Working professional</option>
              </select>
            </div>

            <div className="roommate-post-page__pref-field">
              <label>Move-in date</label>
              <div className="roommate-post-page__date-wrap">
                <HiOutlineCalendarDays />
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => setMoveInDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
          </div>

          {/* Lifestyle tag chips */}
          <div className="roommate-post-page__tag-section">
            <label className="roommate-post-page__tag-label">Lifestyle <em>(pick all that apply)</em></label>
            <div className="roommate-post-page__tag-grid">
              {LIFESTYLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={"roommate-post-page__tag" + (lifestyleTags.includes(tag) ? " active" : "")}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <motion.p className="roommate-post-page__error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
            {error}
          </motion.p>
        )}

        <button className="roommate-post-page__submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Publishing..." : "Publish Roommate Request"}
        </button>

      </motion.div>
    </main>
  );
}