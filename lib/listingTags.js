// lib/listingTags.js
// Computes smart tags for a listing from its existing data.
// No new Firestore fields required — everything is derived at render time.

import { UST_GATE_AREAS } from "@/lib/locations";

// Price thresholds (annual rent in Naira)
const AFFORDABLE_THRESHOLD    = 250_000;
const STUDENT_PRICE_THRESHOLD = 350_000;
const HIGH_DEMAND_RATE        = 15;   // conversion % (interests/views * 100)
const MIN_VIEWS_FOR_RATE      = 5;    // don't show conversion tag below this

export const TAG_CONFIG = {
  affordable: {
    key:    "affordable",
    label:  "Affordable",
    icon:   "₦",
    color:  "green",
  },
  studentFriendly: {
    key:    "studentFriendly",
    label:  "Student Friendly",
    icon:   "🎓",
    color:  "blue",
  },
  highDemand: {
    key:    "highDemand",
    label:  "High Demand",
    icon:   "🔥",
    color:  "orange",
  },
  availableNow: {
    key:    "availableNow",
    label:  "Available Now",
    icon:   "✓",
    color:  "green",
  },
  verified: {
    key:    "verified",
    label:  "Verified",
    icon:   "✓",
    color:  "teal",
  },
  spacious: {
    key:    "spacious",
    label:  "Spacious",
    icon:   "⬛",
    color:  "purple",
  },
};

/**
 * Returns an array of tag config objects that apply to the given listing.
 * Tags are ordered by importance: high demand → verified → available → affordable → student → spacious
 *
 * @param {Object} listing - Firestore listing document
 * @param {Object} options
 * @param {number} [options.max] - Max tags to return (default: all)
 * @returns {Array<{key, label, icon, color}>}
 */
export function getListingTags(listing, { max } = {}) {
  if (!listing) return [];

  const price      = Number(listing.price)     || 0;
  const views      = Number(listing.views)     || 0;
  const interests  = Number(listing.interests) || 0;
  const beds       = Number(listing.beds)      || 1;
  const location   = listing.location          || "";
  const conversion = views >= MIN_VIEWS_FOR_RATE
    ? (interests / views) * 100
    : 0;

  const isUstArea = UST_GATE_AREAS.some(
    (area) => location.toLowerCase().includes(area.toLowerCase().split(" ")[0])
  );

  const tags = [];

  if (conversion >= HIGH_DEMAND_RATE) {
    tags.push(TAG_CONFIG.highDemand);
  }

  if (listing.verified) {
    tags.push(TAG_CONFIG.verified);
  }

  if (listing.availability === "Available Now") {
    tags.push(TAG_CONFIG.availableNow);
  }

  if (price > 0 && price <= AFFORDABLE_THRESHOLD) {
    tags.push(TAG_CONFIG.affordable);
  }

  if (price > 0 && price <= STUDENT_PRICE_THRESHOLD && isUstArea) {
    tags.push(TAG_CONFIG.studentFriendly);
  }

  if (beds >= 2) {
    tags.push(TAG_CONFIG.spacious);
  }

  return max ? tags.slice(0, max) : tags;
}