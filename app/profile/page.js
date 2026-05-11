"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  HiOutlineClipboardDocumentCheck,
  HiOutlineAcademicCap,
  HiOutlineIdentification,
  HiOutlineCamera,
  HiOutlineSparkles,
  HiOutlineMoon,
  HiOutlineSun,
  HiOutlineHeart,
} from "react-icons/hi2";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { logOut } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";
import "@/styles/profile.css";

const PH_UNIVERSITIES = [
  "University of Port Harcourt (UNIPORT)",
  "Rivers State University (RSU)",
  "Rivers State University of Science and Technology (RSUST)",
  "Ignatius Ajuru University of Education (IAUE)",
  "Ken Saro-Wiwa Polytechnic",
  "Port Harcourt Polytechnic",
  "Captain Elechi Amadi Polytechnic",
  "Federal College of Education (Technical), Omoku",
  "Other (type below)",
];

const YEAR_OPTIONS = [
  "100 Level", "200 Level", "300 Level", "400 Level", "500 Level",
  "600 Level", "Postgraduate", "PhD",
];

const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

// Roommate prefs options
const GENDER_PREF = ["Male", "Female", "Any"];
const SLEEP_SCHEDULE = [
  { value: "early", label: "Early Bird 🌅", desc: "Bed by 10pm" },
  { value: "late", label: "Night Owl 🌙", desc: "Up past midnight" },
  { value: "flexible", label: "Flexible 😌", desc: "Whatever works" },
];
const STUDY_HABITS = [
  { value: "quiet", label: "Quiet Study 📚", desc: "Silence only" },
  { value: "social", label: "Social Vibe 🎵", desc: "Music/noise ok" },
  { value: "flexible", label: "Flexible 🤝", desc: "Can adapt" },
];
const CLEANLINESS = [
  { value: "very_clean", label: "Very Clean ✨", desc: "Spotless always" },
  { value: "moderate", label: "Moderate 🧹", desc: "Reasonably tidy" },
  { value: "relaxed", label: "Relaxed 😅", desc: "Lived-in is fine" },
];
const BUDGET_RANGE = [
  { value: "under_50k", label: "Under ₦50k" },
  { value: "50k_100k", label: "₦50k – ₦100k" },
  { value: "above_100k", label: "Above ₦100k" },
];

