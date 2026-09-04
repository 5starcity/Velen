// app/forgot-password/page.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiOutlineEnvelope,
  HiOutlineExclamationTriangle,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { resetPassword } from "@/lib/auth";
import "@/styles/auth.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      // Firebase deliberately doesn't confirm/deny whether an email exists
      // for enumeration protection — but surface real errors like bad format.
      if (err?.code === "auth/invalid-email") {
        setError("That doesn't look like a valid email address.");
      } else if (err?.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a bit and try again.");
      } else {
        // Treat unknown/user-not-found errors as success to avoid
        // leaking which emails are registered.
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* ── Mini top bar: logo + divider ── */}
        <div className="auth-topbar">
          <div className="auth-topbar__mark">R</div>
          <span className="auth-topbar__text">Rezidence</span>
        </div>

        <div className="auth-body">
          {!sent ? (
            <>
              <div className="auth-heading-row">
                <h1>Reset password</h1>
                <p>Enter your email and we'll send you a reset link 🔑</p>
              </div>

              {error && (
                <div className="auth-error">
                  <HiOutlineExclamationTriangle /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label>Email</label>
                  <div className="auth-input-wrap">
                    <HiOutlineEnvelope className="auth-input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. johndoe@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>

              <p className="auth-switch">
                <Link href="/login" className="auth-back-link">
                  <HiOutlineArrowLeft /> Back to login
                </Link>
              </p>
            </>
          ) : (
            <motion.div
              className="auth-sent-state"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="auth-sent-state__icon">
                <HiOutlineCheckCircle />
              </div>
              <div className="auth-heading-row auth-heading-row--center">
                <h1>Check your inbox</h1>
                <p>
                  If an account exists for <strong>{email}</strong>, a reset
                  link is on its way. It can take a minute to arrive —
                  check spam too.
                </p>
              </div>

              <button
                type="button"
                className="auth-submit auth-submit--ghost"
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Use a different email
              </button>

              <p className="auth-switch">
                <Link href="/login" className="auth-back-link">
                  <HiOutlineArrowLeft /> Back to login
                </Link>
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}