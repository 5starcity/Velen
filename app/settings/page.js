"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineKey,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineExclamationTriangle,
  HiOutlineBell,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineEnvelope,
  HiOutlineBanknotes,
  HiOutlineArrowRightOnRectangle,
  HiOutlineTrash,
  HiOutlineShieldExclamation,
  HiOutlineUser,
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineIdentification,
} from "react-icons/hi2";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { logOut } from "@/lib/auth";
import "@/styles/settings.css";

// Default normalized settings doc
function normalizeSettings(data) {
  return {
    notificationPrefs: {
      smsEnabled: data.notificationPrefs?.smsEnabled ?? true,
      emailEnabled: data.notificationPrefs?.emailEnabled ?? true,
    },
    payoutInfo: {
      bankName: data.payoutInfo?.bankName || "",
      accountNumber: data.payoutInfo?.accountNumber || "",
      accountName: data.payoutInfo?.accountName || "",
      verified: data.payoutInfo?.verified ?? false,
    },
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Notifications
  const [savingNotif, setSavingNotif] = useState({});

  // Payout info (landlord)
  const [payoutEditing, setPayoutEditing] = useState(false);
  const [payoutInputs, setPayoutInputs] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [savingPayout, setSavingPayout] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isLandlord = userRole === "landlord";

  // ── Load settings ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    async function loadSettings() {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};
        const normalized = normalizeSettings(data);
        await setDoc(ref, normalized, { merge: true });
        setSettings(normalized);
        setPayoutInputs({
          bankName: normalized.payoutInfo.bankName,
          accountNumber: normalized.payoutInfo.accountNumber,
          accountName: normalized.payoutInfo.accountName,
        });
      } catch (e) {
        console.error("Error loading settings:", e);
        showToast("Failed to load settings.", "error");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user, authLoading]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  // ── Notification toggle ──
  async function toggleNotification(key) {
    const updated = {
      ...settings.notificationPrefs,
      [key]: !settings.notificationPrefs[key],
    };
    setSettings(prev => ({ ...prev, notificationPrefs: updated }));
    setSavingNotif(prev => ({ ...prev, [key]: true }));
    try {
      await updateDoc(doc(db, "users", user.uid), { notificationPrefs: updated });
    } catch (e) {
      console.error(e);
      // revert on failure
      setSettings(prev => ({
        ...prev,
        notificationPrefs: { ...updated, [key]: !updated[key] },
      }));
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSavingNotif(prev => ({ ...prev, [key]: false }));
    }
  }

  // ── Password change ──
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
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setShowPasswordForm(false);
      showToast("Password changed successfully.");
    } catch (e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setPasswordError("Current password is incorrect.");
      } else {
        setPasswordError("Something went wrong. Please try again.");
      }
    } finally {
      setSavingPassword(false);
    }
  }

  // ── Payout info (landlord) ──
  async function savePayoutInfo() {
    if (!payoutInputs.bankName || !payoutInputs.accountNumber || !payoutInputs.accountName) {
      showToast("Please fill in all bank details.", "error");
      return;
    }
    setSavingPayout(true);
    try {
      const updated = {
        ...payoutInputs,
        verified: false, // any change resets verification until re-checked
      };
      await updateDoc(doc(db, "users", user.uid), { payoutInfo: updated });
      setSettings(prev => ({ ...prev, payoutInfo: updated }));
      setPayoutEditing(false);
      showToast("Payout details saved. Verification pending.");
    } catch (e) {
      console.error(e);
      showToast("Failed to save payout details.", "error");
    } finally {
      setSavingPayout(false);
    }
  }

  // ── Logout ──
  async function handleLogout() {
    await logOut();
    router.push("/");
  }

  // ── Delete account ──
  async function handleDeleteAccount() {
    setDeleteError("");
    if (deleteConfirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm.');
      return;
    }
    if (!deletePassword) {
      setDeleteError("Please enter your password to confirm.");
      return;
    }
    setDeleting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      // Flag account for deletion in Firestore before removing auth record,
      // so any backend cleanup (listings, bookings, etc.) can process it.
      await updateDoc(doc(db, "users", user.uid), {
        deletionRequested: true,
        deletionRequestedAt: new Date().toISOString(),
      });
      await deleteUser(auth.currentUser);
      router.push("/");
    } catch (e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setDeleteError("Incorrect password.");
      } else {
        console.error(e);
        setDeleteError("Something went wrong. Please try again or contact support.");
      }
    } finally {
      setDeleting(false);
    }
  }

  // ── Loading / guard ──
  if (authLoading || loading || !settings) {
    return (
      <main className="settings-page">
        <div className="settings-page__loading">
          <div className="settings-page__spinner" />
        </div>
      </main>
    );
  }
  if (!user) return null;

  return (
    <main className="settings-page">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`settings-page__toast${toast.type === "error" ? " error" : ""}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {toast.type === "error" ? <HiOutlineExclamationTriangle /> : <HiOutlineCheck />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="settings-page__inner"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >

        {/* ── Header ── */}
        <div className="settings-page__header">
          <button className="settings-page__back-btn" onClick={() => router.push("/profile")}>
            <HiOutlineArrowLeft /> Back to Profile
          </button>
          <h1>Settings</h1>
        </div>

        {/* ── Account ── */}
        <motion.div className="settings-page__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
          <h2 className="settings-page__card-title">
            <HiOutlineUser /> Account
          </h2>

          <div className="settings-page__field">
            <div className="settings-page__field-label">
              <HiOutlineKey />
              <span>Password</span>
            </div>
            <div className="settings-page__field-value">
              <span>••••••••</span>
              <button className="settings-page__edit-btn" onClick={() => setShowPasswordForm(v => !v)}>
                {showPasswordForm ? "Cancel" : "Change"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showPasswordForm && (
              <motion.div
                className="settings-page__password-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div className="settings-page__password-form-inner">
                  {["currentPassword", "newPassword", "confirmPassword"].map((field, i) => (
                    <div className="settings-page__pw-field" key={field}>
                      <label>{["Current Password", "New Password", "Confirm New Password"][i]}</label>
                      <input
                        type="password"
                        value={[currentPassword, newPassword, confirmPassword][i]}
                        onChange={e => [setCurrentPassword, setNewPassword, setConfirmPassword][i](e.target.value)}
                      />
                    </div>
                  ))}
                  {passwordError && (
                    <div className="settings-page__pw-error">
                      <HiOutlineExclamationTriangle /> {passwordError}
                    </div>
                  )}
                  <div className="settings-page__pw-actions">
                    <button className="settings-page__pw-save" onClick={handleChangePassword} disabled={savingPassword}>
                      {savingPassword ? "Saving..." : "Update Password"}
                    </button>
                    <button
                      className="settings-page__pw-cancel"
                      onClick={() => { setShowPasswordForm(false); setPasswordError(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Notifications ── */}
        <motion.div className="settings-page__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h2 className="settings-page__card-title">
            <HiOutlineBell /> Notifications
          </h2>
          <p className="settings-page__card-subtitle">
            Choose how you want to hear about inspection bookings, payments, and refunds.
          </p>

          <div className="settings-page__toggle-row">
            <span className="settings-page__toggle-label">
              <HiOutlineChatBubbleBottomCenterText /> SMS Notifications
            </span>
            <button
              className={`settings-page__toggle${settings.notificationPrefs.smsEnabled ? " settings-page__toggle--on" : ""}`}
              onClick={() => toggleNotification("smsEnabled")}
              disabled={savingNotif.smsEnabled}
            >
              <span className="settings-page__toggle-knob" />
            </button>
          </div>

          <div className="settings-page__toggle-row">
            <span className="settings-page__toggle-label">
              <HiOutlineEnvelope /> Email Notifications
            </span>
            <button
              className={`settings-page__toggle${settings.notificationPrefs.emailEnabled ? " settings-page__toggle--on" : ""}`}
              onClick={() => toggleNotification("emailEnabled")}
              disabled={savingNotif.emailEnabled}
            >
              <span className="settings-page__toggle-knob" />
            </button>
          </div>
        </motion.div>

        {/* ── Payment (Landlord only) ── */}
        {isLandlord && (
          <motion.div className="settings-page__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <div className="settings-page__card-title-row">
              <h2 className="settings-page__card-title">
                <HiOutlineBanknotes /> Payout Details
              </h2>
              {!payoutEditing ? (
                <button className="settings-page__edit-btn" onClick={() => setPayoutEditing(true)}>
                  Edit
                </button>
              ) : (
                <div className="settings-page__payout-actions">
                  <button className="settings-page__edit-btn" onClick={() => { setPayoutEditing(false); setPayoutInputs({ ...settings.payoutInfo }); }}>
                    Cancel
                  </button>
                  <button className="settings-page__edit-btn settings-page__edit-btn--save" onClick={savePayoutInfo} disabled={savingPayout}>
                    {savingPayout ? <span className="settings-page__mini-spinner" /> : <HiOutlineCheck />} Save
                  </button>
                </div>
              )}
            </div>

            <div className="settings-page__payout-status">
              {settings.payoutInfo.verified ? (
                <span className="settings-page__badge settings-page__badge--verified">
                  <HiOutlineCheck /> Verified
                </span>
              ) : (
                <span className="settings-page__badge settings-page__badge--pending">
                  <HiOutlineExclamationTriangle /> Verification Pending
                </span>
              )}
            </div>

            {payoutEditing ? (
              <div className="settings-page__payout-form">
                <div className="settings-page__field-edit-block">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={payoutInputs.bankName}
                    onChange={e => setPayoutInputs(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="e.g. GTBank"
                  />
                </div>
                <div className="settings-page__field-edit-block">
                  <label>Account Number</label>
                  <input
                    type="text"
                    value={payoutInputs.accountNumber}
                    onChange={e => setPayoutInputs(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="10-digit account number"
                    maxLength={10}
                  />
                </div>
                <div className="settings-page__field-edit-block">
                  <label>Account Name</label>
                  <input
                    type="text"
                    value={payoutInputs.accountName}
                    onChange={e => setPayoutInputs(prev => ({ ...prev, accountName: e.target.value }))}
                    placeholder="Name on the account"
                  />
                </div>
              </div>
            ) : (
              <div className="settings-page__payout-summary">
                <div className="settings-page__field">
                  <div className="settings-page__field-label"><HiOutlineBuildingOffice2 /><span>Bank</span></div>
                  <div className="settings-page__field-value">
                    {settings.payoutInfo.bankName ? <span>{settings.payoutInfo.bankName}</span> : <em>Not set</em>}
                  </div>
                </div>
                <div className="settings-page__field">
                  <div className="settings-page__field-label"><HiOutlineIdentification /><span>Account Number</span></div>
                  <div className="settings-page__field-value">
                    {settings.payoutInfo.accountNumber ? <span>{settings.payoutInfo.accountNumber}</span> : <em>Not set</em>}
                  </div>
                </div>
                <div className="settings-page__field settings-page__field--last">
                  <div className="settings-page__field-label"><HiOutlineUser /><span>Account Name</span></div>
                  <div className="settings-page__field-value">
                    {settings.payoutInfo.accountName ? <span>{settings.payoutInfo.accountName}</span> : <em>Not set</em>}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Account Actions ── */}
        <motion.div className="settings-page__card settings-page__card--danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="settings-page__card-title">Account Actions</h2>

          <button className="settings-page__logout-btn" onClick={handleLogout}>
            <HiOutlineArrowRightOnRectangle /> Sign Out
          </button>

          <button className="settings-page__delete-btn" onClick={() => setShowDeleteModal(true)}>
            <HiOutlineTrash /> Delete Account
          </button>
        </motion.div>

      </motion.div>

      {/* ── Delete Account Modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="settings-page__modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!deleting) { setShowDeleteModal(false); setDeleteConfirmText(""); setDeletePassword(""); setDeleteError(""); } }}
          >
            <motion.div
              className="settings-page__modal"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="settings-page__modal-icon">
                <HiOutlineShieldExclamation />
              </div>
              <h3>Delete your account?</h3>
              <p>
                This will permanently delete your account and remove access to your listings,
                bookings, and messages. This cannot be undone.
              </p>

              <div className="settings-page__field-edit-block">
                <label>Type <strong>DELETE</strong> to confirm</label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>
              <div className="settings-page__field-edit-block">
                <label>Confirm your password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                />
              </div>

              {deleteError && (
                <div className="settings-page__pw-error">
                  <HiOutlineExclamationTriangle /> {deleteError}
                </div>
              )}

              <div className="settings-page__modal-actions">
                <button
                  className="settings-page__pw-cancel"
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); setDeletePassword(""); setDeleteError(""); }}
                  disabled={deleting}
                >
                  <HiOutlineXMark /> Cancel
                </button>
                <button
                  className="settings-page__delete-confirm-btn"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete My Account"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}