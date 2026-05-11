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
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
  HiOutlineLockClosed,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { fetchListingById } from "@/lib/firestoreListings";
import { getLandlordPaystackSubaccount } from "@/lib/verification";
import { calculateTotal, PAYMENT_CONFIG } from "@/lib/paymentConfig";
import { trackEvent } from "@/lib/posthog";
import "@/styles/payment.css";

function generateIdempotencyKey(listingId, studentId) {
  return `velen_pay_${listingId}_${studentId}_${Date.now()}`;
}

export default function PayPage() {
  const { listingId } = useParams();
  const router        = useRouter();
  const { user, userRole } = useAuth();

  const [listing, setListing]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [paying, setPaying]       = useState(false);
  const [error, setError]         = useState("");
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
        // Get landlord's Paystack subaccount
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
    if (!user?.email) { setError("Could not get your email. Please log out and back in."); return; }
    if (!listing)     { setError("Listing not found."); return; }
    if (paying)       return; // prevent double click

    setPaying(true);
    const idempotencyKey = generateIdempotencyKey(listingId, user.uid);

    try {
      const res = await fetch("/api/paystack/initialize", {
        method:  "POST",
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
        return;
      }

      trackEvent("payment_initiated", {
        listingId,
        listingTitle: listing.title,
        amount:       listing.price,
      });

      // Redirect to Paystack checkout
      window.location.href = data.authorization_url;
    } catch (e) {
      console.error("Payment error:", e);
      setError("Something went wrong. Please try again.");
    } finally {
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
        <p className="pay-page__sub">
          Your payment is held in escrow for 48 hours before being released to the landlord.
        </p>
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
            <span>Velen Service Fee ({PAYMENT_CONFIG.serviceFeePercent}%)</span>
            <strong>₦{fee.toLocaleString()}</strong>
          </div>
          <div className="pay-page__breakdown-row pay-page__breakdown-row--total">
            <span>Total</span>
            <strong>₦{total.toLocaleString()}</strong>
          </div>
        </div>
      </motion.div>

      {/* Escrow notice */}
      <motion.div
        className="pay-page__escrow-notice"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.14 }}
      >
        <HiOutlineClock />
        <div>
          <p className="pay-page__escrow-title">48-hour escrow protection</p>
          <p className="pay-page__escrow-sub">
            Your payment is held securely for 48 hours. If you have any issues after moving in,
            raise a dispute before the timer expires and your funds will be frozen until resolved.
          </p>
        </div>
      </motion.div>

      {/* Security badges */}
      <motion.div
        className="pay-page__security"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
      >
        <span><HiOutlineLockClosed /> Secured by Paystack</span>
        <span><HiOutlineShieldCheck /> 48hr escrow protection</span>
        <span><HiOutlineExclamationTriangle /> Dispute protection</span>
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
      {/* Trust signals */}
<motion.div
  className="pay-page__trust-signals"
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.22 }}
>
  <div className="pay-page__trust-item">
    <HiOutlineShieldCheck />
    <div>
      <p className="pay-page__trust-title">Your money is protected</p>
      <p className="pay-page__trust-sub">
        Funds are held in escrow — not sent directly to the landlord until you've moved in safely.
      </p>
    </div>
  </div>

  <div className="pay-page__trust-item">
    <HiOutlineClock />
    <div>
      <p className="pay-page__trust-title">48-hour dispute window</p>
      <p className="pay-page__trust-sub">
        If anything goes wrong, raise a dispute before the timer expires and your money is frozen.
      </p>
    </div>
  </div>

  <div className="pay-page__trust-item">
    <HiOutlineExclamationTriangle />
    <div>
      <p className="pay-page__trust-title">Human support available</p>
      <p className="pay-page__trust-sub">
        Real people on WhatsApp and phone. We hold both parties accountable.
      </p>
    </div>
  </div>
</motion.div>

<p className="pay-page__final-note">
  You will receive a digital receipt immediately after payment.
</p>
      <button
        className="pay-page__submit"
        onClick={handlePay}
        disabled={paying || !subaccount}
      >
        {paying
          ? "Redirecting to payment..."
          : `Pay ₦${total.toLocaleString()} securely`
        }
      </button>

      <p className="pay-page__disclaimer">
        By paying, you agree to Velen's payment terms. Your card details are handled
        securely by Paystack and never stored by Velen.
      </p>

      {/* Support */}
      <div className="pay-page__support">
        <p>Need help?</p>
        <div className="pay-page__support-links">
          
            <a href={`https://wa.me/${PAYMENT_CONFIG.supportWhatsApp}?text=Hi, I need help with a payment on Velen for listing: ${listing.title}`}
            target="_blank"
            rel="noreferrer"
            className="pay-page__support-btn"
          >
            WhatsApp Support
          </a>
          <a href={`tel:${PAYMENT_CONFIG.supportPhone}`} className="pay-page__support-btn pay-page__support-btn--ghost">
            Call {PAYMENT_CONFIG.supportPhone}
          </a>
        </div>
      </div>
    </main>
  );
}