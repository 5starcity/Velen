"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import ListingCard from "@/components/listings/ListingCard";
import { getFavorites } from "@/lib/favorites";
import { fetchListings } from "@/lib/firestoreListings";
import "@/styles/saved-listings.css";

export default function SavedListingsPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/login?returnUrl=/saved");
        return;
      }
      setUser(currentUser);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;

    async function loadPageData() {
      try {
        const [favorites, listings] = await Promise.all([
          Promise.resolve(getFavorites()),
          fetchListings(),
        ]);
        setFavoriteIds(favorites);
        setAllListings(Array.isArray(listings) ? listings : []);
      } catch (error) {
        console.error("Error loading saved listings page:", error);
        setFavoriteIds(getFavorites());
        setAllListings([]);
      } finally {
        setLoading(false);
      }
    }

    loadPageData();

    function handleFavoritesUpdate() {
      setFavoriteIds(getFavorites());
    }

    window.addEventListener("favoritesUpdated", handleFavoritesUpdate);
    return () => window.removeEventListener("favoritesUpdated", handleFavoritesUpdate);
  }, [authChecked]);

  const savedListings = useMemo(() => {
    return allListings.filter((listing) => favoriteIds.includes(listing.id));
  }, [allListings, favoriteIds]);

  if (!authChecked) return null;

  return (
    <main className="sl-page">
      {/* Header */}
      <header className="sl-header">
        <div className="sl-header__eyebrow">
          <svg width="13" height="13" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          Saved Properties
        </div>

        <div className="sl-header__row">

          {!loading && savedListings.length > 0 && (
            <div className="sl-header__meta">
              <p className="sl-header__count">
                <span>{savedListings.length}</span>{" "}
                {savedListings.length === 1 ? "listing" : "listings"} saved
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <section className="sl-content">
        {loading ? (
          <div className="sl-skeleton-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sl-skeleton-card">
                <div className="sl-skeleton-card__img" />
                <div className="sl-skeleton-card__body">
                  <div className="sl-skeleton-card__line sl-skeleton-card__line--title" />
                  <div className="sl-skeleton-card__line sl-skeleton-card__line--sub" />
                  <div className="sl-skeleton-card__line sl-skeleton-card__line--price" />
                </div>
              </div>
            ))}
          </div>
        ) : savedListings.length > 0 ? (
          <div className="sl-grid">
            {savedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="sl-empty">
            <div className="sl-empty__icon-wrap" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h2 className="sl-empty__title">Nothing saved yet</h2>
            <p className="sl-empty__desc">
              Tap the heart on any listing while browsing to save it here.
            </p>
            <a href="/listings" className="sl-empty__cta">
              Browse listings
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </section>
    </main>
  );
}