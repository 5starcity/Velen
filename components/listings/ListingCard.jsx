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
} from "react-icons/hi2";
import { toggleFavorite, getFavorites } from "@/lib/favorites";
import { getListingTags } from "@/lib/listingTags";
import ListingTag from "@/components/listings/ListingTag";
import "@/styles/listing-card.css";
import "@/styles/listing-tag.css";

export default function ListingCard({ listing }) {
  const [saved, setSaved] = useState(() =>
    getFavorites().includes(listing.id)
  );

  function handleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    const updated = toggleFavorite(listing.id);
    setSaved(updated.includes(listing.id));
  }

  const thumb = listing.images?.[0] || listing.image || null;
  const hasVideo = !!listing.videoUrl;

  // Smart tags — show max 3 on card to avoid crowding
  const tags = getListingTags(listing, { max: 3 });

  return (
    <Link href={"/listings/" + listing.id} className="listing-card">

      {/* ── Thumbnail ── */}
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

        {/* Favourite button */}
        <button
          className={"listing-card__fav" + (saved ? " active" : "")}
          onClick={handleFavorite}
          aria-label={saved ? "Remove from saved" : "Save listing"}
        >
          {saved ? <HiHeart /> : <HiOutlineHeart />}
        </button>

        {/* Tags strip — overlaid on image bottom */}
        {tags.length > 0 && (
          <div className="listing-card__tags">
            {tags.map((tag) => (
              <ListingTag key={tag.key} tag={tag} size="sm" />
            ))}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="listing-card__body">

        {/* Price */}
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

        {/* Title */}
        <h3 className="listing-card__title">{listing.title}</h3>

        {/* Location */}
        <p className="listing-card__location">
          <HiOutlineMapPin />
          {listing.location}
        </p>

        {/* Facts row */}
        <div className="listing-card__facts">
          {listing.type && (
            <span><HiOutlineHomeModern />{listing.type}</span>
          )}
          {listing.beds && (
            <span>{listing.beds} Bed</span>
          )}
          {listing.baths && (
            <span>{listing.baths} Bath</span>
          )}
          {listing.furnishing && (
            <span>{listing.furnishing}</span>
          )}
        </div>

        {/* Stats */}
        <div className="listing-card__stats">
          {(listing.views > 0) && (
            <span className="listing-card__stat">
              <HiOutlineEye />{listing.views}
            </span>
          )}
          {(listing.interests > 0) && (
            <span className="listing-card__stat listing-card__stat--interest">
              <HiOutlineBolt />{listing.interests}
            </span>
          )}
          <span
            className={
              "listing-card__availability " +
              (listing.availability === "Available Now"  ? "available" :
               listing.availability === "Available Soon" ? "soon"      : "unavailable")
            }
          >
            {listing.availability || "Check availability"}
          </span>
        </div>
      </div>
    </Link>
  );
}