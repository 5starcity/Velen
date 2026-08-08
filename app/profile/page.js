"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineUser,
  HiOutlinePencilSquare,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineChartBarSquare,
  HiOutlineExclamationTriangle,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineBookmark,
  HiOutlineClipboardDocumentCheck,
  HiOutlineAcademicCap,
  HiOutlineIdentification,
  HiOutlineCamera,
  HiOutlineSparkles,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import {
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
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

// Completeness scoring — student fields only count if student details are relevant
function getCompleteness(data, photoURL, showStudentDetails) {
  const baseFields = [
    !!data.displayName,
    !!data.phone,
    !!data.bio,
    !!photoURL,
  ];
  const studentFields = [
    !!data.university,
    !!data.course,
    !!data.yearOfStudy,
    !!data.gender,
  ];
  const fields = showStudentDetails ? [...baseFields, ...studentFields] : baseFields;
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
    isAlsoStudent: data.isAlsoStudent ?? false,
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

  // "Are you also a student?" toggle (agents/landlords only)
  const [savingAlsoStudent, setSavingAlsoStudent] = useState(false);

  // Tracks that an email verification link was just sent, so we can
  // show a persistent hint instead of relying on the toast alone
  const [emailPendingVerification, setEmailPendingVerification] = useState(false);

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

        if (user.email && data.email && user.email !== data.email) {
          await updateDoc(ref, { email: user.email });
          data = { ...data, email: user.email };
          setEmailPendingVerification(false);
        }
        
        const normalized = normalizeUserDoc(data, user);
        // Write normalized back to fix inconsistent old docs
        await setDoc(ref, normalized, { merge: true });

        setProfileData(normalized);
        setPhotoURL(normalized.photoURL);
        setInputs({
          displayName: normalized.displayName,
          email: normalized.email,
          phone: normalized.phone,
          bio: normalized.bio,
          university: normalized.university,
          course: normalized.course,
          yearOfStudy: normalized.yearOfStudy,
          gender: normalized.gender,
          uniCustom: "",
        });

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

      // Email needs its own flow: Firebase now requires verification
      // before the change takes effect (email enumeration protection
      // blocks the old updateEmail() outright with operation-not-allowed).
      // verifyBeforeUpdateEmail sends a confirmation link to the NEW
      // address and only swaps auth.currentUser.email once they click it —
      // it does not happen in this tab, so we don't write the unverified
      // address to Firestore or profileData yet.
      if (field === "email") {
        await verifyBeforeUpdateEmail(auth.currentUser, updateVal);
        setEditing(prev => ({ ...prev, email: false }));
        setInputs(prev => ({ ...prev, email: profileData.email })); // revert displayed value
        setEmailPendingVerification(true);
        showToast(`Verification link sent to ${updateVal}. Click it to confirm the change.`);
        return;
      }

      await updateDoc(doc(db, "users", user.uid), { [field]: updateVal });

      if (field === "displayName") {
        await updateProfile(auth.currentUser, { displayName: updateVal });
      }
      setProfileData(prev => ({ ...prev, [field]: updateVal }));
      setEditing(prev => ({ ...prev, [field]: false }));
      showToast(`${field === "displayName" ? "Name" : field.charAt(0).toUpperCase() + field.slice(1)} updated.`);
    } catch (e) {
      console.error(e);
      if (e.code === "auth/requires-recent-login") {
        showToast("Please log out and back in before changing your email.", "error");
      } else if (e.code === "auth/email-already-in-use") {
        showToast("That email is already in use.", "error");
      } else if (e.code === "auth/invalid-email") {
        showToast("Enter a valid email address.", "error");
      } else if (e.code === "auth/operation-not-allowed") {
        showToast("Email change isn't enabled for this project. Check Firebase Auth settings.", "error");
      } else {
        showToast("Failed to save. Try again.", "error");
      }
    } finally {
      setSaving(prev => ({ ...prev, [field]: false }));
    }
  }

  async function saveUniversity() {
    const finalValue = uniIsOther ? inputs.uniCustom.trim() : inputs.university;
    if (!finalValue) return;
    await saveField("university", finalValue);
  }

  // ── "Are you also a student?" toggle ──
  async function toggleAlsoStudent() {
    const newValue = !profileData.isAlsoStudent;
    setSavingAlsoStudent(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { isAlsoStudent: newValue });
      setProfileData(prev => ({ ...prev, isAlsoStudent: newValue }));
      showToast(newValue ? "Student details unlocked below." : "Student details hidden.");
    } catch (e) {
      console.error(e);
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSavingAlsoStudent(false);
    }
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

  const isStudentRole = userRole === "student";
  // Student details show for anyone whose role IS student, or who's an
  // agent/landlord that told us they're also a student
  const showStudentDetails = isStudentRole || profileData.isAlsoStudent;
  const completeness = getCompleteness(profileData, photoURL, showStudentDetails);

  // ── Inline edit field renderer ──
  function EditableField({ field, label, icon, placeholder = "Not set", type = "text", multiline = false, hint = null }) {
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
            {hint && <p className="profile-page__muted" style={{ marginTop: 6, fontSize: "0.82rem" }}>{hint}</p>}
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
          </div>

          {/* Link to Settings */}
          <a href="/settings" className="profile-page__settings-link" title="Account settings">
            <HiOutlineCog6Tooth /> Settings
          </a>
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
          <EditableField
            field="email"
            label="Email"
            icon={<HiOutlineEnvelope />}
            placeholder="you@example.com"
            type="email"
            hint="You'll get a verification link at the new address — the change only applies once you click it."
          />
          {emailPendingVerification && (
            <p className="profile-page__muted" style={{ marginTop: -4, marginBottom: 8, fontSize: "0.82rem" }}>
              A verification link was sent to your new email. Your current email stays active until you confirm it.
            </p>
          )}
          <EditableField field="phone" label="Phone" icon={<HiOutlinePhone />} placeholder="e.g. 08012345678" type="tel" />
          <EditableField field="bio" label="Bio" icon={<HiOutlineChatBubbleBottomCenterText />} placeholder="Tell landlords a bit about yourself..." multiline />
        </motion.div>

        {/* ── "Are you also a student?" (agents/landlords only) ── */}
        {!isStudentRole && (
          <motion.div className="profile-page__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}>
            <div className="profile-page__pref-toggle-row">
              <span className="profile-page__pref-toggle-label">
                <HiOutlineAcademicCap /> Are you also a student?
              </span>
              <button
                className={`profile-page__toggle${profileData.isAlsoStudent ? " profile-page__toggle--on" : ""}`}
                onClick={toggleAlsoStudent}
                disabled={savingAlsoStudent}
                aria-label="Toggle also a student"
              >
                <span className="profile-page__toggle-knob" />
              </button>
            </div>
            {!profileData.isAlsoStudent && (
              <p className="profile-page__muted" style={{ marginTop: 4 }}>
                Turn this on if you're studying while listing or managing properties — it'll add your student details below.
              </p>
            )}
          </motion.div>
        )}

        {/* ── Student Details (students + agents/landlords who said yes above) ── */}
        {showStudentDetails && (
          <motion.div className="profile-page__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <h2 className="profile-page__card-title">Student Details</h2>
            <UniversityField />
            <EditableField field="course" label="Course" icon={<HiOutlineIdentification />} placeholder="e.g. Mechanical Engineering" />
            <SelectField field="yearOfStudy" label="Year of Study" icon={<HiOutlineAcademicCap />} options={YEAR_OPTIONS} placeholder="Select year" />
            <SelectField field="gender" label="Gender" icon={<HiOutlineUser />} options={GENDER_OPTIONS} placeholder="Select gender" />
          </motion.div>
        )}

        {/* ── Quick Links ── */}
        <motion.div className="profile-page__card profile-page__card--links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
          <h2 className="profile-page__card-title">Quick Links</h2>
          <div className="profile-page__links">
            {isStudentRole ? (
              <>
                <a href="/saved-listings" className="profile-page__link">
                  <HiOutlineBookmark />
                  <div><strong>Saved Listings</strong><span>Properties you have bookmarked</span></div>
                </a>
                <a href="/my-inspections" className="profile-page__link">
                  <HiOutlineClipboardDocumentCheck />
                  <div><strong>My Inspections</strong><span>Track your booked property visits</span></div>
                </a>
              </>
            ) : (
              <a href="/dashboard" className="profile-page__link profile-page__link--dashboard">
                <HiOutlineChartBarSquare />
                <div><strong>My Dashboard</strong><span>View and manage your listings</span></div>
              </a>
            )}
            <a href="/settings" className="profile-page__link">
              <HiOutlineCog6Tooth />
              <div><strong>Account Settings</strong><span>Password, notifications, payout & more</span></div>
            </a>
          </div>
        </motion.div>

      </motion.div>
    </main>
  );
}