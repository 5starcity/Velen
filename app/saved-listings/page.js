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

  // Step 1 — check auth first, redirect if not logged in
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

  // Step 2 — load data only after auth confirmed
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

  // Don't render anything until auth check resolves
  if (!authChecked) return null;

  return (
    <main className="saved-listings-page">
      <div className="saved-listings-page__header">
        <p className="saved-listings-page__tag">Saved Properties</p>
        <h1>Your favorite listings</h1>
        <p>
          Keep track of the houses you like and compare them before making a move.
        </p>
      </div>

      {loading ? (
        <div className="saved-listings-page__empty">
          <h3>Loading saved listings...</h3>
        </div>
      ) : savedListings.length > 0 ? (
        <div className="saved-listings-page__grid">
          {savedListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="saved-listings-page__empty">
          <h3>No saved listings yet</h3>
          <p>Start saving properties you like and they'll appear here.</p>
        </div>
      )}
    </main>
  );
}