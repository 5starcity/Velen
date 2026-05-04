// app/transactions/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBanknotes,
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineExclamationTriangle,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  fetchTransactionsByStudent,
  fetchTransactionsByLandlord,
} from "@/lib/firestoreTransactions";
import { createDispute } from "@/lib/firestoreDisputes";
import { PAYMENT_CONFIG } from "@/lib/paymentConfig";
import "@/styles/payment.css";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

function StatusBadge({ status, escrowStatus }) {
  if (status === "refunded")  return <span className="tx-badge tx-badge--refunded">Refunded</span>;
  if (status === "failed")    return <span className="tx-badge tx-badge--failed">Failed</span>;
  if (escrowStatus === "disputed") return <span className="tx-badge tx-badge--disputed">Disputed</span>;
  if (escrowStatus === "released") return <span className="tx-badge tx-badge--released">Released</span>;
  if (escrowStatus === "holding")  return <span className="tx-badge tx-badge--holding">In Escrow</span>;
  return <span className="tx-badge tx-badge--success">Success</span>;
}

export default function TransactionsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("all");
  const [disputeId, setDisputeId]       = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDesc, setDisputeDesc]   = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeSuccess, setDisputeSuccess]       = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || !userRole) return;
    async function load() {
      try {
        const data = userRole === "landlord"
          ? await fetchTransactionsByLandlord(user.uid)
          : await fetchTransactionsByStudent(user.uid);
        setTransactions(data);
      } catch (e) {
        console.error("Failed to load transactions:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, userRole]);

  async function handleRaiseDispute(tx) {
    if (!disputeReason.trim() || !disputeDesc.trim()) return;
    setSubmittingDispute(true);
    try {
      await createDispute({
        transactionId: tx.id,
        listingId:     tx.listingId,
        listingTitle:  tx.listingTitle,
        raisedBy:      user.uid,
        raisedByName:  user.displayName || "Anonymous",
        raisedByRole:  userRole,
        againstId:     userRole === "student" ? tx.landlordId : tx.studentId,
        reason:        disputeReason,
        description:   disputeDesc,
      });
      setTransactions((prev) => prev.map((t) =>
        t.id === tx.id ? { ...t, escrowStatus: "disputed" } : t
      ));
      setDisputeSuccess(true);
      setDisputeId(null);
      setDisputeReason("");
      setDisputeDesc("");
    } catch (e) {
      console.error("Dispute error:", e);
    } finally {
      setSubmittingDispute(false);
    }
  }

  const filtered = transactions.filter((t) => {
    if (filter === "all")      return true;
    if (filter === "escrow")   return t.escrowStatus === "holding";
    if (filter === "released") return t.escrowStatus === "released";
    if (filter === "disputed") return t.escrowStatus === "disputed";
    if (filter === "refunded") return t.status === "refunded";
    return true;
  });

  function formatDate(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatEscrowRelease(ts) {
    if (!ts) return null;
    const d = new Date(ts);
    const now = new Date();
    const diffHrs = Math.max(0, Math.round((d - now) / (1000 * 60 * 60)));
    if (diffHrs === 0) return "Releasing soon";
    return `Releases in ~${diffHrs}hrs`;
  }

  if (authLoading || loading) {
    return (
      <main className="pay-page">
        <div className="pay-page__loading"><span className="pay-page__spinner" /></div>
      </main>
    );
  }

  return (
    <main className="transactions-page">
      <motion.div
        className="transactions-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/" className="pay-page__back">
          <HiOutlineArrowLeft /> Back
        </Link>
        <p className="pay-page__eyebrow"><HiOutlineBanknotes /> Transactions</p>
        <h1>Payment History</h1>
        <p className="pay-page__sub">Track your rent payments, escrow status and disputes.</p>
      </motion.div>

      {/* Filter tabs */}
      <div className="transactions-page__tabs">
        {["all", "escrow", "released", "disputed", "refunded"].map((tab) => (
          <button
            key={tab}
            className={"transactions-page__tab" + (filter === tab ? " active" : "")}
            onClick={() => setFilter(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="transactions-page__tab-count">
              {tab === "all" ? transactions.length : transactions.filter((t) => {
                if (tab === "escrow")   return t.escrowStatus === "holding";
                if (tab === "released") return t.escrowStatus === "released";
                if (tab === "disputed") return t.escrowStatus === "disputed";
                if (tab === "refunded") return t.status === "refunded";
                return false;
              }).length}
            </span>
          </button>
        ))}
      </div>

      {disputeSuccess && (
        <motion.div
          className="transactions-page__dispute-success"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ✅ Dispute raised. Our team will review within 24 hours. Contact support on WhatsApp or call {PAYMENT_CONFIG.supportPhone}.
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <div className="transactions-page__empty">
          <HiOutlineBanknotes className="transactions-page__empty-icon" />
          <h2>{filter === "all" ? "No transactions yet" : "No " + filter + " transactions"}</h2>
          <p>{filter === "all" ? "Your rent payment history will appear here." : "Check another tab."}</p>
        </div>
      ) : (
        <motion.div
          className="transactions-page__list"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence>
            {filtered.map((tx) => (
              <motion.div
                key={tx.id}
                className="transaction-card"
                variants={fadeUp}
              >
                <div className="transaction-card__header">
                  <div className="transaction-card__icon">
                    <HiOutlineBanknotes />
                  </div>
                  <div className="transaction-card__info">
                    <p className="transaction-card__title">{tx.listingTitle}</p>
                    <p className="transaction-card__date">{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="transaction-card__right">
                    <p className="transaction-card__amount">
                      ₦{Number(tx.totalCharged || tx.amount || 0).toLocaleString()}
                    </p>
                    <StatusBadge status={tx.status} escrowStatus={tx.escrowStatus} />
                  </div>
                  <Link
                    href={"/listings/" + tx.listingId}
                    className="transaction-card__link"
                    target="_blank"
                  >
                    <HiOutlineArrowTopRightOnSquare />
                  </Link>
                </div>

                <div className="transaction-card__details">
                  <div className="transaction-card__detail">
                    <span>Rent</span>
                    <strong>₦{Number(tx.amount || 0).toLocaleString()}</strong>
                  </div>
                  <div className="transaction-card__detail">
                    <span>Service Fee</span>
                    <strong>₦{Number(tx.serviceFee || 0).toLocaleString()}</strong>
                  </div>
                  <div className="transaction-card__detail">
                    <span>Reference</span>
                    <strong className="transaction-card__ref">{tx.reference?.slice(0, 16)}...</strong>
                  </div>
                </div>

                {tx.escrowStatus === "holding" && tx.escrowReleaseAt && (
                  <div className="transaction-card__escrow-bar">
                    <HiOutlineClock />
                    <span>{formatEscrowRelease(tx.escrowReleaseAt)}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="transaction-card__actions">
                  {/* Student can raise dispute while in escrow */}
                  {userRole === "student" &&
                   tx.escrowStatus === "holding" &&
                   tx.status === "success" &&
                   disputeId !== tx.id && (
                    <button
                      className="transaction-card__dispute-btn"
                      onClick={() => setDisputeId(tx.id)}
                    >
                      <HiOutlineExclamationTriangle /> Raise Dispute
                    </button>
                  )}

                  {/* Landlord can also raise dispute */}
                  {userRole === "landlord" &&
                   tx.escrowStatus === "holding" &&
                   tx.status === "success" &&
                   disputeId !== tx.id && (
                    <button
                      className="transaction-card__dispute-btn"
                      onClick={() => setDisputeId(tx.id)}
                    >
                      <HiOutlineExclamationTriangle /> Raise Dispute
                    </button>
                  )}

                  {tx.escrowStatus === "released" && (
                    <span className="transaction-card__released-note">
                      <HiOutlineCheckCircle /> Funds released to landlord
                    </span>
                  )}

                  {tx.escrowStatus === "disputed" && (
                    <div className="transaction-card__disputed-note">
                      <HiOutlineExclamationTriangle />
                      <span>
                        Dispute under review. Contact support:{" "}
                        <a href={`https://wa.me/${PAYMENT_CONFIG.supportWhatsApp}`} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                        {" "}or call {PAYMENT_CONFIG.supportPhone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dispute form */}
                <AnimatePresence>
                  {disputeId === tx.id && (
                    <motion.div
                      className="transaction-card__dispute-form"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="transaction-card__dispute-title">
                        <HiOutlineExclamationTriangle /> Raise a dispute
                      </p>
                      <select
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        className="transaction-card__dispute-select"
                      >
                        <option value="">Select reason</option>
                        <option value="property_not_as_described">Property not as described</option>
                        <option value="landlord_unresponsive">Landlord unresponsive</option>
                        <option value="access_denied">Access to property denied</option>
                        <option value="payment_not_received">Payment not received</option>
                        <option value="double_charge">Double charged</option>
                        <option value="other">Other</option>
                      </select>
                      <textarea
                        value={disputeDesc}
                        onChange={(e) => setDisputeDesc(e.target.value)}
                        placeholder="Describe the issue in detail..."
                        rows={3}
                        maxLength={500}
                        className="transaction-card__dispute-textarea"
                      />
                      <div className="transaction-card__dispute-actions">
                        <button
                          className="transaction-card__dispute-cancel"
                          onClick={() => { setDisputeId(null); setDisputeReason(""); setDisputeDesc(""); }}
                        >
                          Cancel
                        </button>
                        <button
                          className="transaction-card__dispute-submit"
                          onClick={() => handleRaiseDispute(tx)}
                          disabled={submittingDispute || !disputeReason || !disputeDesc.trim()}
                        >
                          {submittingDispute ? "Submitting..." : "Submit Dispute"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Support footer */}
      <div className="transactions-page__support">
        <p>Need help with a payment?</p>
        <div className="pay-page__support-links">
          
            <a href={`https://wa.me/${PAYMENT_CONFIG.supportWhatsApp}`}
            target="_blank"
            rel="noreferrer"
            className="pay-page__support-btn"
          >
            WhatsApp Support
          </a>
          
           <a href={`tel:${PAYMENT_CONFIG.supportPhone}`}
            className="pay-page__support-btn pay-page__support-btn--ghost"
          >
            Call {PAYMENT_CONFIG.supportPhone}
          </a>
        </div>
      </div>
    </main>
  );
}