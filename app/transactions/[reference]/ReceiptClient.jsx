// app/transactions/[reference]/ReceiptClient.jsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineHomeModern,
  HiOutlineBanknotes,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import "@/styles/payment.css";

function EscrowBadge({ escrowStatus, status }) {
  if (status === "refunded" || escrowStatus === "refunded")
    return <span className="tx-badge tx-badge--refunded">Refunded</span>;
  if (status === "on_hold" || escrowStatus === "disputed")
    return <span className="tx-badge tx-badge--disputed">Disputed — Under Review</span>;
  if (escrowStatus === "released" || status === "completed")
    return <span className="tx-badge tx-badge--released">Released to Landlord</span>;
  if (escrowStatus === "holding")
    return <span className="tx-badge tx-badge--holding">In Escrow</span>;
  return <span className="tx-badge tx-badge--success">{status}</span>;
}

export default function ReceiptClient({ tx }) {
  function formatDate(ts) {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleDateString("en-NG", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return "—"; }
  }

  function formatEscrowRelease(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    const now = new Date();
    const diff = d - now;
    if (diff <= 0) return "Releasing soon";
    const hrs = Math.round(diff / (1000 * 60 * 60));
    return `~${hrs} hours remaining`;
  }

  const isHolding = tx.escrowStatus === "holding";
  const isReleased = tx.escrowStatus === "released" || tx.status === "completed";
  const isDisputed = tx.escrowStatus === "disputed" || tx.status === "on_hold";
  const isRefunded = tx.status === "refunded";

  return (
    <main className="pay-page">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/transactions" className="pay-page__back">
          <HiOutlineArrowLeft /> Back to transactions
        </Link>

        {/* Header */}
        <div className="receipt__header">
          <div className={"receipt__header-icon " + (isRefunded ? "receipt__header-icon--refunded" : isDisputed ? "receipt__header-icon--disputed" : "receipt__header-icon--success")}>
            {isDisputed ? <HiOutlineExclamationTriangle /> :
              isRefunded ? <HiOutlineBanknotes /> :
                isReleased ? <HiOutlineCheckCircle /> :
                  <HiOutlineClock />}
          </div>
          <h1>
            {isDisputed ? "Payment Disputed" :
              isRefunded ? "Payment Refunded" :
                isReleased ? "Payment Complete" :
                  "Payment Receipt"}
          </h1>
          <p className="receipt__header-sub">
            {isHolding ? "Your payment is secured in escrow. It will be released to the landlord in 48 hours if no dispute is raised." :
              isReleased ? "Funds have been released to the landlord." :
                isDisputed ? "This payment is under review by our support team." :
                  isRefunded ? "This payment has been refunded." : ""}
          </p>
        </div>

        {/* Status banner */}
        <div className={"receipt__status-banner " + (isDisputed ? "receipt__status-banner--disputed" : isReleased ? "receipt__status-banner--released" : isRefunded ? "receipt__status-banner--refunded" : "receipt__status-banner--holding")}>
          <HiOutlineShieldCheck />
          <div>
            <p className="receipt__status-title">
              {isHolding ? "Payment secured in escrow" :
                isReleased ? "Funds released to landlord" :
                  isDisputed ? "Escrow frozen — dispute in review" :
                    isRefunded ? "Refund processed" : "Payment secured"}
            </p>
            {isHolding && tx.escrowReleaseAt && (
              <p className="receipt__status-sub">
                {formatEscrowRelease(tx.escrowReleaseAt)}
              </p>
            )}
            {isReleased && tx.releasedAt && (
              <p className="receipt__status-sub">Released on {formatDate(tx.releasedAt)}</p>
            )}
          </div>
          <EscrowBadge escrowStatus={tx.escrowStatus} status={tx.status} />
        </div>

        {/* Main receipt */}
        <div className="receipt__card">
          <div className="receipt__card-header">
            <HiOutlineShieldCheck />
            <span>Official Payment Receipt</span>
            <span className="receipt__card-header-id">#{tx.reference?.slice(-8).toUpperCase()}</span>
          </div>

          <div className="receipt__rows">
            <div className="receipt__section-label">Transaction Details</div>

            <div className="receipt__row">
              <span>Transaction ID</span>
              <strong className="receipt__monospace">{tx.reference}</strong>
            </div>
            <div className="receipt__row">
              <span>Date Paid</span>
              <strong>{formatDate(tx.createdAt)}</strong>
            </div>
            <div className="receipt__row">
              <span>Payment Type</span>
              <strong>{tx.type === "rent" ? "Rent Payment" : "Reservation Fee"}</strong>
            </div>

            <div className="receipt__section-label">Property</div>

            <div className="receipt__row">
              <span>Listing</span>
              <strong>
                {tx.listingId ? (
                  <Link href={"/listings/" + tx.listingId} className="receipt__link">
                    {tx.listingTitle} <HiOutlineArrowTopRightOnSquare />
                  </Link>
                ) : tx.listingTitle}
              </strong>
            </div>
            <div className="receipt__row">
              <span>Landlord</span>
              <strong>{tx.landlordName}</strong>
            </div>
            <div className="receipt__row">
              <span>Tenant</span>
              <strong>{tx.studentName}</strong>
            </div>

            <div className="receipt__section-label">Payment Breakdown</div>

            <div className="receipt__row">
              <span>Annual Rent</span>
              <strong>₦{Number(tx.amount).toLocaleString()}</strong>
            </div>
            <div className="receipt__row receipt__row--fee">
              <span>rezidence Service Fee (5%)</span>
              <strong>₦{Number(tx.serviceFee).toLocaleString()}</strong>
            </div>
            <div className="receipt__row receipt__row--total">
              <span>Total Charged</span>
              <strong>₦{Number(tx.totalCharged).toLocaleString()}</strong>
            </div>

            <div className="receipt__section-label">Escrow Status</div>

            <div className="receipt__row">
              <span>Escrow Status</span>
              <EscrowBadge escrowStatus={tx.escrowStatus} status={tx.status} />
            </div>
            {isHolding && tx.escrowReleaseAt && (
              <div className="receipt__row">
                <span>Scheduled Release</span>
                <strong>{formatDate(tx.escrowReleaseAt)}</strong>
              </div>
            )}
            {isReleased && tx.releasedAt && (
              <div className="receipt__row">
                <span>Released On</span>
                <strong>{formatDate(tx.releasedAt)}</strong>
              </div>
            )}
          </div>

          {/* Trust footer */}
          <div className="receipt__trust-footer">
            <span><HiOutlineShieldCheck /> Secured by Paystack</span>
            <span><HiOutlineClock /> 48hr escrow protection</span>
            <span><HiOutlineCheckCircle /> rezidence verified</span>
          </div>
        </div>

        {/* Actions */}
        <div className="receipt__actions">
          {tx.listingId && (
            <Link href={"/listings/" + tx.listingId} className="pay-page__btn pay-page__btn--ghost">
              <HiOutlineHomeModern /> View Listing
            </Link>
          )}
          <Link href="/transactions" className="pay-page__btn pay-page__btn--ghost">
            All Transactions
          </Link>
        </div>

        {/* Dispute prompt */}
        {isHolding && (
          <div className="receipt__dispute-prompt">
            <HiOutlineExclamationTriangle />
            <div>
              <p className="receipt__dispute-title">Have an issue?</p>
              <p className="receipt__dispute-sub">
                Raise a dispute before funds are released. Once released, refunds require manual review.
              </p>
              <div className="pay-page__support-links" style={{ marginTop: 8 }}>

                <a href="https://wa.me/2349015117668"
                  target="_blank"
                  rel="noreferrer"
                  className="pay-page__support-btn"
                >
                  WhatsApp Support
                </a>
                <a href="tel:09015117668" className="pay-page__support-btn pay-page__support-btn--ghost">
                  Call Support
                </a>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </main>
  );
}