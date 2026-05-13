// app/roommates/post/page.js
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { fetchListings } from "@/lib/firestoreListings";
import { createRoommatePost } from "@/lib/firestoreRoommates";
import { UNIVERSITIES } from "@/lib/locations";
import { trackEvent } from "@/lib/posthog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "@/styles/roommate-post.css";

// Map profile sleep schedule → lifestyle option
function sleepToLifestyle(sleep) {
  if (sleep === "early")    return "Early riser";
  if (sleep === "late")     return "Night owl";
  return "No preference";
}

// Map profile genderPref → post form gender
function mapGenderPref(pref) {
  if (pref === "Male")   return "Male";
  if (pref === "Female") return "Female";
  return "No preference";
}

export default function PostRoommatePage() {
  const { user, userRole } = useAuth();
  const router = useRouter();

  const [query, setQuery]                   = useState("");
  const [allListings, setAllListings]       = useState([]);
  const [suggestions, setSuggestions]       = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDropdown, setShowDropdown]     = useState(false);
  const dropdownRef = useRef(null);

  const [message, setMessage]           = useState("");
  const [contact, setContact]           = useState("");
  const [school, setSchool]             = useState("");
  const [prefGender, setPrefGender]     = useState("No preference");
  const [prefOccupation, setPrefOccupation] = useState("Any");
  const [prefLifestyle, setPrefLifestyle]   = useState("No preference");
  const [moveInDate, setMoveInDate]     = useState("");

  const [profilePrefsLoaded, setProfilePrefsLoaded] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [error, setError]               = useState("");
  const [authChecked, setAuthChecked]   = useState(false);

  useEffect(() => {
    if (userRole === undefined || user === undefined) return;
    setAuthChecked(true);
    if (!user) { router.push("/login"); return; }
    if (userRole && userRole !== "student") router.push("/roommates");
  }, [user, userRole]);

  // ── Load profile prefs and pre-fill form ──
  useEffect(() => {
    if (!user) return;
    async function loadProfilePrefs() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) return;
        const data = snap.data();

        // Pre-fill contact from phone
        if (data.phone) setContact(data.phone);

        // Pre-fill university
        if (data.university) setSchool(data.university);

        // Pre-fill from roommatePrefs
        const prefs = data.roommatePrefs;
        if (prefs) {
          if (prefs.genderPref)    setPrefGender(mapGenderPref(prefs.genderPref));
          if (prefs.sleepSchedule) setPrefLifestyle(sleepToLifestyle(prefs.sleepSchedule));
          if (prefs.extraNotes)    setMessage(prefs.extraNotes);
        }

        setProfilePrefsLoaded(true);
      } catch (e) {
        console.error("Failed to load profile prefs:", e);
      }
    }
    loadProfilePrefs();
  }, [user]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchListings();
        setAllListings(data);
      } catch (e) {
        console.error("Failed to load listings:", e);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
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

  async function handleSubmit() {
    setError("");
    if (!selectedListing) { setError("Please search and select a listing."); return; }
    if (!contact.trim())  { setError("Please enter your WhatsApp contact number."); return; }

    setSubmitting(true);
    try {
      await createRoommatePost({
        listingId:       selectedListing.id,
        listingTitle:    selectedListing.title    || "Untitled Listing",
        listingLocation: selectedListing.location || "Port Harcourt",
        listingPrice:    selectedListing.price    || 0,
        listingType:     selectedListing.type     || "",
        postedBy:        user.uid,
        posterName:      user.displayName         || "Anonymous",
        posterContact:   contact.trim(),
        message:         message.trim(),
        school:          school || "",
        preferences: {
          gender:     prefGender     || "No preference",
          occupation: prefOccupation || "Any",
          lifestyle:  prefLifestyle  || "No preference",
          moveInDate: moveInDate     || "",
        },
      });

      trackEvent("roommate_post_created", {
        listingId:    selectedListing.id,
        listingTitle: selectedListing.title,
        location:     selectedListing.location,
        school,
        splitCost:    Math.ceil(Number(selectedListing.price || 0) / 2),
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
    setSelectedListing(null);
    setQuery("");
    setMessage("");
    setContact("");
    setSchool("");
    setPrefGender("No preference");
    setPrefOccupation("Any");
    setPrefLifestyle("No preference");
    setMoveInDate("");
    setError("");
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
        <p className="roommate-post-page__eyebrow"><HiOutlineUserGroup /> New Roommate Request</p>
        <h1>Post a roommate request</h1>
        <p className="roommate-post-page__sub">
          Found a listing you love? Post here to find someone to split the rent with.
        </p>
      </motion.div>

      <motion.div
        className="roommate-post-page__form"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >

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

        {/* Section 1 — Listing */}
        <div className="roommate-post-page__section">
          <div className="roommate-post-page__section-label">
            <HiOutlineHomeModern />
            <span>Which listing are you posting about?</span>
          </div>

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
        </div>

        {/* Section 2 — Contact */}
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

        {/* Section 3 — Message */}
        <div className="roommate-post-page__section">
          <div className="roommate-post-page__section-label">
            <HiOutlineChatBubbleBottomCenterText />
            <span>A short message <em>(optional)</em></span>
          </div>
          <textarea
            className="roommate-post-page__textarea"
            rows={3}
            placeholder="e.g. Looking for a clean and responsible roommate. I'm a 300L student at UNIPORT."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={280}
          />
          <p className="roommate-post-page__char-count">{message.length}/280</p>
        </div>

        {/* Section 4 — Preferences */}
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
                <option value="Male">Male</option>
                <option value="Female">Female</option>
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
              <label>Lifestyle</label>
              <select value={prefLifestyle} onChange={(e) => setPrefLifestyle(e.target.value)}>
                <option value="No preference">No preference</option>
                <option value="Early riser">Early riser</option>
                <option value="Night owl">Night owl</option>
                <option value="Non-smoker">Non-smoker</option>
                <option value="Quiet/studious">Quiet/studious</option>
              </select>
            </div>

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
              <label>Preferred move-in date</label>
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