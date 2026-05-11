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

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === tx.id ? { ...t, escrowStatus: "disputed" } : t
        )
      );

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
        <div className="pay-page__loading">
          <span className="pay-page__spinner" />
        </div>
      </main>
    );
  }

  return (
    <main className="transactions-page">
      <motion.div
        className="transactions-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/" className="pay-page__back">
          <HiOutlineArrowLeft /> Back
        </Link>

        <p className="pay-page__eyebrow">
          <HiOutlineBanknotes /> Transactions
        </p>

        <h1>Payment History</h1>
        <p className="pay-page__sub">
          Track your rent payments, escrow status and disputes.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="transactions-page__tabs">
        {["all", "escrow", "released", "disputed", "refunded"].map((tab) => (
          <button
            key={tab}
            className={"transactions-page__tab" + (filter === tab ? " active" : "")}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="transactions-page__empty">
          <h2>No transactions</h2>
        </div>
      ) : (
        <motion.div className="transactions-page__list" variants={stagger} initial="hidden" animate="show">
          {filtered.map((tx) => (
            <motion.div key={tx.id} className="transaction-card" variants={fadeUp}>
              
              {/* HEADER */}
              <div className="transaction-card__header">
                <div>
                  <p>{tx.listingTitle}</p>
                  <p>{formatDate(tx.createdAt)}</p>
                </div>

                <div>
                  <p>₦{Number(tx.totalCharged || tx.amount || 0).toLocaleString()}</p>
                  <StatusBadge status={tx.status} escrowStatus={tx.escrowStatus} />
                </div>

                {/* ✅ RECEIPT LINK */}
                <Link
                  href={"/transactions/" + (tx.reference || tx.id)}
                  className="transaction-card__link"
                  title="View receipt"
                >
                  <HiOutlineArrowTopRightOnSquare />
                </Link>
              </div>

              {/* DETAILS */}
              <div className="transaction-card__details">
                <p>Rent: ₦{Number(tx.amount || 0).toLocaleString()}</p>
                <p>Fee: ₦{Number(tx.serviceFee || 0).toLocaleString()}</p>
                <p>Ref: {tx.reference?.slice(0, 12)}...</p>
              </div>

              {/* ESCROW */}
              {tx.escrowStatus === "holding" && (
                <div className="transaction-card__escrow-bar">
                  <HiOutlineClock />
                  <span>{formatEscrowRelease(tx.escrowReleaseAt)}</span>
                </div>
              )}

            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}