// Completeness scoring
function getCompleteness(data, photoURL) {
  const fields = [
    !!data.displayName,
    !!data.phone,
    !!data.bio,
    !!photoURL,
    !!data.university,
    !!data.course,
    !!data.yearOfStudy,
    !!data.gender,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// Default normalized user doc
function normalizeUserDoc(data, user) {
  return {
    displayName: data.displayName || user.displayName || "",
    email: data.email || user.email || "",
    phone: data.phone || "",
    bio: data.bio || "",
    photoURL: data.photoURL || user.photoURL || "",
    university: data.university || "",
    course: data.course || "",
    yearOfStudy: data.yearOfStudy || "",
    gender: data.gender || "",
    role: data.role || "student",
    roommatePrefs: {
      lookingForRoommate: data.roommatePrefs?.lookingForRoommate ?? false,
      genderPref: data.roommatePrefs?.genderPref || "",
      sleepSchedule: data.roommatePrefs?.sleepSchedule || "",
      studyHabits: data.roommatePrefs?.studyHabits || "",
      cleanliness: data.roommatePrefs?.cleanliness || "",
      budgetRange: data.roommatePrefs?.budgetRange || "",
      extraNotes: data.roommatePrefs?.extraNotes || "",
    },
    createdAt: data.createdAt || null,
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);

  // Profile state
  const [profileData, setProfileData] = useState(null);
  const [photoURL, setPhotoURL] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Editing states
  const [editing, setEditing] = useState({});
  const [inputs, setInputs] = useState({});
  const [saving, setSaving] = useState({});

  // University "other" state
  const [uniIsOther, setUniIsOther] = useState(false);

  // Roommate prefs
  const [roommatePrefs, setRoommatePrefs] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsEditing, setPrefsEditing] = useState(false);

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [toast, setToast] = useState(null);

  // ── Load & normalize profile ──
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }

    async function loadProfile() {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        let data = {};
        if (snap.exists()) {
          data = snap.data();
        }
        const normalized = normalizeUserDoc(data, user);
        // Write normalized back to fix inconsistent old docs
        await setDoc(ref, normalized, { merge: true });

        setProfileData(normalized);
        setPhotoURL(normalized.photoURL);
        setInputs({
          displayName: normalized.displayName,
          phone: normalized.phone,
          bio: normalized.bio,
          university: normalized.university,
          course: normalized.course,
          yearOfStudy: normalized.yearOfStudy,
          gender: normalized.gender,
          uniCustom: "",
        });
        setRoommatePrefs({ ...normalized.roommatePrefs });

        // Check if uni was a custom entry
        if (
          normalized.university &&
          !PH_UNIVERSITIES.slice(0, -1).includes(normalized.university)
        ) {
          setUniIsOther(true);
          setInputs(prev => ({
            ...prev,
            university: "Other (type below)",
            uniCustom: normalized.university,
          }));
        }
      } catch (e) {
        console.error("Error loading profile:", e);
        showToast("Failed to load profile.", "error");
      }
    }
    loadProfile();
  }, [user, authLoading]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  function startEdit(field) {
    setEditing(prev => ({ ...prev, [field]: true }));
  }

  function cancelEdit(field) {
    setEditing(prev => ({ ...prev, [field]: false }));
    // Reset input to current value
    setInputs(prev => ({ ...prev, [field]: profileData[field] }));
  }

  async function saveField(field, value) {
    setSaving(prev => ({ ...prev, [field]: true }));
    try {
      const updateVal = value ?? inputs[field];
      await updateDoc(doc(db, "users", user.uid), { [field]: updateVal });
      if (field === "displayName") {
        await updateProfile(auth.currentUser, { displayName: updateVal });
      }
      setProfileData(prev => ({ ...prev, [field]: updateVal }));
      setEditing(prev => ({ ...prev, [field]: false }));
      showToast(`${field === "displayName" ? "Name" : field.charAt(0).toUpperCase() + field.slice(1)} updated.`);
    } catch (e) {
      console.error(e);
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(prev => ({ ...prev, [field]: false }));
    }
  }

  async function saveUniversity() {
    const finalValue = uniIsOther ? inputs.uniCustom.trim() : inputs.university;
    if (!finalValue) return;
    await saveField("university", finalValue);
  }

  // ── Photo upload ──
  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error");
      return;
    }
    setUploadingPhoto(true);
    try {
      const url = await uploadToCloudinary(file);
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });
      await updateProfile(auth.currentUser, { photoURL: url });
      setPhotoURL(url);
      setProfileData(prev => ({ ...prev, photoURL: url }));
      showToast("Profile photo updated!");
    } catch (e) {
      console.error(e);
      showToast("Photo upload failed.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  }

  // ── Save roommate prefs ──
  async function saveRoommatePrefs() {
    setSavingPrefs(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { roommatePrefs });
      setProfileData(prev => ({ ...prev, roommatePrefs }));
      setPrefsEditing(false);
      showToast("Roommate preferences saved!");
    } catch (e) {
      console.error(e);
      showToast("Failed to save preferences.", "error");
    } finally {
      setSavingPrefs(false);
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

  async function handleLogout() {
    await logOut();
    router.push("/");
  }

  // ── Loading / guard ──
  if (authLoading || !profileData) {
    return (
      <main className="profile-page">
        <div className="profile-page__loading">
          <div className="profile-page__spinner" />
        </div>
      </main>
    );
  }
  if (!user) return null;

  const initials = profileData.displayName
    ? profileData.displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "?";

  const completeness = getCompleteness(profileData, photoURL);
  const isStudent = userRole === "student";

  // ── Inline edit field renderer ──
  function EditableField({ field, label, icon, placeholder = "Not set", type = "text", multiline = false }) {
    const isEditing = editing[field];
    const isSaving = saving[field];
    const value = profileData[field];

    return (
      <div className="profile-page__field">
        <div className="profile-page__field-label">
          {icon}
          <span>{label}</span>
        </div>
        {isEditing ? (
          <div className={`profile-page__field-edit${multiline ? " profile-page__field-edit--bio" : ""}`}>
            {multiline ? (
              <>
                <textarea
                  value={inputs[field]}
                  onChange={e => setInputs(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={placeholder}
                  maxLength={200}
                  autoFocus
                />
                <div className="profile-page__bio-actions">
                  <span className="profile-page__bio-count">{inputs[field]?.length ?? 0}/200</span>
                  <button className="profile-page__icon-btn profile-page__icon-btn--cancel" onClick={() => cancelEdit(field)}><HiOutlineXMark /></button>
                  <button className="profile-page__icon-btn profile-page__icon-btn--save" onClick={() => saveField(field)} disabled={isSaving}>
                    {isSaving ? <span className="profile-page__mini-spinner" /> : <HiOutlineCheck />}
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  type={type}
                  value={inputs[field]}
                  onChange={e => setInputs(prev => ({ ...prev, [field]: e.target.value }))}
                  placeholder={placeholder}
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && saveField(field)}
                />
                <button className="profile-page__icon-btn profile-page__icon-btn--cancel" onClick={() => cancelEdit(field)}><HiOutlineXMark /></button>
                <button className="profile-page__icon-btn profile-page__icon-btn--save" onClick={() => saveField(field)} disabled={isSaving}>
                  {isSaving ? <span className="profile-page__mini-spinner" /> : <HiOutlineCheck />}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="profile-page__field-value">
            {value
              ? <span className={multiline ? "profile-page__bio-text" : ""}>{value}</span>
              : <em>{placeholder}</em>
            }
            <button className="profile-page__edit-btn" onClick={() => startEdit(field)}>
              <HiOutlinePencilSquare /> Edit
            </button>
          </div>
        )}
      </div>
    );
  }

  function SelectField({ field, label, icon, options, placeholder = "Not set" }) {
    const isEditing = editing[field];
    const isSaving = saving[field];
    const value = profileData[field];

    return (
      <div className="profile-page__field">
        <div className="profile-page__field-label">
          {icon}
          <span>{label}</span>
        </div>
        {isEditing ? (
          <div className="profile-page__field-edit">
            <select
              value={inputs[field]}
              onChange={e => setInputs(prev => ({ ...prev, [field]: e.target.value }))}
              className="profile-page__select"
              autoFocus
            >
              <option value="">Select...</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <button className="profile-page__icon-btn profile-page__icon-btn--cancel" onClick={() => cancelEdit(field)}><HiOutlineXMark /></button>
            <button className="profile-page__icon-btn profile-page__icon-btn--save" onClick={() => saveField(field)} disabled={isSaving}>
              {isSaving ? <span className="profile-page__mini-spinner" /> : <HiOutlineCheck />}
            </button>
          </div>
        ) : (
          <div className="profile-page__field-value">
            {value ? <span>{value}</span> : <em>{placeholder}</em>}
            <button className="profile-page__edit-btn" onClick={() => startEdit(field)}>
              <HiOutlinePencilSquare /> Edit
            </button>
          </div>
        )}
      </div>
    );
  }

  // University field — dropdown + optional custom input
  function UniversityField() {
    const isEditing = editing["university"];
    const isSaving = saving["university"];
    const value = profileData.university;

    return (
      <div className="profile-page__field">
        <div className="profile-page__field-label">
          <HiOutlineAcademicCap />
          <span>University</span>
        </div>
        {isEditing ? (
          <div className="profile-page__field-edit profile-page__field-edit--uni">
            <select
              value={inputs.university}
              onChange={e => {
                const val = e.target.value;
                setInputs(prev => ({ ...prev, university: val, uniCustom: "" }));
                setUniIsOther(val === "Other (type below)");
              }}
              className="profile-page__select"
            >
              <option value="">Select university...</option>
              {PH_UNIVERSITIES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            {uniIsOther && (
              <input
                type="text"
                value={inputs.uniCustom}
                onChange={e => setInputs(prev => ({ ...prev, uniCustom: e.target.value }))}
                placeholder="Type your university name"
                className="profile-page__uni-custom"
                autoFocus
              />
            )}
            <div className="profile-page__field-edit-actions">
              <button className="profile-page__icon-btn profile-page__icon-btn--cancel" onClick={() => { cancelEdit("university"); setUniIsOther(false); }}><HiOutlineXMark /></button>
              <button className="profile-page__icon-btn profile-page__icon-btn--save" onClick={saveUniversity} disabled={isSaving}>
                {isSaving ? <span className="profile-page__mini-spinner" /> : <HiOutlineCheck />}
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-page__field-value">
            {value ? <span>{value}</span> : <em>Not set</em>}
            <button className="profile-page__edit-btn" onClick={() => startEdit("university")}>
              <HiOutlinePencilSquare /> Edit
            </button>
          </div>
        )}
      </div>
    );
  }

  // Roommate prefs pill selector
  function PrefPills({ label, options, prefKey }) {
    return (
      <div className="profile-page__pref-group">
        <p className="profile-page__pref-label">{label}</p>
        <div className="profile-page__pref-pills">
          {options.map(opt => (
            <button
              key={opt.value || opt}
              className={`profile-page__pref-pill${roommatePrefs[prefKey] === (opt.value || opt) ? " profile-page__pref-pill--active" : ""}`}
              onClick={() => prefsEditing && setRoommatePrefs(prev => ({ ...prev, [prefKey]: opt.value || opt }))}
              disabled={!prefsEditing}
            >
              {opt.label || opt}
              {opt.desc && <span>{opt.desc}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="profile-page">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`profile-page__toast${toast.type === "error" ? " error" : ""}`}
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
        className="profile-page__inner"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >

        {/* ── Hero ── */}
        <div className="profile-page__hero">
          {/* Avatar with upload */}
          <div className="profile-page__avatar-wrap">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="profile-page__avatar profile-page__avatar--img" />
            ) : (
              <div className="profile-page__avatar">{initials}</div>
            )}
            <button
              className="profile-page__avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Change photo"
            >
              {uploadingPhoto ? <span className="profile-page__mini-spinner" /> : <HiOutlineCamera />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handlePhotoChange}
            />
          </div>

          <div className="profile-page__hero-info">
            <h1>{profileData.displayName || "Your Profile"}</h1>
            {profileData.bio && <p className="profile-page__hero-bio">{profileData.bio}</p>}
            <div className="profile-page__hero-badges">
              <span className={`profile-page__role-badge ${isStudent ? "tenant" : "landlord"}`}>
                <HiOutlineShieldCheck />
                {isStudent ? "Student" : "Property Owner"}
              </span>
              {profileData.university && (
                <span className="profile-page__uni-badge">
                  <HiOutlineAcademicCap />
                  {profileData.university.replace(" (type below)", "")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Profile Completeness ── */}
        <motion.div
          className="profile-page__card profile-page__card--completeness"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="profile-page__completeness-header">
            <span className="profile-page__completeness-label">
              <HiOutlineSparkles /> Profile Completeness
            </span>
            <span className="profile-page__completeness-pct">{completeness}%</span>
          </div>
          <div className="profile-page__completeness-bar">
            <motion.div
              className="profile-page__completeness-fill"
              initial={{ width: 0 }}
              animate={{ width: `${completeness}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          {completeness < 100 && (
            <p className="profile-page__completeness-hint">
              {completeness < 40
                ? "Add your photo, university and bio to stand out to landlords."
                : completeness < 80
                ? "Almost there — fill in your remaining details."
                : "Just a few more fields to complete your profile!"}
            </p>
          )}
        </motion.div>

        {/* ── Basic Info ── */}
        <motion.div className="profile-page__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
          <h2 className="profile-page__card-title">Basic Info</h2>
          <EditableField field="displayName" label="Full Name" icon={<HiOutlineUser />} placeholder="Your full name" />
          <div className="profile-page__field">
            <div className="profile-page__field-label"><HiOutlineEnvelope /><span>Email</span></div>
            <div className="profile-page__field-value">
              <span>{user.email}</span>
              <span className="profile-page__readonly-badge">Cannot change</span>
            </div>
          </div>
          <EditableField field="phone" label="Phone" icon={<HiOutlinePhone />} placeholder="e.g. 08012345678" type="tel" />
          <EditableField field="bio" label="Bio" icon={<HiOutlineChatBubbleBottomCenterText />} placeholder="Tell landlords a bit about yourself..." multiline />
        </motion.div>

        {/* ── Student Details (students only) ── */}
        {isStudent && (
          <motion.div className="profile-page__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <h2 className="profile-page__card-title">Student Details</h2>
            <UniversityField />
            <EditableField field="course" label="Course" icon={<HiOutlineIdentification />} placeholder="e.g. Mechanical Engineering" />
            <SelectField field="yearOfStudy" label="Year of Study" icon={<HiOutlineAcademicCap />} options={YEAR_OPTIONS} placeholder="Select year" />
            <SelectField field="gender" label="Gender" icon={<HiOutlineUser />} options={GENDER_OPTIONS} placeholder="Select gender" />
          </motion.div>
        )}

        {/* ── Roommate Preferences (students only) ── */}
        {isStudent && roommatePrefs && (
          <motion.div className="profile-page__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
            <div className="profile-page__card-title-row">
              <h2 className="profile-page__card-title">
                <HiOutlineHeart style={{ display: "inline", marginRight: 6, color: "#f472b6" }} />
                Roommate Preferences
              </h2>
              {!prefsEditing ? (
                <button className="profile-page__edit-btn" onClick={() => setPrefsEditing(true)}>
                  <HiOutlinePencilSquare /> Edit
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="profile-page__edit-btn" onClick={() => setPrefsEditing(false)}>
                    <HiOutlineXMark /> Cancel
                  </button>
                  <button className="profile-page__edit-btn profile-page__edit-btn--save" onClick={saveRoommatePrefs} disabled={savingPrefs}>
                    {savingPrefs ? <span className="profile-page__mini-spinner" /> : <HiOutlineCheck />} Save
                  </button>
                </div>
              )}
            </div>

            {/* Looking for roommate toggle */}
            <div className="profile-page__pref-toggle-row">
              <span className="profile-page__pref-toggle-label">
                <HiOutlineUserGroup /> I&apos;m looking for a roommate
              </span>
              <button
                className={`profile-page__toggle${roommatePrefs.lookingForRoommate ? " profile-page__toggle--on" : ""}`}
                onClick={() => prefsEditing && setRoommatePrefs(prev => ({ ...prev, lookingForRoommate: !prev.lookingForRoommate }))}
                disabled={!prefsEditing}
              >
                <span className="profile-page__toggle-knob" />
              </button>
            </div>

            {roommatePrefs.lookingForRoommate && (
              <div className="profile-page__prefs-grid">
                <PrefPills label="Preferred Roommate Gender" options={GENDER_PREF} prefKey="genderPref" />
                <PrefPills label="Sleep Schedule" options={SLEEP_SCHEDULE} prefKey="sleepSchedule" />
                <PrefPills label="Study Habits" options={STUDY_HABITS} prefKey="studyHabits" />
                <PrefPills label="Cleanliness" options={CLEANLINESS} prefKey="cleanliness" />
                <PrefPills label="Budget Range" options={BUDGET_RANGE} prefKey="budgetRange" />

                <div className="profile-page__pref-group">
                  <p className="profile-page__pref-label">Extra Notes <span style={{ color: "#475569", fontWeight: 400 }}>(optional)</span></p>
                  <textarea
                    className="profile-page__pref-notes"
                    value={roommatePrefs.extraNotes}
                    onChange={e => prefsEditing && setRoommatePrefs(prev => ({ ...prev, extraNotes: e.target.value }))}
                    placeholder="Anything else a potential roommate should know..."
                    maxLength={300}
                    readOnly={!prefsEditing}
                  />
                </div>
              </div>
            )}

            {!roommatePrefs.lookingForRoommate && (
              <p className="profile-page__muted" style={{ marginTop: 4 }}>
                Toggle on to set your roommate preferences and appear on the roommate board.
              </p>
            )}
          </motion.div>
        )}

        {/* ── Security ── */}
        <motion.div className="profile-page__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="profile-page__card-title">Security</h2>
          <div className="profile-page__field profile-page__field--last">
            <div className="profile-page__field-label"><HiOutlineKey /><span>Password</span></div>
            <div className="profile-page__field-value">
              <span>••••••••</span>
              <button className="profile-page__edit-btn" onClick={() => setShowPasswordForm(v => !v)}>
                <HiOutlinePencilSquare /> Change
              </button>
            </div>
          </div>
          <AnimatePresence>
            {showPasswordForm && (
              <motion.div
                className="profile-page__password-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ paddingTop: 16 }}>
                  {["currentPassword", "newPassword", "confirmPassword"].map((field, i) => (
                    <div className="profile-page__pw-field" key={field} style={{ marginBottom: 12 }}>
                      <label>{["Current Password", "New Password", "Confirm New Password"][i]}</label>
                      <input
                        type="password"
                        value={[currentPassword, newPassword, confirmPassword][i]}
                        onChange={e => [setCurrentPassword, setNewPassword, setConfirmPassword][i](e.target.value)}
                      />
                    </div>
                  ))}
                  {passwordError && (
                    <div className="profile-page__pw-error">
                      <HiOutlineExclamationTriangle /> {passwordError}
                    </div>
                  )}
                  <div className="profile-page__pw-actions">
                    <button className="profile-page__pw-save" onClick={handleChangePassword} disabled={savingPassword}>
                      {savingPassword ? "Saving..." : "Update Password"}
                    </button>
                    <button className="profile-page__pw-cancel" onClick={() => { setShowPasswordForm(false); setPasswordError(""); }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Quick Links ── */}
        <motion.div className="profile-page__card profile-page__card--links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
          <h2 className="profile-page__card-title">Quick Links</h2>
          <div className="profile-page__links">
            {!isStudent && (
              <a href="/dashboard" className="profile-page__link profile-page__link--dashboard">
                <HiOutlineChartBarSquare />
                <div><strong>My Dashboard</strong><span>View and manage your listings</span></div>
              </a>
            )}
            {isStudent && (
              <>
                <a href="/roommates" className="profile-page__link profile-page__link--roommates">
                  <HiOutlineUserGroup />
                  <div><strong>Roommate Board</strong><span>Find someone to split the rent with</span></div>
                </a>
                <a href="/roommates/post" className="profile-page__link profile-page__link--post">
                  <HiOutlineChatBubbleBottomCenterText />
                  <div><strong>Post a Roommate Request</strong><span>Share a listing and find a roommate</span></div>
                </a>
              </>
            )}
            <a href="/saved-listings" className="profile-page__link">
              <HiOutlineBookmark />
              <div><strong>Saved Listings</strong><span>Properties you have bookmarked</span></div>
            </a>
            <a href="/my-inspections" className="profile-page__link">
              <HiOutlineClipboardDocumentCheck />
              <div><strong>My Inspections</strong><span>Track your booked property visits</span></div>
            </a>
            <a href="/listings" className="profile-page__link">
              <HiOutlineHome />
              <div><strong>Browse Properties</strong><span>Find your next home</span></div>
            </a>
          </div>
        </motion.div>

        {/* ── Danger Zone ── */}
        <motion.div className="profile-page__card profile-page__card--danger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}>
          <h2 className="profile-page__card-title">Account</h2>
          <button className="profile-page__logout-btn" onClick={handleLogout}>
            <HiOutlineArrowRightOnRectangle /> Sign Out
          </button>
        </motion.div>

      </motion.div>
    </main>
  );
}