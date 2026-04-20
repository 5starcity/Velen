// app/login/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineExclamationTriangle,
  HiOutlineChevronDown,
} from "react-icons/hi2";
import {
  logIn,
  signInWithGoogle,
  signInWithApple,
  saveSocialUserProfile,
} from "@/lib/auth";
import "@/styles/auth.css";

function RolePickerModal({ user, onDone }) {
  const [role, setRole] = useState("student");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    try {
      await saveSocialUserProfile(user, role);
      onDone(role);
    } catch (e) {
      console.error("Role save error:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-modal-overlay">
      <motion.div
        className="auth-modal"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="auth-modal__avatar">
          {user.photoURL
            ? <img src={user.photoURL} alt="" />
            : <span>{(user.displayName || user.email || "?")[0].toUpperCase()}</span>
          }
        </div>
        <h2>One last thing</h2>
        <p>
          Welcome, {user.displayName?.split(" ")[0] || "there"}! Are you a student or a landlord?
        </p>
        <div className="auth-role-toggle auth-role-toggle--modal">
          <button
            type="button"
            className={"role-btn" + (role === "student" ? " active" : "")}
            onClick={() => setRole("student")}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className={"role-btn" + (role === "landlord" ? " active" : "")}
            onClick={() => setRole("landlord")}
          >
            🏠 Landlord
          </button>
        </div>
        <button className="auth-submit" onClick={handleConfirm} disabled={saving}>
          {saving ? "Saving..." : "Continue"}
        </button>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [showEmail, setShowEmail] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await logIn(form.email, form.password);
      router.push("/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setSocialLoading("google");
    try {
      const { user, isNewUser } = await signInWithGoogle();
      if (isNewUser) {
        setPendingUser(user);
      } else {
        window.location.href = "/";
      }
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setSocialLoading(null);
    }
  }

  async function handleApple() {
    setError("");
    setSocialLoading("apple");
    try {
      const { user, isNewUser } = await signInWithApple();
      if (isNewUser) {
        setPendingUser(user);
      } else {
        window.location.href = "/";
      }
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") {
        setError("Apple sign-in failed. Please try again.");
      }
    } finally {
      setSocialLoading(null);
    }
  }

  function handleRoleDone(role) {
    setPendingUser(null);
    window.location.href = role === "landlord" ? "/verify-landlord" : "/";
  }

  return (
    <>
      {pendingUser && (
        <RolePickerModal user={pendingUser} onDone={handleRoleDone} />
      )}

      <div className="auth-page">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="auth-header">
            <div className="auth-logo">Vel<span>en</span></div>
            <h1>Welcome back</h1>
            <p>Sign in to your account</p>
          </div>

          {error && (
            <div className="auth-error">
              <HiOutlineExclamationTriangle /> {error}
            </div>
          )}

          <div className="auth-social">
            <button
              className="auth-social__btn auth-social__btn--google"
              onClick={handleGoogle}
              disabled={!!socialLoading || loading}
            >
              {socialLoading === "google" ? <span className="auth-spinner" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button
              className="auth-social__btn auth-social__btn--apple"
              onClick={handleApple}
              disabled={!!socialLoading || loading}
            >
              {socialLoading === "apple" ? <span className="auth-spinner" /> : <AppleIcon />}
              Continue with Apple
            </button>
          </div>

          <div className="auth-divider"><span>or</span></div>

          <button
            className="auth-email-toggle"
            onClick={() => setShowEmail((v) => !v)}
          >
            <HiOutlineEnvelope />
            Continue with email
            <HiOutlineChevronDown
              className={"auth-email-toggle__chevron" + (showEmail ? " open" : "")}
            />
          </button>

          <AnimatePresence>
            {showEmail && (
              <motion.form
                onSubmit={handleEmailLogin}
                className="auth-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
              >
                <div className="auth-field">
                  <label>Email</label>
                  <div className="auth-input-wrap">
                    <HiOutlineEnvelope className="auth-input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label>Password</label>
                  <div className="auth-input-wrap">
                    <HiOutlineLockClosed className="auth-input-icon" />
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading || !!socialLoading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="auth-switch">
            Don't have an account? <Link href="/signup">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M12.47 0c.1.96-.27 1.91-.82 2.6-.56.7-1.45 1.24-2.34 1.17-.12-.9.3-1.84.82-2.48C10.7.57 11.65.05 12.47 0zM15.7 12.03c-.4.9-.59 1.3-1.1 2.09-.71 1.08-1.71 2.43-2.96 2.44-1.1.01-1.39-.72-2.88-.71-1.5.01-1.81.72-2.92.71-1.24-.01-2.19-1.23-2.9-2.31C1.12 11.9.75 9.1 1.68 7.28c.66-1.28 1.9-2.03 3.07-2.03 1.14 0 1.86.72 2.8.72.91 0 1.47-.73 2.79-.73 1.05 0 2.16.57 2.82 1.56-2.48 1.36-2.08 4.91.54 6.23z"/>
    </svg>
  );
}