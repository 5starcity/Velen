// app/transactions/[reference]/ReceiptClient.jsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineHomeModern,
  HiOutlineBanknotes,
  HiOutlineArrowLeft,
  HiOutlineReceiptPercent,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import "@/styles/payment.css";

function StatusBadge({ status }) {
  if (status === "refunded")  return <span className="tx-badge tx-badge--refunded">Refunded</span>;
  if (status === "on_hold")   return <span className="tx-badge tx-badge--disputed">On Hold</span>;
  if (status === "completed") return <span className="tx-badge tx-badge--released">Completed</span>;
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

  const isCompleted = tx.status === "completed";
  const isRefunded  = tx.status === "refunded";
  const isOnHold    = tx.status === "on_hold";

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
          <div className={"receipt__header-icon " + (isRefunded ? "receipt__header-icon--refunded" : isOnHold ? "receipt__header-icon--disputed" : "receipt__header-icon--success")}>
            {isOnHold    ? <HiOutlineExclamationTriangle /> :
             isRefunded  ? <HiOutlineBanknotes /> :
                           <HiOutlineCheckCircle />}
          </div>
          <h1>
            {isOnHold   ? "Payment On Hold" :
             isRefunded ? "Payment Refunded" :
                          "Payment Complete"}
          </h1>
          <p className="receipt__header-sub">
            {isCompleted ? "Funds have been sent to the landlord." :
             isRefunded  ? "This payment has been refunded." :
             isOnHold    ? "This payment is under review by our support team." : ""}
          </p>
        </div>

        {/* Status banner */}
        <div className={"receipt__status-banner " + (isOnHold ? "receipt__status-banner--disputed" : isRefunded ? "receipt__status-banner--refunded" : "receipt__status-banner--released")}>
          <HiOutlineShieldCheck />
          <div>
            <p className="receipt__status-title">
              {isCompleted ? "Payment sent to landlord" :
               isRefunded  ? "Refund processed" :
                             "Payment under review"}
            </p>
            {isCompleted && tx.completedAt && (
              <p className="receipt__status-sub">Completed on {formatDate(tx.completedAt)}</p>
            )}
          </div>
          <StatusBadge status={tx.status} />
        </div>

        {/* Main receipt card */}
        <div className="receipt__card">
          <div className="receipt__card-header">
            <HiOutlineReceiptPercent />
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
            <div className="receipt__row">
              <span>Status</span>
              <StatusBadge status={tx.status} />
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
              <span>Rezidence Service Fee (5%)</span>
              <strong>₦{Number(tx.serviceFee).toLocaleString()}</strong>
            </div>
            <div className="receipt__row receipt__row--total">
              <span>Total Charged</span>
              <strong>₦{Number(tx.totalCharged).toLocaleString()}</strong>
            </div>
            <div className="receipt__row">
              <span>Landlord Received</span>
              <strong>₦{Number(tx.landlordPayout || tx.amount).toLocaleString()}</strong>
            </div>
          </div>

          {/* Trust footer */}
          <div className="receipt__trust-footer">
            <span><HiOutlineShieldCheck /> Secured by Paystack</span>
            <span><HiOutlineCheckCircle /> Rezidence verified</span>
            <span><HiOutlineReceiptPercent /> Instant receipt</span>
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

        {/* Support prompt for on_hold */}
        {isOnHold && (
          <div className="receipt__dispute-prompt">
            <HiOutlineExclamationTriangle />
            <div>
              <p className="receipt__dispute-title">Payment under review</p>
              <p className="receipt__dispute-sub">
                Our support team is reviewing this payment. Contact us if you need urgent assistance.
              </p>
              <div className="pay-page__support-links" style={{ marginTop: 8 }}>
                <a href="https://wa.me/2349015117668" target="_blank" rel="noreferrer" className="pay-page__support-btn">
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