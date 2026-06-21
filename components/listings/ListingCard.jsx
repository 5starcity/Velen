// components/listings/ListingCard.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HiOutlineMapPin,
  HiOutlineHomeModern,
  HiOutlineEye,
  HiOutlineBolt,
  HiOutlineHeart,
  HiHeart,
  HiOutlinePlayCircle,
  HiOutlineExclamationTriangle,
  HiOutlineFlag,
} from "react-icons/hi2";
import { toggleFavorite, getFavorites } from "@/lib/favorites";
import { getListingTags } from "@/lib/listingTags";
import ListingTag from "@/components/listings/ListingTag";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "@/styles/listing-card.css";
import "@/styles/listing-tag.css";
import "@/styles/listing-card-compact.css";

// Listings below this price are flagged as suspiciously cheap
const SCAM_PRICE_THRESHOLD = 50000;

export default function ListingCard({ listing }) {
  const [saved, setSaved] = useState(() =>
    getFavorites().includes(listing.id)
  );
  const [reported, setReported] = useState(false);
  const [reporting, setReporting] = useState(false);

  function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    const updated = toggleFavorite(listing.id);
    setSaved(updated.includes(listing.id));
  }

  async function handleReport(e) {
    e.preventDefault();
    e.stopPropagation();
    if (reported || reporting) return;

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert("You need to be logged in to report a listing.");
      return;
    }

    setReporting(true);
    try {
      await addDoc(collection(db, "reports"), {
        listingId: listing.id,
        listingTitle: listing.title || "",
        reportedBy: user.uid,
        reason: "Flagged by user from listing card",
        createdAt: serverTimestamp(),
      });
      setReported(true);
    } catch (err) {
      console.error("Report failed:", err);
      alert("Could not submit report. Try again.");
    } finally {
      setReporting(false);
    }
  }

  const thumb = listing.images?.[0] || listing.image || listing.videoThumbnailUrl || null;
  const hasVideo = !!listing.videoUrl;
  const tags = getListingTags(listing, { max: 3 });
  const isScamRisk =
    !listing.verified && Number(listing.price) > 0 && Number(listing.price) < SCAM_PRICE_THRESHOLD;

  return (
    <Link href={"/listings/" + listing.id} className="listing-card">

      {/* Scam warning banner */}
      {isScamRisk && (
        <div className="listing-card__scam-warning" onClick={(e) => e.preventDefault()}>
          <HiOutlineExclamationTriangle />
          <span>Price seems unusually low — verify before paying</span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="listing-card__thumb">
        {thumb ? (
          <img src={thumb} alt={listing.title} loading="lazy" />
        ) : hasVideo ? (
          <div className="listing-card__thumb-video">
            <HiOutlinePlayCircle />
            <span>Video tour</span>
          </div>
        ) : (
          <div className="listing-card__thumb-empty">
            <HiOutlineHomeModern />
          </div>
        )}

        <button
          className={"listing-card__fav" + (saved ? " active" : "")}
          onClick={handleFavorite}
          aria-label={saved ? "Remove from saved" : "Save listing"}
        >
          {saved ? <HiHeart /> : <HiOutlineHeart />}
        </button>

        {tags.length > 0 && (
          <div className="listing-card__tags">
            {tags.map((tag) => (
              <ListingTag key={tag.key} tag={tag} size="sm" />
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="listing-card__body">
        <div className="listing-card__price-row">
          <p className="listing-card__price">
            ₦{Number(listing.price).toLocaleString()}
            <span className="listing-card__price-unit">/yr</span>
          </p>
          {listing.totalMoveInCost && listing.totalMoveInCost > Number(listing.price) && (
            <p className="listing-card__movein">
              ₦{Number(listing.totalMoveInCost).toLocaleString()} total
            </p>
          )}
        </div>

        <h3 className="listing-card__title">{listing.title}</h3>

{/* Clickable agent name — uses span + onClick to avoid nested <a> */}
{listing.landlordId && listing.landlordName && (
  <span
    className="listing-card__agent"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = "/agent/" + listing.landlordId;
    }}
  >
    {listing.landlordName}
  </span>
)}
        <p className="listing-card__location">
          <HiOutlineMapPin />
          {listing.location}
        </p>

        <div className="listing-card__facts">
          {listing.type && <span><HiOutlineHomeModern />{listing.type}</span>}
          {listing.beds && <span>{listing.beds} Bed</span>}
          {listing.baths && <span>{listing.baths} Bath</span>}
          {listing.furnishing && <span>{listing.furnishing}</span>}
        </div>

        <div className="listing-card__stats">
          {listing.views > 0 && (
            <span className="listing-card__stat">
              <HiOutlineEye />{listing.views}
            </span>
          )}
          {listing.interests > 0 && (
            <span className="listing-card__stat listing-card__stat--interest">
              <HiOutlineBolt />{listing.interests}
            </span>
          )}
          <span
            className={
              "listing-card__availability " +
              (listing.availability === "Available Now" ? "available" :
               listing.availability === "Available Soon" ? "soon" : "unavailable")
            }
          >
            {listing.availability || "Check availability"}
          </span>

          {/* Report button */}
          <button
            className={"listing-card__report" + (reported ? " reported" : "")}
            onClick={handleReport}
            aria-label="Report listing"
            disabled={reported || reporting}
          >
            <HiOutlineFlag />
            <span>{reported ? "Reported" : "Report"}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}