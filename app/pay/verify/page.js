// app/pay/verify/page.js
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/posthog";
import "@/styles/payment.css";

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const { user }     = useAuth();

  const [status, setStatus]     = useState("verifying"); // verifying | success | failed
  const [txData, setTxData]     = useState(null);
  const [error, setError]       = useState("");

  const reference = searchParams.get("reference") || searchParams.get("ref");

  useEffect(() => {
    if (!reference) { setStatus("failed"); setError("No payment reference found."); return; }

    async function verify() {
      try {
        const res  = await fetch(`/api/paystack/verify?reference=${reference}`);
        const data = await res.json();

        if (data.success) {
          setTxData(data);
          setStatus("success");
          trackEvent("payment_success", {
            reference,
            amount:   data.amount,
            listingId: data.metadata?.listingId,
          });
        } else {
          setStatus("failed");
          setError("Payment was not completed. No charge was made.");
          trackEvent("payment_failed", { reference });
        }
      } catch (e) {
        console.error("Verify error:", e);
        setStatus("failed");
        setError("Could not verify payment. Contact support if you were charged.");
      }
    }

    verify();
  }, [reference]);

  if (status === "verifying") {
    return (
      <main className="pay-page">
        <div className="pay-page__loading">
          <span className="pay-page__spinner" />
          <p style={{ color: "#64748b", marginTop: 16 }}>Verifying your payment...</p>
        </div>
      </main>
    );
  }

  if (status === "success") {
    return (
      <main className="pay-page">
        <motion.div
          className="pay-page__result"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="pay-page__result-icon pay-page__result-icon--success">
            <HiOutlineCheckCircle />
          </div>
          <h1>Payment successful!</h1>
          <p>
            Your rent payment of{" "}
            <strong>₦{Number(txData?.amount || 0).toLocaleString()}</strong>{" "}
            has been received and is held in escrow.
          </p>
          <p className="pay-page__result-note">
            Funds will be released to the landlord in 48 hours.
            If you have any issues, raise a dispute before then.
          </p>

          {/* Mini receipt */}
          <div className="pay-page__mini-receipt">
            <div className="pay-page__mini-receipt-header">
              <HiOutlineShieldCheck />
              <span>Payment Receipt</span>
            </div>
            <div className="pay-page__mini-receipt-row">
              <span>Reference</span>
              <strong className="pay-page__ref">{reference}</strong>
            </div>
            <div className="pay-page__mini-receipt-row">
              <span>Amount Paid</span>
              <strong>₦{Number(txData?.amount || 0).toLocaleString()}</strong>
            </div>
            <div className="pay-page__mini-receipt-row">
              <span>Property</span>
              <strong>{txData?.metadata?.listingTitle || "—"}</strong>
            </div>
            <div className="pay-page__mini-receipt-row">
              <span>Escrow Status</span>
              <strong className="pay-page__escrow-active">Holding (48hrs)</strong>
            </div>
          </div>

          <div className="pay-page__result-actions">
            <Link href="/transactions" className="pay-page__btn">
              View Transaction History
            </Link>
            <Link
              href={"/listings/" + (txData?.metadata?.listingId || "")}
              className="pay-page__btn pay-page__btn--ghost"
            >
              Back to Listing
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="pay-page">
      <motion.div
        className="pay-page__result"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="pay-page__result-icon pay-page__result-icon--failed">
          <HiOutlineXCircle />
        </div>
        <h1>Payment failed</h1>
        <p>{error || "Something went wrong with your payment."}</p>
        <p className="pay-page__result-note">
          No charge was made. If you believe this is wrong, contact our support team.
        </p>
        <div className="pay-page__result-actions">
          <Link href="/listings" className="pay-page__btn">Browse Listings</Link>
          
           <a href="https://wa.me/2349015117668"
            target="_blank"
            rel="noreferrer"
            className="pay-page__btn pay-page__btn--ghost"
          >
            Contact Support
          </a>
        </div>
      </motion.div>
    </main>
  );
}