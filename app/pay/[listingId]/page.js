// app/pay/[listingId]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineHomeModern,
  HiOutlineMapPin,
  HiOutlineBanknotes,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { fetchListingById } from "@/lib/firestoreListings";
import { getLandlordPaystackSubaccount } from "@/lib/verification";
import { calculateTotal, PAYMENT_CONFIG } from "@/lib/paymentConfig";
import { trackEvent } from "@/lib/posthog";
import "@/styles/payment.css";

function generateIdempotencyKey(listingId, studentId) {
  return `rezidence_pay_${listingId}_${studentId}_${Date.now()}`;
}

// Load Paystack inline script once
function loadPaystackScript() {
  return new Promise((resolve) => {
    if (window.PaystackPop) { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export default function PayPage() {
  const { listingId } = useParams();
  const router = useRouter();
  const { user, userRole } = useAuth();

  const [listing, setListing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const [error, setError]       = useState("");
  const [subaccount, setSubaccount] = useState(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (userRole === "landlord") { router.push("/listings"); return; }
  }, [user, userRole]);

  useEffect(() => {
    async function load() {
      if (!listingId) return;
      try {
        const data = await fetchListingById(listingId);
        setListing(data);
        if (data?.landlordId) {
          const sub = await getLandlordPaystackSubaccount(data.landlordId);
          setSubaccount(sub);
        }
      } catch (e) {
        console.error("Failed to load listing:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listingId]);

  async function handlePay() {
    setError("");
    if (!user?.email)  { setError("Could not get your email. Please log out and back in."); return; }
    if (!listing)      { setError("Listing not found."); return; }
    if (paying)        return;

    setPaying(true);
    const idempotencyKey = generateIdempotencyKey(listingId, user.uid);
    const { total } = calculateTotal(Number(listing.price));

    try {
      // 1. Initialize transaction on server — get access_code back
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:              user.email,
          amount:             listing.price,
          listingId,
          listingTitle:       listing.title,
          studentId:          user.uid,
          studentName:        user.displayName || "Anonymous",
          landlordId:         listing.landlordId,
          paystackSubaccount: subaccount || "",
          idempotencyKey,
          type:               "rent",
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setPaying(false);
        return;
      }

      trackEvent("payment_initiated", {
        listingId,
        listingTitle: listing.title,
        amount:       listing.price,
      });

      // 2. Load Paystack inline script
      await loadPaystackScript();

      // 3. Open Paystack popup — stays inside the app
      const handler = window.PaystackPop.setup({
        key:         PAYMENT_CONFIG.paystackPublicKey,
        email:       user.email,
        amount:      total * 100,  // kobo — required even when using access_code
        access_code: data.access_code,
        ref:         data.reference,

        onSuccess(transaction) {
          // Redirect back to listing with success flag
          window.location.href = `/listings/${listingId}?payment=success&reference=${transaction.reference}`;
        },

        onClose() {
          // User closed popup without paying
          setPaying(false);
          setError("Payment cancelled. You were not charged.");
        },
      });

      handler.openIframe();
    } catch (e) {
      console.error("Payment error:", e);
      setError("Something went wrong. Please try again.");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <main className="pay-page">
        <div className="pay-page__loading"><span className="pay-page__spinner" /></div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="pay-page">
        <div className="pay-page__not-found">
          <p>Listing not found.</p>
          <Link href="/listings">Back to listings</Link>
        </div>
      </main>
    );
  }

  const { amount, fee, total } = calculateTotal(Number(listing.price));

  return (
    <main className="pay-page">
      <motion.div
        className="pay-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href={"/listings/" + listingId} className="pay-page__back">
          <HiOutlineArrowLeft /> Back to listing
        </Link>
        <p className="pay-page__eyebrow"><HiOutlineBanknotes /> Rent Payment</p>
        <h1>Pay your rent securely</h1>
      </motion.div>

      {/* Listing preview */}
      <motion.div
        className="pay-page__listing-preview"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.07 }}
      >
        <div className="pay-page__listing-icon"><HiOutlineHomeModern /></div>
        <div className="pay-page__listing-info">
          <p className="pay-page__listing-title">{listing.title}</p>
          <p className="pay-page__listing-location"><HiOutlineMapPin />{listing.location}</p>
        </div>
        <p className="pay-page__listing-price">
          ₦{Number(listing.price).toLocaleString()}<span>/yr</span>
        </p>
      </motion.div>

      {/* Breakdown */}
      <motion.div
        className="pay-page__breakdown"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <div className="pay-page__breakdown-header">
          <HiOutlineBanknotes />
          <span>Payment Breakdown</span>
        </div>
        <div className="pay-page__breakdown-rows">
          <div className="pay-page__breakdown-row">
            <span>Annual Rent</span>
            <strong>₦{amount.toLocaleString()}</strong>
          </div>
          <div className="pay-page__breakdown-row pay-page__breakdown-row--fee">
            <span>Rezidence Service Fee ({PAYMENT_CONFIG.serviceFeePercent}%)</span>
            <strong>₦{fee.toLocaleString()}</strong>
          </div>
          <div className="pay-page__breakdown-row pay-page__breakdown-row--total">
            <span>Total</span>
            <strong>₦{total.toLocaleString()}</strong>
          </div>
        </div>
      </motion.div>

      {!subaccount && (
        <div className="pay-page__warning">
          <HiOutlineExclamationTriangle />
          <p>
            This landlord hasn't set up their payment account yet.
            Contact them directly before paying.
          </p>
        </div>
      )}

      {error && <p className="pay-page__error">{error}</p>}

      <p className="pay-page__final-note">
        You will receive a digital receipt immediately after payment.
      </p>

      <button
        className="pay-page__submit"
        onClick={handlePay}
        disabled={paying || !subaccount}
      >
        {paying
          ? "Opening payment..."
          : `Pay ₦${total.toLocaleString()} securely`}
      </button>

      <p className="pay-page__disclaimer">
        By paying, you agree to Rezidence's payment terms. Your card details are
        handled securely by Paystack and never stored by Rezidence.
      </p>

      <div className="pay-page__support">
        <p>Need help?</p>
        <div className="pay-page__support-links">
          <a
            href={`https://wa.me/${PAYMENT_CONFIG.supportWhatsApp}?text=Hi, I need help with a payment on Rezidence for listing: ${listing.title}`}
            target="_blank"
            rel="noreferrer"
            className="pay-page__support-btn"
          >
            WhatsApp Support
          </a>
          <a
            href={`tel:${PAYMENT_CONFIG.supportPhone}`}
            className="pay-page__support-btn pay-page__support-btn--ghost"
          >
            Call {PAYMENT_CONFIG.supportPhone}
          </a>
        </div>
      </div>
    </main>
  );
}