// app/landlord/feature/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  collection, query, where, getDocs,
  doc, updateDoc, addDoc, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  HiOutlineStar,
  HiOutlineCheckCircle,
  HiOutlineMapPin,
  HiOutlineCalendar,
  HiOutlineBolt,
  HiOutlineArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineEye,
  HiCheckBadge,
  HiOutlineXMark,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import Link from "next/link";
import "@/styles/feature-page.css";

const TIERS = [
  {
    id:      "week",
    label:   "1 Week",
    days:    7,
    price:   2000,
    popular: false,
    perks:   ["Homepage hero card", "7 days visibility", "~500 student impressions"],
  },
  {
    id:      "month",
    label:   "1 Month",
    days:    30,
    price:   6000,
    popular: true,
    perks:   ["Homepage hero card", "30 days visibility", "~2,000 student impressions", "Priority in browse results"],
  },
  {
    id:      "quarter",
    label:   "3 Months",
    days:    90,
    price:   15000,
    popular: false,
    perks:   ["Homepage hero card", "90 days visibility", "~6,000 student impressions", "Priority in browse results", "Featured badge on listing page"],
  },
];

function naira(n) {
  return "₦" + Number(n).toLocaleString("en-NG");
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function FeaturePage() {
  const { user, userRole } = useAuth();
  const router             = useRouter();

  const [listings,        setListings]        = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedTier,    setSelectedTier]    = useState(TIERS[1]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [step,            setStep]            = useState("configure"); // configure | activating | success
  const [paying,          setPaying]          = useState(false);
  const [error,           setError]           = useState("");

  // Stored after Paystack confirms — triggers the useEffect below
  const [pendingActivation, setPendingActivation] = useState(null);

  // ── Auth guard ────────────────────────────────────────
  useEffect(() => {
    if (!user)                               { router.push("/login"); return; }
    if (userRole && userRole !== "landlord") { router.push("/"); }
  }, [user, userRole, router]);

  // ── Fetch landlord's listings ─────────────────────────
  useEffect(() => {
    if (!user) return;
    async function fetch() {
      try {
        const q    = query(collection(db, "listings"), where("landlordId", "==", user.uid));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setListings(data);
        if (data.length > 0) setSelectedListing(data[0]);
      } catch (e) {
        setError("Could not load listings — " + e.message);
      } finally {
        setLoadingListings(false);
      }
    }
    fetch();
  }, [user]);

  // ── Firestore activation (runs AFTER Paystack confirms) ──
  // Triggered by setting pendingActivation — keeps onSuccess() synchronous
  useEffect(() => {
    if (!pendingActivation || !user) return;

    const { listingId, tier, txRef } = pendingActivation;
    const expiry = addDays(new Date(), tier.days);

    async function activate() {
      try {
        // 1. Mark listing featured
        await updateDoc(doc(db, "listings", listingId), {
          featured:       true,
          featuredTier:   tier.id,
          featuredAt:     serverTimestamp(),
          featuredExpiry: Timestamp.fromDate(expiry),
          featuredTxRef:  txRef,
        });

        // 2. Write audit record
        await addDoc(collection(db, "featuredPayments"), {
          landlordId:  user.uid,
          listingId,
          tierId:      tier.id,
          tierDays:    tier.days,
          amount:      tier.price,
          txRef,
          activatedAt: serverTimestamp(),
          expiresAt:   Timestamp.fromDate(expiry),
        });

        setStep("success");
      } catch (e) {
        console.error("Activation error:", e.code, e.message);
        setError(
          `Payment confirmed (ref: ${txRef}) but activation failed: ${e.message}. ` +
          `Tap "Retry" or contact support.`
        );
        setStep("configure");
      } finally {
        setPendingActivation(null);
      }
    }

    activate();
  }, [pendingActivation, user]);

  // ── Retry (re-runs activation with the same txRef) ────
  const handleRetry = useCallback(() => {
    if (!selectedListing || !error) return;
    const txRef = error.match(/ref: ([^\s)]+)/)?.[1];
    if (!txRef) return;
    setError("");
    setStep("activating");
    setPendingActivation({ listingId: selectedListing.id, tier: selectedTier, txRef });
  }, [selectedListing, selectedTier, error]);

  // ── Paystack payment ──────────────────────────────────
  const handlePay = useCallback(async () => {
    if (!selectedListing || !user) return;
    setError("");
    setPaying(true);

    // Dynamically import @paystack/inline-js (avoids SSR issues)
    let PaystackPop;
    try {
      const mod  = await import("@paystack/inline-js");
      PaystackPop = mod.default;
    } catch (e) {
      setError("Payment library failed to load. Please refresh and try again.");
      setPaying(false);
      return;
    }

    const txRef = `feat_${Date.now()}_${selectedListing.id.slice(0, 8)}`;

    const popup = new PaystackPop();
    popup.newTransaction({
      key:      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email:    user.email,
      amount:   selectedTier.price * 100,   // kobo
      currency: "NGN",
      ref:      txRef,
      metadata: {
        landlord_id: user.uid,
        listing_id:  selectedListing.id,
        tier_id:     selectedTier.id,
      },

      // ── onSuccess must be SYNCHRONOUS ────────────────
      // Do NOT use async here — Paystack doesn't await it.
      // Store result in state; useEffect above handles the Firestore write.
      onSuccess(transaction) {
        setPaying(false);
        setStep("activating");
        setPendingActivation({
          listingId: selectedListing.id,
          tier:      selectedTier,
          txRef:     transaction.reference,
        });
      },

      onCancel() {
        setPaying(false);
      },
    });
  }, [selectedListing, selectedTier, user]);

  // ── Loading ───────────────────────────────────────────
  if (!user || loadingListings) {
    return (
      <div className="fp-loading">
        <div className="fp-spinner" />
        <span>Loading your listings…</span>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="fp-empty-page">
        <div className="fp-empty-card">
          <HiOutlineStar className="fp-empty-icon" />
          <h2>No listings yet</h2>
          <p>You need at least one listing before you can feature it on the homepage.</p>
          <Link href="/add-listing" className="fp-btn fp-btn--primary">Add a Listing</Link>
        </div>
      </div>
    );
  }

  // ── Activating ────────────────────────────────────────
  if (step === "activating") {
    return (
      <div className="fp-loading">
        <div className="fp-spinner" />
        <span>Activating your listing…</span>
        <p className="fp-activating-sub">Payment confirmed. Setting up your featured slot.</p>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="fp-success-page">
        <div className="fp-success-card">
          <div className="fp-success-icon"><HiOutlineCheckCircle /></div>
          <h2>You're featured!</h2>
          <p>
            <strong>{selectedListing?.title}</strong> is now live on the Velen
            homepage for <strong>{selectedTier.label}</strong>.
          </p>
          <div className="fp-success-meta">
            <span><HiOutlineCalendar /> Expires in {selectedTier.days} days</span>
            <span><HiOutlineEye /> Visible to all students now</span>
          </div>
          <div className="fp-success-actions">
            <Link href="/landlord/dashboard" className="fp-btn fp-btn--primary">Go to Dashboard</Link>
            <Link href="/" className="fp-btn fp-btn--ghost">View Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  const expiry = addDays(new Date(), selectedTier.days);

  // ── Main UI ───────────────────────────────────────────
  return (
    <div className="fp">
      <div className="fp__container">

        <Link href="/landlord/dashboard" className="fp__back">
          <HiOutlineArrowLeft /> Back to Dashboard
        </Link>

        <div className="fp__header">
          <div className="fp__header-badge"><HiOutlineStar /> Featured Placement</div>
          <h1>Boost your listing's visibility</h1>
          <p>Your listing appears in the hero section of the Velen homepage — the first thing every student sees.</p>
        </div>

        <div className="fp__grid">

          {/* ── Left ── */}
          <div className="fp__left">

            <div className="fp__section">
              <div className="fp__section-label">
                <span className="fp__step-num">1</span>
                Choose a listing to feature
              </div>
              <div className="fp__listing-list">
                {listings.map((l) => {
                  const active          = selectedListing?.id === l.id;
                  const alreadyFeatured = l.featured && l.featuredExpiry?.toDate?.() > new Date();
                  return (
                    <button
                      key={l.id}
                      className={`fp__listing-option${active ? " active" : ""}`}
                      onClick={() => setSelectedListing(l)}
                    >
                      <div className="fp__listing-thumb">
                        {l.images?.[0]
                          ? <img src={l.images[0]} alt={l.title} />
                          : <HiOutlineMapPin />}
                      </div>
                      <div className="fp__listing-info">
                        <span className="fp__listing-title">{l.title}</span>
                        <span className="fp__listing-location">
                          <HiOutlineMapPin /> {l.location}
                        </span>
                        {alreadyFeatured && (
                          <span className="fp__listing-tag fp__listing-tag--featured">
                            <HiOutlineStar /> Currently featured
                          </span>
                        )}
                        {l.verified && (
                          <span className="fp__listing-tag fp__listing-tag--verified">
                            <HiCheckBadge /> Verified
                          </span>
                        )}
                      </div>
                      <div className={`fp__listing-radio${active ? " active" : ""}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="fp__section">
              <div className="fp__section-label">
                <span className="fp__step-num">2</span>
                Choose a duration
              </div>
              <div className="fp__tiers">
                {TIERS.map((tier) => (
                  <button
                    key={tier.id}
                    className={`fp__tier${selectedTier.id === tier.id ? " active" : ""}${tier.popular ? " popular" : ""}`}
                    onClick={() => setSelectedTier(tier)}
                  >
                    {tier.popular && <div className="fp__tier-popular">Most popular</div>}
                    <div className="fp__tier-top">
                      <span className="fp__tier-label">{tier.label}</span>
                      <span className="fp__tier-price">{naira(tier.price)}</span>
                    </div>
                    <div className="fp__tier-perks">
                      {tier.perks.map((p) => (
                        <div key={p} className="fp__tier-perk">
                          <HiOutlineCheckCircle /> {p}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ── Right: summary ── */}
          <div className="fp__right">
            <div className="fp__summary">
              <div className="fp__summary-title"><HiOutlineStar /> Order Summary</div>

              <div className="fp__summary-listing">
                <div className="fp__summary-thumb">
                  {selectedListing?.images?.[0]
                    ? <img src={selectedListing.images[0]} alt={selectedListing.title} />
                    : <HiOutlineMapPin />}
                </div>
                <div>
                  <div className="fp__summary-listing-title">{selectedListing?.title || "—"}</div>
                  <div className="fp__summary-listing-loc">
                    <HiOutlineMapPin /> {selectedListing?.location || "—"}
                  </div>
                </div>
              </div>

              <div className="fp__summary-rows">
                <div className="fp__summary-row">
                  <span>Placement</span><span>Homepage hero</span>
                </div>
                <div className="fp__summary-row">
                  <span>Duration</span><span>{selectedTier.label}</span>
                </div>
                <div className="fp__summary-row">
                  <span>Expires</span>
                  <span>{expiry.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>

              <div className="fp__summary-total">
                <span>Total</span>
                <span>{naira(selectedTier.price)}</span>
              </div>

              {error && (
                <div className="fp__error">
                  <HiOutlineXMark />
                  <div>
                    <span>{error}</span>
                    <button className="fp__retry-btn" onClick={handleRetry}>
                      <HiOutlineArrowPath /> Retry activation
                    </button>
                  </div>
                </div>
              )}

              <button
                className="fp__pay-btn"
                onClick={handlePay}
                disabled={paying || !selectedListing}
              >
                {paying
                  ? <><span className="fp__mini-spinner" /> Opening payment…</>
                  : <><HiOutlineBolt /> Pay {naira(selectedTier.price)} · Feature Listing</>
                }
              </button>

              <div className="fp__summary-trust">
                <div><HiOutlineShieldCheck /> Secured by Paystack</div>
                <div><HiOutlineCheckCircle /> Activated instantly on payment</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}