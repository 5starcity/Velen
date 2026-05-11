// app/reserve/[listingId]/page.js
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
  HiOutlinePhone,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { fetchListingById } from "@/lib/firestoreListings";
import {
  createReservation,
  fetchActiveReservationForListing,
  fetchStudentReservationForListing,
} from "@/lib/firestoreReservations";
import { createNotification } from "@/lib/firestoreNotifications";
import { trackEvent } from "@/lib/posthog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "@/styles/reserve.css";

export default function ReservePage() {
  const { listingId } = useParams();
  const router = useRouter();
  const { user, userRole } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [phone, setPhone] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reservationId, setReservationId] = useState(null);
  const [error, setError] = useState("");

  const [alreadyReserved, setAlreadyReserved] = useState(false);
  const [myExistingReservation, setMyExistingReservation] = useState(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (userRole && userRole === "landlord") { router.push("/listings"); return; }
  }, [user, userRole]);

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
    if (!listing || !user) return;
    async function checkReservations() {
      setChecking(true);
      try {
        const [listingReserved, studentReserved] = await Promise.all([
          fetchActiveReservationForListing(listingId),
          fetchStudentReservationForListing(listingId, user.uid),
        ]);
        if (listingReserved) setAlreadyReserved(true);
        if (studentReserved) setMyExistingReservation(studentReserved);
      } catch (e) {
        console.error("Reservation check error:", e);
      } finally {
        setChecking(false);
      }
    }
    checkReservations();
  }, [listing, user]);

  useEffect(() => {
    if (!user) return;
    async function loadPhone() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().phone) setPhone(snap.data().phone);
      } catch (e) {}
    }
    loadPhone();
  }, [user]);

  async function handleSubmit() {
    setError("");
    if (!moveInDate) { setError("Please select a preferred move-in date."); return; }
    if (!phone.trim()) { setError("Please enter your phone number."); return; }
    if (submitting) return;

    setSubmitting(true);
    try {
      const [listingReserved, studentReserved] = await Promise.all([
        fetchActiveReservationForListing(listingId),
        fetchStudentReservationForListing(listingId, user.uid),
      ]);

      if (listingReserved) {
        setAlreadyReserved(true);
        setError("Sorry, this room has already been reserved by someone else.");
        return;
      }

      if (studentReserved) {
        setMyExistingReservation(studentReserved);
        setError("You already have an active reservation for this listing.");
        return;
      }

      const id = await createReservation({
        listingId,
        listingTitle:  listing.title,
        listingPrice:  listing.price,
        landlordId:    listing.landlordId,
        landlordName:  listing.landlordName || "",
        studentId:     user.uid,
        studentName:   user.displayName || "Anonymous",
        studentPhone:  phone.trim(),
        moveInDate,
        note:          note.trim(),
      });

      setReservationId(id);

      try {
        await createNotification({
          userId:     listing.landlordId,
          type:       "reservation_request",
          title:      "New reservation request",
          message:    `${user.displayName || "Someone"} wants to reserve "${listing.title}" with a move-in date of ${moveInDate}`,
          listingId,
          senderId:   user.uid,
          senderName: user.displayName || "Someone",
        });
      } catch (e) {
        console.warn("Notification failed silently:", e);
      }

      trackEvent("reservation_created", {
        listingId,
        listingTitle: listing.title,
        moveInDate,
      });

      setSubmitted(true);
    } catch (e) {
      console.error("Reservation error:", e);
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
      <main className="reserve-page">
        <div className="reserve-page__loading"><span className="reserve-page__spinner" /></div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="reserve-page">
        <div className="reserve-page__not-found">
          <p>Listing not found.</p>
          <Link href="/listings">Back to listings</Link>
        </div>
      </main>
    );
  }

  if (checking) {
    return (
      <main className="reserve-page">
        <div className="reserve-page__loading"><span className="reserve-page__spinner" /></div>
      </main>
    );
  }

  if (alreadyReserved) {
    return (
      <main className="reserve-page">
        <motion.div
          className="reserve-page__blocked"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="reserve-page__blocked-icon">🔒</div>
          <h2>This room is already reserved</h2>
          <p>Someone else has already secured this property. Check out other available listings.</p>
          <Link href="/listings" className="reserve-page__btn">Browse Other Listings</Link>
        </motion.div>
      </main>
    );
  }

  if (myExistingReservation) {
    return (
      <main className="reserve-page">
        <motion.div
          className="reserve-page__blocked"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="reserve-page__blocked-icon">📋</div>
          <h2>You already reserved this room</h2>
          <p>
            Your reservation is currently{" "}
            <strong>{myExistingReservation.status}</strong>.
            Track it in your reservations page.
          </p>
          <div className="reserve-page__success-actions">
            <Link href="/my-reservations" className="reserve-page__btn">View My Reservations</Link>
            <Link href="/listings" className="reserve-page__btn reserve-page__btn--ghost">Browse Listings</Link>
          </div>
        </motion.div>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="reserve-page">
        <motion.div
          className="reserve-page__success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="reserve-page__success-icon"><HiOutlineCheckCircle /></div>
          <h1>Room Reserved!</h1>
          <p>
            Your reservation for <strong>{listing.title}</strong> has been submitted.
            Move-in date: <strong>{moveInDate}</strong>.
          </p>
          <p className="reserve-page__success-note">
            The landlord has been notified and will confirm shortly.
          </p>

          <div className="reserve-page__receipt">
            <div className="reserve-page__receipt-header">
              <HiOutlineShieldCheck />
              <span>Reservation Confirmation</span>
            </div>
            <div className="reserve-page__receipt-rows">
              <div className="reserve-page__receipt-row">
                <span>Tracking ID</span>
                <strong className="reserve-page__tracking-id">
                  VLN-{reservationId?.slice(0, 8).toUpperCase()}
                </strong>
              </div>
              <div className="reserve-page__receipt-row">
                <span>Property</span>
                <strong>{listing.title}</strong>
              </div>
              <div className="reserve-page__receipt-row">
                <span>Location</span>
                <strong>{listing.location}</strong>
              </div>
              <div className="reserve-page__receipt-row">
                <span>Annual Rent</span>
                <strong>₦{Number(listing.price).toLocaleString()}</strong>
              </div>
              <div className="reserve-page__receipt-row">
                <span>Move-in Date</span>
                <strong>{moveInDate}</strong>
              </div>
              <div className="reserve-page__receipt-row">
                <span>Landlord</span>
                <strong>{listing.landlordName || "—"}</strong>
              </div>
              <div className="reserve-page__receipt-row">
                <span>Status</span>
                <strong className="reserve-page__status-pending">Pending confirmation</strong>
              </div>
              <div className="reserve-page__receipt-row">
                <span>Reservation Fee</span>
                <strong className="reserve-page__status-free">Free (Early Access)</strong>
              </div>
            </div>
          </div>

          <div className="reserve-page__success-actions">
            <Link href="/my-reservations" className="reserve-page__btn">View my reservations</Link>
            <Link href={"/listings/" + listingId} className="reserve-page__btn reserve-page__btn--ghost">
              Back to listing
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="reserve-page">
      <motion.div
        className="reserve-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href={"/listings/" + listingId} className="reserve-page__back">
          <HiOutlineArrowLeft /> Back to listing
        </Link>
        <p className="reserve-page__eyebrow"><HiOutlineShieldCheck /> Reserve Room</p>
        <h1>Reserve this room</h1>
        <p className="reserve-page__sub">
          Secure your interest in this property. The landlord will confirm your reservation shortly.
        </p>
      </motion.div>

      <motion.div
        className="reserve-page__listing-preview"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.07 }}
      >
        <div className="reserve-page__listing-icon"><HiOutlineHomeModern /></div>
        <div className="reserve-page__listing-info">
          <p className="reserve-page__listing-title">{listing.title}</p>
          <p className="reserve-page__listing-location"><HiOutlineMapPin />{listing.location}</p>
        </div>
        <p className="reserve-page__listing-price">
          ₦{Number(listing.price).toLocaleString()}<span>/yr</span>
        </p>
      </motion.div>

      <motion.div
        className="reserve-page__form"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
      >
        <div className="reserve-page__section">
          <div className="reserve-page__section-label">
            <HiOutlineCalendarDays /> Preferred move-in date
          </div>
          <div className="reserve-page__input-wrap">
            <HiOutlineCalendarDays className="reserve-page__input-icon" />
            <input
              type="date"
              className="reserve-page__input"
              value={moveInDate}
              min={minDateStr}
              onChange={(e) => setMoveInDate(e.target.value)}
            />
          </div>
        </div>

        <div className="reserve-page__section">
          <div className="reserve-page__section-label">
            <HiOutlinePhone /> Your phone number
          </div>
          <div className="reserve-page__input-wrap">
            <HiOutlinePhone className="reserve-page__input-icon" />
            <input
              type="tel"
              className="reserve-page__input"
              placeholder="e.g. 08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="reserve-page__section">
          <div className="reserve-page__section-label">
            <HiOutlineChatBubbleBottomCenterText /> Note <em>(optional)</em>
          </div>
          <textarea
            className="reserve-page__textarea"
            rows={3}
            placeholder="e.g. I'm a 300L student at UniPort. I'd like to move in as soon as possible."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
          />
          <p className="reserve-page__char-count">{note.length}/200</p>
        </div>

        <div className="reserve-page__fee-notice">
          <HiOutlineBanknotes />
          <div>
            <p className="reserve-page__fee-title">Reservation Fee</p>
            <p className="reserve-page__fee-sub">
              Free during Early Access. A small fee may apply in the future.
            </p>
          </div>
          <span className="reserve-page__fee-badge">Free</span>
        </div>

        {error && <p className="reserve-page__error">{error}</p>}

        <button
          className="reserve-page__submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Reserving..." : "Confirm Reservation"}
        </button>

        <p className="reserve-page__disclaimer">
          The landlord will be notified immediately and will confirm or decline your reservation.
        </p>
      </motion.div>
    </main>
  );
}