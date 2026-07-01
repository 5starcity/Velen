"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import "@/styles/navbar.css";

export default function Navbar() {
  const { user, userRole } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isStudent = user && userRole === "student";
  const isLandlord = user && userRole === "landlord";

  return (
    <>
      <nav className="navbar">

        {/* Logo — always links home */}
        <Link href="/" className="navbar__logo" aria-label="Rezidence home">
          <div className="navbar__logo-mark">R</div>
          <span className="navbar__logo-text">Rezidence</span>
        </Link>

        {/* ── Desktop actions ── */}
        <div className="navbar__actions">

          {/* Everyone sees Browse */}
          <Link href="/listings" className="navbar__link">Browse</Link>

          {/* Only logged-in users see Roommates */}
          {user && (
            <Link href="/roommates" className="navbar__link">Roommates</Link>
          )}

          {/* Notification bell — logged in only */}
          {user && (
            <Link href="/notifications" className="navbar__notif" aria-label="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </Link>
          )}

          {/* List a room — students + landlords only */}
          {(isStudent || isLandlord) && (
            <Link href="/add-listing" className="navbar__btn-post">+ List a room</Link>
          )}

          {/* Avatar or Sign in */}
          {user ? (
            <Link href="/dashboard" className="navbar__avatar" aria-label="Dashboard">
              {user.displayName?.slice(0, 2).toUpperCase() || "ME"}
            </Link>
          ) : (
            <Link href="/login" className="navbar__btn-login">Sign in</Link>
          )}
        </div>

        {/* ── Mobile actions ── */}
        <div className="navbar__mobile-actions">

          {user && (
            <Link href="/notifications" className="navbar__icon-btn" aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </Link>
          )}

          <button
            className="navbar__hamburger"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            {drawerOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="drawer">
          <nav className="drawer__links">

            <Link href="/" className="drawer__link" onClick={() => setDrawerOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Home
            </Link>

            <Link href="/listings" className="drawer__link" onClick={() => setDrawerOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Browse rooms
            </Link>

            {user && (
              <Link href="/roommates" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Find roommates
              </Link>
            )}

            {user && (
              <Link href="/notifications" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                Notifications
              </Link>
            )}

            <hr className="drawer__divider" />

            {user ? (
              <>
                <Link href="/dashboard" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="4"/><rect x="14" y="11" width="7" height="10"/><rect x="3" y="14" width="7" height="7"/></svg>
                  My dashboard
                </Link>
                <Link href="/settings" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Settings
                </Link>
              </>
            ) : (
              <Link href="/login" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Sign in
              </Link>
            )}
          </nav>

          {(isStudent || isLandlord) && (
            <Link href="/add-listing" className="drawer__post-btn" onClick={() => setDrawerOpen(false)}>
              + List a room
            </Link>
          )}
        </div>
      )}
    </>
  );
}