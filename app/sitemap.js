// app/sitemap.js
import { adminDb } from "@/lib/firebase-admin";

function safeDate(value) {
  if (!value) return new Date();

  // Firestore Timestamp object (has .toDate())
  if (typeof value?.toDate === "function") {
    const d = value.toDate();
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // Firestore Timestamp-like plain object { seconds, nanoseconds }
  if (typeof value === "object" && typeof value.seconds === "number") {
    const d = new Date(value.seconds * 1000);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  // String, number, or Date
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap() {
  const baseUrl = "https://rezidence.ng";

  // Static routes
  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/listings`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/roommates`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },

    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/add-listing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/verify-landlord`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  // Dynamic listing routes — only active (non-taken) listings
  let listingRoutes = [];
  try {
    const snapshot = await adminDb.collection("listings").get();
    listingRoutes = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        if (data.status === "taken") return null; // skip taken listings
        return {
          url: `${baseUrl}/listings/${doc.id}`,
          lastModified: safeDate(data.updatedAt),
          changeFrequency: "weekly",
          priority: 0.8,
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error("Sitemap: failed to fetch listings", error);
  }

  return [...staticRoutes, ...listingRoutes];
}