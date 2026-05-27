"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiOutlineBanknotes,
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowUturnLeft,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeTransactionsByStudent,
  subscribeTransactionsByLandlord,
} from "@/lib/firestoreTransactions";
import { createDispute } from "@/lib/firestoreDisputes";
import "@/styles/payment.css";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

function StatusBadge({ status, escrowStatus }) {
  if (status === "refunded")       return <span className="tx-badge tx-badge--refunded">Refunded</span>;
  if (status === "failed")         return <span className="tx-badge tx-badge--failed">Failed</span>;
  if (escrowStatus === "disputed") return <span className="tx-badge tx-badge--disputed">Disputed</span>;
  if (escrowStatus === "released") return <span className="tx-badge tx-badge--released">Released</span>;
  if (escrowStatus === "holding")  return <span className="tx-badge tx-badge--escrow">In Escrow</span>;
  return <span className="tx-badge tx-badge--success">Success</span>;
}

function StatusBar({ status, escrowStatus, releaseLabel }) {
  if (status === "refunded")
    return (
      <div className="tx-card__statusbar tx-card__statusbar--refunded">
        <HiOutlineArrowUturnLeft />
        <span>Payment refunded</span>
      </div>
    );
  if (escrowStatus === "disputed")
    return (
      <div className="tx-card__statusbar tx-card__statusbar--disputed">
        <HiOutlineExclamationTriangle />
        <span>Dispute raised — under review</span>
      </div>
    );
  if (escrowStatus === "released")
    return (
      <div className="tx-card__statusbar tx-card__statusbar--released">
        <HiOutlineCheckCircle />
        <span>Payment released to landlord</span>
      </div>
    );
  if (escrowStatus === "holding")
    return (
      <div className="tx-card__statusbar tx-card__statusbar--escrow">
        <HiOutlineClock />
        <span>{releaseLabel}</span>
      </div>
    );
  return null;
}

export default function TransactionsPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || !userRole) return;
  
    setLoading(true);
  
    const unsub =
      userRole === "landlord"
        ? subscribeTransactionsByLandlord(user.uid, (data) => {
            setTransactions(data);
            setLoading(false);
          })
        : subscribeTransactionsByStudent(user.uid, (data) => {
            setTransactions(data);
            setLoading(false);
          });
  
    return () => unsub(); // cleanup on unmount
  }, [user, userRole]);

  const filtered = transactions.filter((t) => {
    if (filter === "all")      return true;
    if (filter === "escrow")   return t.escrowStatus === "holding";
    if (filter === "released") return t.escrowStatus === "released";
    if (filter === "disputed") return t.escrowStatus === "disputed";
    if (filter === "refunded") return t.status === "refunded";
    return true;
  });

  const totalPaid = transactions.reduce(
    (sum, t) => sum + Number(t.totalCharged || t.amount || 0), 0
  );
  const totalEscrow = transactions
    .filter((t) => t.escrowStatus === "holding")
    .reduce((sum, t) => sum + Number(t.totalCharged || t.amount || 0), 0);

  function formatDate(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatEscrowRelease(ts) {
    if (!ts) return "Releasing soon";
    const d   = new Date(ts);
    const now = new Date();
    const hrs = Math.max(0, Math.round((d - now) / (1000 * 60 * 60)));
    return hrs === 0 ? "Releasing soon" : `Releases in ~${hrs}hrs`;
  }

  const TABS = ["all", "escrow", "released", "disputed", "refunded"];

  if (authLoading || loading) {
    return (
      <main className="transactions-page">
        <div className="pay-page__loading">
          <span className="pay-page__spinner" />
        </div>
      </main>
    );
  }

  return (
    <main className="transactions-page">

      {/* ── HEADER ── */}
      <motion.div
        className="transactions-page__header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <Link href="/" className="tx-page__back">
          <HiOutlineArrowLeft /> Back
        </Link>

        <p className="tx-page__eyebrow">
          <HiOutlineBanknotes /> Transactions
        </p>
        <h1 className="tx-page__title">Payment History</h1>
        <p className="tx-page__sub">
          Track your rent payments, escrow status and disputes.
        </p>
      </motion.div>

      {/* ── SUMMARY ── */}
      <motion.div
        className="tx-summary"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06 }}
      >
        <div className="tx-summary__card">
          <p className="tx-summary__label">Total paid</p>
          <p className="tx-summary__value">
            ₦{totalPaid.toLocaleString("en-NG")}
          </p>
        </div>
        <div className="tx-summary__card">
          <p className="tx-summary__label">In escrow</p>
          <p className="tx-summary__value tx-summary__value--amber">
            ₦{totalEscrow.toLocaleString("en-NG")}
          </p>
        </div>
        <div className="tx-summary__card">
          <p className="tx-summary__label">Transactions</p>
          <p className="tx-summary__value">{transactions.length}</p>
        </div>
      </motion.div>

      {/* ── TABS ── */}
      <div className="tx-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={"tx-tab" + (filter === tab ? " tx-tab--active" : "")}
            onClick={() => setFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── LIST ── */}
      {filtered.length === 0 ? (
        <div className="tx-empty">No transactions found.</div>
      ) : (
        <motion.div
          className="tx-list"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {filtered.map((tx) => (
            <motion.div key={tx.id} className="tx-card" variants={fadeUp}>

              <div className="tx-card__header">
                <div className="tx-card__meta">
                  <p className="tx-card__title">{tx.listingTitle}</p>
                  <p className="tx-card__date">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="tx-card__right">
                  <p className="tx-card__amount">
                    ₦{Number(tx.totalCharged || tx.amount || 0).toLocaleString("en-NG")}
                  </p>
                  <StatusBadge status={tx.status} escrowStatus={tx.escrowStatus} />
                </div>
                <Link
                  href={"/transactions/" + (tx.reference || tx.id)}
                  className="tx-card__link"
                  title="View receipt"
                >
                  <HiOutlineArrowTopRightOnSquare />
                </Link>
              </div>

              <div className="tx-card__details">
                <span>Rent: <strong>₦{Number(tx.amount || 0).toLocaleString("en-NG")}</strong></span>
                <span>Fee: <strong>₦{Number(tx.serviceFee || 0).toLocaleString("en-NG")}</strong></span>
                <span>Ref: <strong>{tx.reference?.slice(0, 14)}...</strong></span>
              </div>

              <StatusBar
                status={tx.status}
                escrowStatus={tx.escrowStatus}
                releaseLabel={formatEscrowRelease(tx.escrowReleaseAt)}
              />

            </motion.div>
          ))}
        </motion.div>
      )}

    </main>
  );
}