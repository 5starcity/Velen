// app/profile/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  HiOutlineUser,
  HiOutlinePencilSquare,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineKey,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineShieldCheck,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChartBarSquare,
  HiOutlineExclamationTriangle,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineUserGroup,
  HiOutlineBookmark,
  HiOutlineHome,
} from "react-icons/hi2";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { logOut } from "@/lib/auth";
import "@/styles/profile.css";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [bioInput, setBioInput] = useState("");

  const [savingName, setSavingName] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    setDisplayName(user.displayName || "");
    setNameInput(user.displayName || "");

    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setPhone(data.phone || "");
          setPhoneInput(data.phone || "");
          setBio(data.bio || "");
          setBioInput(data.bio || "");
        }
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    }
    loadProfile();
  }, [user, authLoading]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSaveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: nameInput.trim() });
      await updateDoc(doc(db, "users", user.uid), { displayName: nameInput.trim() });
      setDisplayName(nameInput.trim());
      setEditingName(false);
      showToast("Name updated successfully.");
    } catch (e) {
      console.error("Name update error:", e);
      showToast("Failed to update name.", "error");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePhone() {
    setSavingPhone(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { phone: phoneInput.trim() });
      setPhone(phoneInput.trim());
      setEditingPhone(false);
      showToast("Phone number updated.");
    } catch (e) {
      console.error("Phone update error:", e);
      showToast("Failed to update phone.", "error");
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleSaveBio() {
    setSavingBio(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { bio: bioInput.trim() });
      setBio(bioInput.trim());
      setEditingBio(false);
      showToast("Bio updated.");
    } catch (e) {
      console.error("Bio update error:", e);
      showToast("Failed to update bio.", "error");
    } finally {
      setSavingBio(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
      showToast("Password changed successfully.");
    } catch (e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setPasswordError("Current password is incorrect.");
      } else {
        setPasswordError("Something went wrong. Please try again.");
      }
      console.error("Password change error:", e);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    await logOut();
    router.push("/");
  }

  if (authLoading) {
    return (
      <main className="profile-page">
        <div className="profile-page__loading">
          <div className="profile-page__spinner" />
        </div>
      </main>
    );
  }

  if (!user) return null;

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "?";

  const roleLabel = userRole === "landlord" ? "Property Owner" : "Student";

  return (
    <main className="profile-page">
      {/* Toast */}
      {toast && (
        <motion.div
          className={"profile-page__toast" + (toast.type === "error" ? " error" : "")}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {toast.type === "error" ? <HiOutlineExclamationTriangle /> : <HiOutlineCheck />}
          {toast.msg}
        </motion.div>
      )}

      <div className="profile-page__inner">

        {/* Avatar + name */}
        <motion.div
          className="profile-page__hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="profile-page__avatar">{initials}</div>
          <div>
            <h1>{displayName || "Your Profile"}</h1>
            {bio && <p className="profile-page__hero-bio">{bio}</p>}
            <span className={"profile-page__role-badge" + (userRole === "landlord" ? " landlord" : " tenant")}>
              {userRole === "landlord" ? <HiOutlineShieldCheck /> : <HiOutlineUser />}
              {roleLabel}
            </span>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          className="profile-page__card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <h2 className="profile-page__card-title">Account Information</h2>

          {/* Display Name */}
          <div className="profile-page__field">
            <div className="profile-page__field-label">
              <HiOutlineUser />
              <span>Full Name</span>
            </div>
            {editingName ? (
              <div className="profile-page__field-edit">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  autoFocus
                  placeholder="Your full name"
                />
                <button
                  className="profile-page__icon-btn profile-page__icon-btn--save"
                  onClick={handleSaveName}
                  disabled={savingName}
                >
                  {savingName ? <span className="profile-page__mini-spinner" /> : <HiOutlineCheck />}
                </button>
                <button
                  className="profile-page__icon-btn profile-page__icon-btn--cancel"
                  onClick={() => { setEditingName(false); setNameInput(displayName); }}
                >
                  <HiOutlineXMark />
                </button>
              </div>
            ) : (
              <div className="profile-page__field-value">
                <span>{displayName || <em>Not set</em>}</span>
                <button className="profile-page__edit-btn" onClick={() => setEditingName(true)}>
                  <HiOutlinePencilSquare /> Edit
                </button>
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="profile-page__field">
            <div className="profile-page__field-label">
              <HiOutlineEnvelope />
              <span>Email Address</span>
            </div>
            <div className="profile-page__field-value">
              <span>{user.email}</span>
              <span className="profile-page__readonly-badge">Cannot change</span>
            </div>
          </div>

          {/* Phone */}
          <div className="profile-page__field">
            <div className="profile-page__field-label">
              <HiOutlinePhone />
              <span>Phone Number</span>
            </div>
            {editingPhone ? (
              <div className="profile-page__field-edit">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSavePhone()}
                  autoFocus
                  placeholder="e.g. 08012345678"
                />
                <button
                  className="profile-page__icon-btn profile-page__icon-btn--save"
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                >
                  {savingPhone ? <span className="profile-page__mini-spinner" /> : <HiOutlineCheck />}
                </button>
                <button
                  className="profile-page__icon-btn profile-page__icon-btn--cancel"
                  onClick={() => { setEditingPhone(false); setPhoneInput(phone); }}
                >
                  <HiOutlineXMark />
                </button>
              </div>
            ) : (
              <div className="profile-page__field-value">
                <span>{phone || <em>Not set</em>}</span>
                <button className="profile-page__edit-btn" onClick={() => setEditingPhone(true)}>
                  <HiOutlinePencilSquare /> Edit
                </button>
              </div>
            )}
          </div>

          {/* Bio */}
          <div className={"profile-page__field" + (userRole !== "landlord" ? "" : " profile-page__field--last")}>
            <div className="profile-page__field-label">
              <HiOutlineChatBubbleBottomCenterText />
              <span>Bio</span>
            </div>
            {editingBio ? (
              <div className="profile-page__field-edit profile-page__field-edit--bio">
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  autoFocus
                  placeholder="e.g. 300L student at UNIPORT, looking for quiet accommodation near campus."
                  maxLength={160}
                  rows={3}
                />
                <div className="profile-page__bio-actions">
                  <span className="profile-page__bio-count">{bioInput.length}/160</span>
                  <button
                    className="profile-page__icon-btn profile-page__icon-btn--save"
                    onClick={handleSaveBio}
                    disabled={savingBio}
                  >
                    {savingBio ? <span className="profile-page__mini-spinner" /> : <HiOutlineCheck />}
                  </button>
                  <button
                    className="profile-page__icon-btn profile-page__icon-btn--cancel"
                    onClick={() => { setEditingBio(false); setBioInput(bio); }}
                  >
                    <HiOutlineXMark />
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-page__field-value">
                <span className="profile-page__bio-text">{bio || <em>Not set</em>}</span>
                <button className="profile-page__edit-btn" onClick={() => setEditingBio(true)}>
                  <HiOutlinePencilSquare /> Edit
                </button>
              </div>
            )}
          </div>

          {/* Account type */}
          <div className="profile-page__field profile-page__field--last">
            <div className="profile-page__field-label">
              <HiOutlineShieldCheck />
              <span>Account Type</span>
            </div>
            <div className="profile-page__field-value">
              <span>{roleLabel}</span>
            </div>
          </div>
        </motion.div>

        {/* Password Card */}
        <motion.div
          className="profile-page__card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14 }}
        >
          <div className="profile-page__card-title-row">
            <h2 className="profile-page__card-title">Password</h2>
            {!showPasswordForm && (
              <button
                className="profile-page__edit-btn"
                onClick={() => { setShowPasswordForm(true); setPasswordError(""); setPasswordSuccess(false); }}
              >
                <HiOutlineKey /> Change Password
              </button>
            )}
          </div>

          {!showPasswordForm ? (
            <p className="profile-page__muted">
              {passwordSuccess
                ? "✅ Password changed successfully."
                : "Your password was last updated when you created your account."}
            </p>
          ) : (
            <div className="profile-page__password-form">
              <div className="profile-page__pw-field">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="profile-page__pw-field">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="profile-page__pw-field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
                  placeholder="Repeat new password"
                />
              </div>
              {passwordError && (
                <p className="profile-page__pw-error">
                  <HiOutlineExclamationTriangle /> {passwordError}
                </p>
              )}
              <div className="profile-page__pw-actions">
                <button
                  className="profile-page__pw-save"
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                >
                  {savingPassword ? "Saving..." : "Update Password"}
                </button>
                <button
                  className="profile-page__pw-cancel"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordError("");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          className="profile-page__card profile-page__card--links"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="profile-page__card-title">Quick Links</h2>
          <div className="profile-page__links">
            {userRole === "landlord" && (
              <a href="/dashboard" className="profile-page__link profile-page__link--dashboard">
                <HiOutlineChartBarSquare />
                <div>
                  <strong>My Dashboard</strong>
                  <span>View and manage your listings</span>
                </div>
              </a>
            )}
            {userRole === "student" && (
              <>
                <a href="/roommates" className="profile-page__link profile-page__link--roommates">
                  <HiOutlineUserGroup />
                  <div>
                    <strong>Roommate Board</strong>
                    <span>Find someone to split the rent with</span>
                  </div>
                </a>
                <a href="/roommates/post" className="profile-page__link profile-page__link--post">
                  <HiOutlineChatBubbleBottomCenterText />
                  <div>
                    <strong>Post a Roommate Request</strong>
                    <span>Share a listing and find a roommate</span>
                  </div>
                </a>
              </>
            )}
            <a href="/saved-listings" className="profile-page__link">
              <HiOutlineBookmark />
              <div>
                <strong>Saved Listings</strong>
                <span>Properties you have bookmarked</span>
              </div>
            </a>
            <a href="/listings" className="profile-page__link">
              <HiOutlineHome />
              <div>
                <strong>Browse Properties</strong>
                <span>Find your next home</span>
              </div>
            </a>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          className="profile-page__card profile-page__card--danger"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
        >
          <h2 className="profile-page__card-title">Account Actions</h2>
          <button className="profile-page__logout-btn" onClick={handleLogout}>
            <HiOutlineArrowRightOnRectangle /> Log Out
          </button>
        </motion.div>

      </div>
    </main>
  );
}