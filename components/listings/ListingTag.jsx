// components/listings/ListingTag.jsx
// Reusable tag pill used on listing cards and detail pages.

import "@/styles/listing-tag.css";

export default function ListingTag({ tag, size = "sm" }) {
  if (!tag) return null;
  return (
    <span
      className={
        "listing-tag" +
        " listing-tag--" + tag.color +
        " listing-tag--" + size
      }
    >
      <span className="listing-tag__icon" aria-hidden="true">{tag.icon}</span>
      {tag.label}
    </span>
  );
}