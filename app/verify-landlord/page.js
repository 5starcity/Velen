// app/verify-landlord/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { submitVerificationRequest } from "@/lib/verification";
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineIdentification,
  HiOutlineBuildingLibrary,
  HiOutlineCreditCard,
  HiOutlineHomeModern,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import "@/styles/verify-landlord.css";

// Nigerian banks with their Paystack bank codes
const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank Nigeria", code: "023" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Globus Bank", code: "00103" },
  { name: "GTBank", code: "058" },
  { name: "Heritage Bank", code: "030" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda Bank", code: "090267" },
  { name: "Opay", code: "100004" },
  { name: "Palmpay", code: "100033" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Standard Chartered", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "Titan Bank", code: "102" },
  { name: "UBA", code: "033" },
  { name: "Union Bank", code: "032" },
  { name: "Unity Bank", code: "215" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
];

const STEPS = ["Personal Info", "Identity", "Bank Details", "Property Info"];

export default function VerifyLandlordPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);

  const [form, setForm] = useState({
    // Personal
    name: "",
    phone: "",
    email: "",
    address: "",
    // Identity
    nin: "",
    // Bank
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    // Property
    propertyType: "",
    yearsActive: "",
    listingCount: "",
  });

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (userRole && userRole !== "landlord") router.push("/");
    // Pre-fill from auth
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || "",
      }));
    }
  }, [user, userRole]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    // Reset account verification if bank details change
    if (name === "accountNumber" || name === "bankCode") {
      setAccountVerified(false);
    }
  }

  async function verifyBankAccount() {
    if (!form.accountNumber || form.accountNumber.length < 10) {
      setError("Enter a valid 10-digit account number.");
      return;
    }
    if (!form.bankCode) {
      setError("Please select a bank first.");
      return;
    }
    setVerifyingAccount(true);
    setError("");
    try {
      const res = await fetch(
        `/api/paystack/verify-account?account_number=${form.accountNumber}&bank_code=${form.bankCode}`
      );
      const data = await res.json();
      if (data.account_name) {
        setForm((prev) => ({ ...prev, accountName: data.account_name }));
        setAccountVerified(true);
      } else {
        setError("Could not verify account. Check the number and bank.");
      }
    } catch (e) {
      setError("Verification failed. Try again.");
    } finally {
      setVerifyingAccount(false);
    }
  }

  function validateStep() {
    if (step === 0) {
      if (!form.name.trim()) { setError("Full name is required."); return false; }
      if (!form.phone.trim()) { setError("Phone number is required."); return false; }
      if (!form.address.trim()) { setError("Address is required."); return false; }
    }
    if (step === 1) {
      if (!form.nin.trim() || form.nin.length < 11) {
        setError("Enter a valid 11-digit NIN."); return false;
      }
    }
    if (step === 2) {
      if (!form.bankCode) { setError("Select your bank."); return false; }
      if (!form.accountNumber.trim()) { setError("Account number is required."); return false; }
      if (!accountVerified) { setError("Please verify your account number first."); return false; }
    }
    if (step === 3) {
      if (!form.propertyType) { setError("Select a property type."); return false; }
    }
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    setError("");
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError("");
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);
    setError("");
    try {
      // Create Paystack subaccount
      const subRes = await fetch("/api/paystack/create-subaccount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: form.name,
          bank_code: form.bankCode,
          account_number: form.accountNumber,
          uid: user.uid,
        }),
      });
      const subData = await subRes.json();
      if (subData.error) {
        setError("Failed to set up payment account: " + subData.error);
        setLoading(false);
        return;
      }

      await submitVerificationRequest(user.uid, {
        ...form,
        paystackSubaccount: subData.subaccount_code,
      });

      setSubmitted(true);
    } catch (e) {
      console.error("Verification submit error:", e);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!user || userRole !== "landlord") return null;

  if (submitted) {
    return (
      <div className="verify-page">
        <motion.div
          className="verify-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="verify-success__icon"><HiOutlineCheckCircle /></div>
          <h1>Submitted!</h1>
          <p>
            Your verification request has been received. We'll review your details
            and notify you once approved. You can start adding listings while you wait.
          </p>
          <button className="verify-btn" onClick={() => router.push("/add-listing")}>
            Add a Listing
          </button>
          <button className="verify-btn verify-btn--ghost" onClick={() => router.push("/")}>
            Go to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="verify-page">
      <motion.div
        className="verify-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="verify-header">
          <h1>Landlord Verification</h1>
          <p>Complete your profile to list properties and receive payments on rezidence.</p>
        </div>

        {/* Step indicators */}
        <div className="verify-steps">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={"verify-step" + (i === step ? " active" : i < step ? " done" : "")}
            >
              <div className="verify-step__dot">{i < step ? "✓" : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="verify-error">
            <HiOutlineExclamationTriangle /> {error}
          </div>
        )}

        {/* Step 0 — Personal Info */}
        {step === 0 && (
          <motion.div className="verify-form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
            <div className="verify-field">
              <label><HiOutlineUser /> Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your full legal name" required />
            </div>
            <div className="verify-field">
              <label><HiOutlinePhone /> Phone Number</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 08012345678" required />
            </div>
            <div className="verify-field">
              <label><HiOutlineUser /> Email</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" type="email" />
            </div>
            <div className="verify-field">
              <label><HiOutlineMapPin /> Residential Address</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="Your home/business address" required />
            </div>
          </motion.div>
        )}

        {/* Step 1 — Identity */}
        {step === 1 && (
          <motion.div className="verify-form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
            <div className="verify-field">
              <label><HiOutlineIdentification /> NIN (National Identity Number)</label>
              <input
                name="nin"
                value={form.nin}
                onChange={handleChange}
                placeholder="11-digit NIN"
                maxLength={11}
                required
              />
              <p className="verify-hint">Your NIN is used for identity verification only and is never shared publicly.</p>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Bank Details */}
        {step === 2 && (
          <motion.div className="verify-form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
            <p className="verify-section-note">
              Your bank details are used to receive rent payments from students via rezidence. rezidence takes a 10% service fee per transaction.
            </p>
            <div className="verify-field">
              <label><HiOutlineBuildingLibrary /> Bank Name</label>
              <select
                name="bankCode"
                value={form.bankCode}
                onChange={(e) => {
                  const bank = NIGERIAN_BANKS.find((b) => b.code === e.target.value);
                  setForm((prev) => ({
                    ...prev,
                    bankCode: e.target.value,
                    bankName: bank?.name || "",
                  }));
                  setAccountVerified(false);
                }}
              >
                <option value="">Select your bank</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="verify-field">
              <label><HiOutlineCreditCard /> Account Number</label>
              <div className="verify-field__row">
                <input
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  placeholder="10-digit account number"
                  maxLength={10}
                  required
                />
                <button
                  type="button"
                  className="verify-verify-btn"
                  onClick={verifyBankAccount}
                  disabled={verifyingAccount}
                >
                  {verifyingAccount ? "Verifying..." : "Verify"}
                </button>
              </div>
            </div>
            {accountVerified && (
              <motion.div
                className="verify-account-confirmed"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <HiOutlineCheckCircle />
                <span>Account confirmed: <strong>{form.accountName}</strong></span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Step 3 — Property Info */}
        {step === 3 && (
          <motion.div className="verify-form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
            <div className="verify-field">
              <label><HiOutlineHomeModern /> Type of properties you list</label>
              <select name="propertyType" value={form.propertyType} onChange={handleChange}>
                <option value="">Select type</option>
                <option value="Self Contain">Self Contain</option>
                <option value="Flat/Apartment">Flat / Apartment</option>
                <option value="Shared Room">Shared Room</option>
                <option value="Mixed">Mixed (multiple types)</option>
              </select>
            </div>
            <div className="verify-field">
              <label>How long have you been renting properties?</label>
              <select name="yearsActive" value={form.yearsActive} onChange={handleChange}>
                <option value="">Select range</option>
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1-3 years">1–3 years</option>
                <option value="3-5 years">3–5 years</option>
                <option value="5+ years">5+ years</option>
              </select>
            </div>
            <div className="verify-field">
              <label>How many properties do you currently manage?</label>
              <select name="listingCount" value={form.listingCount} onChange={handleChange}>
                <option value="">Select range</option>
                <option value="1-2">1–2</option>
                <option value="3-5">3–5</option>
                <option value="6-10">6–10</option>
                <option value="10+">10+</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="verify-nav">
          {step > 0 && (
            <button className="verify-btn verify-btn--ghost" onClick={handleBack}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="verify-btn" onClick={handleNext}>
              Continue
            </button>
          ) : (
            <button className="verify-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit Verification"}
            </button>
          )}
        </div>

        {step === 0 && (
          <button
            type="button"
            className="verify-skip"
            onClick={() => router.push("/")}
          >
            Skip for now
          </button>
        )}
      </motion.div>
    </div>
  );
}