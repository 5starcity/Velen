// app/inspect/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineHomeModern,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlinePhone,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentCheck,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { fetchListingById } from "@/lib/firestoreListings";
import { trackEvent } from "@/lib/posthog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "@/styles/inspect.css";

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00",
];

export default function InspectionBookingPage() {
  const { id: listingId } = useParams();
  const router = useRouter();
  const { user, userRole } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [date, setDate]   = useState("");
  const [time, setTime]   = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote]   = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user]);

  useEffect(() => {
    async function load() {
      if (!listingId) return;
      try {
        const data = await fetchListingById(listingId);
        setListing(data);
      } catch (e) {
        console.error("Failed to load listing:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listingId]);

  useEffect(() => {
    if (!user) return;
    async function loadPhone() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().phone) {
          setPhone(snap.data().phone);
        }
      } catch (e) {}
    }
    loadPhone();
  }, [user]);

  // Remove these imports
// import { bookInspection } from "@/lib/firestoreInspections";
// import { createNotification } from "@/lib/firestoreNotifications";

async function handleSubmit() {
  setError("");
  if (!date)         { setError("Please select a date."); return; }
  if (!time)         { setError("Please select a time slot."); return; }
  if (!phone.trim()) { setError("Please enter your phone number."); return; }

  setSubmitting(true);
  try {
    const res = await fetch("/api/inspections/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        listingTitle: listing.title,
        landlordId:   listing.landlordId,
        tenantId:     user.uid,
        tenantName:   user.displayName || "Anonymous",
        tenantPhone:  phone.trim(),
        date,
        time,
        note: note.trim(),
      }),
    });

    if (!res.ok) throw new Error("Booking failed");

    trackEvent("inspection_booked", {
      listingId,
      listingTitle: listing.title,
      location:     listing.location,
      date,
      time,
    });

    setSubmitted(true);
  } catch (e) {
    console.error("Booking error:", e);
    setError("Something went wrong. Please try again.");
  } finally {
    setSubmitting(false);
  }
}

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  if (loading) {
    return (
      <main className="inspect-page">
        <div className="inspect-page__loading">
          <span className="inspect-page__spinner" />
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="inspect-page">
        <div className="inspect-page__not-found">
          <p>Listing not found.</p>
          <Link href="/listings">Back to listings</Link>
        </div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="inspect-page">
        <motion.div
          className="inspect-page__success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inspect-page__success-icon"><HiOutlineCheckCircle /></div>
          <h1>Inspection booked!</h1>
          <p>
            Your inspection for <strong>{listing.title}</strong> is scheduled
            for <strong>{date}</strong> at <strong>{time}</strong>.
          </p>
          <p className="inspect-page__success-note">
            The landlord has been notified and will confirm your visit shortly.
          </p>
          <div className="inspect-page__success-actions">
            <Link href={"/listings/" + listingId} className="inspect-page__back-btn">
              Back to listing
            </Link>
            <Link href="/my-inspections" className="inspect-page__browse-btn">
              View my inspections
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="inspect-page">
      <motion.div
        className="inspect-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href={"/listings/" + listingId} className="inspect-page__back">
          <HiOutlineArrowLeft /> Back to listing
        </Link>
        <p className="inspect-page__eyebrow">
          <HiOutlineClipboardDocumentCheck /> Book Inspection
        </p>
        <h1>Schedule a visit</h1>
        <p className="inspect-page__sub">
          Pick a date and time to visit this property in person.
        </p>
      </motion.div>

      <motion.div
        className="inspect-page__listing-preview"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.07 }}
      >
        <div className="inspect-page__listing-icon"><HiOutlineHomeModern /></div>
        <div className="inspect-page__listing-info">
          <p className="inspect-page__listing-title">{listing.title}</p>
          <p className="inspect-page__listing-location">
            <HiOutlineMapPin />{listing.location}
          </p>
        </div>
        <p className="inspect-page__listing-price">
          ₦{Number(listing.price).toLocaleString()}<span>/yr</span>
        </p>
      </motion.div>

      <motion.div
        className="inspect-page__form"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        <div className="inspect-page__section">
          <div className="inspect-page__section-label">
            <HiOutlineCalendarDays /> Preferred date
          </div>
          <div className="inspect-page__date-wrap">
            <HiOutlineCalendarDays className="inspect-page__input-icon" />
            <input
              type="date"
              className="inspect-page__date-input"
              value={date}
              min={minDateStr}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="inspect-page__section">
          <div className="inspect-page__section-label">
            <HiOutlineClock /> Preferred time
          </div>
          <div className="inspect-page__time-grid">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                className={"inspect-page__time-slot" + (time === slot ? " selected" : "")}
                onClick={() => setTime(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <div className="inspect-page__section">
          <div className="inspect-page__section-label">
            <HiOutlinePhone /> Your phone number
          </div>
          <div className="inspect-page__input-wrap">
            <HiOutlinePhone className="inspect-page__input-icon" />
            <input
              type="tel"
              className="inspect-page__input"
              placeholder="e.g. 08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="inspect-page__section">
          <div className="inspect-page__section-label">
            <HiOutlineChatBubbleBottomCenterText /> Note <em>(optional)</em>
          </div>
          <textarea
            className="inspect-page__textarea"
            rows={3}
            placeholder="e.g. I'm interested in the ground floor unit. Is parking available?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
          <p className="inspect-page__char-count">{note.length}/200</p>
        </div>

        {error && <p className="inspect-page__error">{error}</p>}

        <button
          className="inspect-page__submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Booking..." : "Confirm Inspection"}
        </button>

        <p className="inspect-page__disclaimer">
          The landlord will be notified immediately in-app and will confirm or suggest an alternate time.
        </p>
      </motion.div>
    </main>
  );
}