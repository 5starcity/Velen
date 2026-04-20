"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineExclamationTriangle,
  HiOutlineChevronDown,
} from "react-icons/hi2";

import {
  signUp,
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
      <motion.div className="auth-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2>One last thing</h2>
        <p>
          Welcome, {user.displayName?.split(" ")[0] || "there"}! Are you a student or a landlord?
        </p>

        <div className="auth-role-toggle">
          <button onClick={() => setRole("student")} className={role === "student" ? "active" : ""}>
            🎓 Student
          </button>
          <button onClick={() => setRole("landlord")} className={role === "landlord" ? "active" : ""}>
            🏠 Landlord
          </button>
        </div>

        <button onClick={handleConfirm} disabled={saving}>
          {saving ? "Saving..." : "Continue"}
        </button>
      </motion.div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [showEmail, setShowEmail] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleEmailSignup(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await signUp(form.email, form.password, form.name, form.role);
      router.push(form.role === "landlord" ? "/verify-landlord" : "/");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  // ✅ GOOGLE POPUP FLOW
  async function handleGoogle() {
    setError("");
    setSocialLoading("google");

    try {
      const { user, isNewUser } = await signInWithGoogle();

      if (isNewUser) {
        setPendingUser(user);
      } else {
        router.push("/");
      }
    } catch {
      setError("Google sign-in failed.");
    } finally {
      setSocialLoading(null);
    }
  }

  // ✅ APPLE POPUP FLOW
  async function handleApple() {
    setError("");
    setSocialLoading("apple");

    try {
      const { user, isNewUser } = await signInWithApple();

      if (isNewUser) {
        setPendingUser(user);
      } else {
        router.push("/");
      }
    } catch {
      setError("Apple sign-in failed.");
    } finally {
      setSocialLoading(null);
    }
  }

  function handleRoleDone(role) {
    setPendingUser(null);
    router.push(role === "landlord" ? "/verify-landlord" : "/");
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
        >
          <h1>Create account</h1>

          {error && (
            <div className="auth-error">
              <HiOutlineExclamationTriangle /> {error}
            </div>
          )}

          <button onClick={handleGoogle}>
            {socialLoading === "google" ? "Loading..." : "Continue with Google"}
          </button>

          <button onClick={handleApple}>
            {socialLoading === "apple" ? "Loading..." : "Continue with Apple"}
          </button>

          <div>or</div>

          <button onClick={() => setShowEmail(!showEmail)}>
            Sign up with email <HiOutlineChevronDown />
          </button>

          <AnimatePresence>
            {showEmail && (
              <motion.form onSubmit={handleEmailSignup}>
                <input name="name" placeholder="Full Name" onChange={handleChange} />
                <input name="email" placeholder="Email" onChange={handleChange} />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} />

                <button type="submit">
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
}