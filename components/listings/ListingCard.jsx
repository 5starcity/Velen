// components/listings/ListingCard.jsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HiOutlineMapPin,
  HiOutlineHomeModern,
  HiOutlineHeart,
  HiHeart,
  HiOutlinePlayCircle,
} from "react-icons/hi2";
import { toggleFavorite, getFavorites } from "@/lib/favorites";
import { getListingTags } from "@/lib/listingTags";
import ListingTag from "@/components/listings/ListingTag";
import "@/styles/listing-card.css";
import "@/styles/listing-tag.css";
import "@/styles/listing-card-compact.css";

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

  const thumb = listing.images?.[0] || listing.image || listing.videoThumbnailUrl || null;
  const hasVideo = !!listing.videoUrl;
  const tags = getListingTags(listing, { max: 3 });
  const description = listing.description || listing.summary || "";

  return (
    <Link href={"/listings/" + listing.id} className="listing-card">
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
        <p className="listing-card__price">
          ₦{Number(listing.price).toLocaleString()}
          <span className="listing-card__price-unit">/yr</span>
        </p>

        <h3 className="listing-card__title">{listing.title}</h3>


        <p className="listing-card__location">
          <HiOutlineMapPin />
          {listing.location}
        </p>
      </div>
    </Link>
  );
}