// app/transactions/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiOutlineBanknotes,
  HiOutlineArrowLeft,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowUturnLeft,
  HiOutlineReceiptPercent,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeTransactionsByStudent,
  subscribeTransactionsByLandlord,
} from "@/lib/firestoreTransactions";
import "@/styles/payment.css";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

function StatusBadge({ status }) {
  if (status === "refunded")  return <span className="tx-badge tx-badge--refunded">Refunded</span>;
  if (status === "failed")    return <span className="tx-badge tx-badge--failed">Failed</span>;
  if (status === "on_hold")   return <span className="tx-badge tx-badge--disputed">On Hold</span>;
  if (status === "completed") return <span className="tx-badge tx-badge--released">Completed</span>;
  return <span className="tx-badge tx-badge--success">Paid</span>;
}

function StatusBar({ status }) {
  if (status === "refunded")
    return (
      <div className="tx-card__statusbar tx-card__statusbar--refunded">
        <HiOutlineArrowUturnLeft />
        <span>Payment refunded</span>
      </div>
    );
  if (status === "on_hold")
    return (
      <div className="tx-card__statusbar tx-card__statusbar--disputed">
        <HiOutlineExclamationTriangle />
        <span>Payment under review</span>
      </div>
    );
  if (status === "completed")
    return (
      <div className="tx-card__statusbar tx-card__statusbar--released">
        <HiOutlineCheckCircle />
        <span>Payment sent to landlord</span>
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
        ? subscribeTransactionsByLandlord(user.uid, (data) => { setTransactions(data); setLoading(false); })
        : subscribeTransactionsByStudent(user.uid,  (data) => { setTransactions(data); setLoading(false); });
    return () => unsub();
  }, [user, userRole]);

  const TABS = ["all", "completed", "refunded", "on_hold"];

  const filtered = transactions.filter((t) => {
    if (filter === "all")       return true;
    if (filter === "completed") return t.status === "completed";
    if (filter === "refunded")  return t.status === "refunded";
    if (filter === "on_hold")   return t.status === "on_hold";
    return true;
  });

  const totalPaid = transactions.reduce(
    (sum, t) => sum + Number(t.totalCharged || t.amount || 0), 0
  );

  function formatDate(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

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

      {/* Header */}
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
        <p className="tx-page__sub">Track all your rent payments.</p>
      </motion.div>

      {/* Summary */}
      <motion.div
        className="tx-summary"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06 }}
      >
        <div className="tx-summary__card">
          <p className="tx-summary__label">Total paid</p>
          <p className="tx-summary__value">₦{totalPaid.toLocaleString("en-NG")}</p>
        </div>
        <div className="tx-summary__card">
          <p className="tx-summary__label">Completed</p>
          <p className="tx-summary__value tx-summary__value--green">
            {transactions.filter(t => t.status === "completed").length}
          </p>
        </div>
        <div className="tx-summary__card">
          <p className="tx-summary__label">Transactions</p>
          <p className="tx-summary__value">{transactions.length}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tx-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={"tx-tab" + (filter === tab ? " tx-tab--active" : "")}
            onClick={() => setFilter(tab)}
          >
            {tab === "on_hold" ? "on hold" : tab}
          </button>
        ))}
      </div>

      {/* List */}
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
                  <StatusBadge status={tx.status} />
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

              <StatusBar status={tx.status} />

            </motion.div>
          ))}
        </motion.div>
      )}

    </main>
  );
}