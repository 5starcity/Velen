"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import "@/styles/navbar.css";

export default function Navbar() {
  const { user, userRole, logout } = useAuth();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const avatarMenuRef = useRef(null);

  const isStudent = user && userRole === "student";
  const isLandlord = user && userRole === "landlord";

  const initials = user?.displayName?.slice(0, 2).toUpperCase() || "ME";

  // Close avatar dropdown on outside click
  useEffect(() => {
    if (!avatarMenuOpen) return;
    function handleClick(e) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [avatarMenuOpen]);

  // Close drawer / dropdown on route change (Escape key too)
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        setAvatarMenuOpen(false);
        setDrawerOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
      setAvatarMenuOpen(false);
      setDrawerOpen(false);
      router.push("/");
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <Link href="/" className="navbar__logo" aria-label="Rezidence home">
          <div className="navbar__logo-mark">R</div>
          <span className="navbar__logo-text">Rezidence</span>
        </Link>

        {/* ── Desktop actions ── */}
        <div className="navbar__actions">
          {/* Browse rooms — everyone */}
          <Link href="/listings" className="navbar__link">
            Browse rooms
          </Link>

          {/* Roommates — students only */}
          {isStudent && (
            <Link
              href="/roommates"
              className="navbar__icon-link"
              aria-label="Find roommates"
              title="Find roommates"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </Link>
          )}

          {/* Transactions — students & landlords */}
          {(isStudent || isLandlord) && (
            <Link
              href="/transactions"
              className="navbar__icon-link"
              aria-label="Transactions"
              title="Transactions"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </Link>
          )}

          {/* List a room — landlords only */}
          {isLandlord && (
            <Link href="/add-listing" className="navbar__btn-post">
              + List a room
            </Link>
          )}

          {/* Notification bell */}
          {user && <NotificationBell />}

          {/* Avatar dropdown or Sign in */}
          {user ? (
            <div className="navbar__avatar-wrap" ref={avatarMenuRef}>
              <button
                className="navbar__avatar"
                aria-label="Account menu"
                aria-expanded={avatarMenuOpen}
                onClick={() => setAvatarMenuOpen((v) => !v)}
              >
                {initials}
              </button>

              {avatarMenuOpen && (
                <div className="navbar__avatar-menu">
                  <div className="navbar__avatar-menu-header">
                    <span className="navbar__avatar-menu-name">
                      {user.displayName || "My account"}
                    </span>
                    {userRole && (
                      <span className="navbar__avatar-menu-role">{userRole}</span>
                    )}
                  </div>

                  <Link
                    href="/profile"
                    className="navbar__avatar-menu-item"
                    onClick={() => setAvatarMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className="navbar__avatar-menu-item"
                    onClick={() => setAvatarMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="navbar__avatar-menu-item"
                    onClick={() => setAvatarMenuOpen(false)}
                  >
                    Settings
                  </Link>

                  <hr className="navbar__avatar-menu-divider" />

                  <button
                    className="navbar__avatar-menu-item navbar__avatar-menu-item--danger"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="navbar__btn-login">
              Sign in
            </Link>
          )}
        </div>

        {/* ── Mobile actions ── */}
        <div className="navbar__mobile-actions">
          {user && <NotificationBell />}

          <button
            className="navbar__hamburger"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            {drawerOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="drawer">
          {user && (
            <div className="drawer__profile">
              <div className="drawer__profile-avatar">{initials}</div>
              <div className="drawer__profile-info">
                <span className="drawer__profile-name">
                  {user.displayName || "My account"}
                </span>
                {userRole && <span className="drawer__profile-role">{userRole}</span>}
              </div>
            </div>
          )}

          <nav className="drawer__links">
            <Link href="/" className="drawer__link" onClick={() => setDrawerOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Home
            </Link>

            <Link href="/listings" className="drawer__link" onClick={() => setDrawerOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Browse rooms
            </Link>

            {isStudent && (
              <Link href="/roommates" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Find roommates
              </Link>
            )}

            {(isStudent || isLandlord) && (
              <Link href="/transactions" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
                Transactions
              </Link>
            )}

            {user && (
              <>
                <hr className="drawer__divider" />

                <Link href="/dashboard" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="4" />
                    <rect x="14" y="11" width="7" height="10" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  My dashboard
                </Link>

                <Link href="/profile" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </Link>

                <Link href="/settings" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </Link>
              </>
            )}
          </nav>

          {/* List a room — landlords only */}
          {isLandlord && (
            <Link href="/add-listing" className="drawer__post-btn" onClick={() => setDrawerOpen(false)}>
              + List a room
            </Link>
          )}

          {/* Sign in / Sign out */}
          {user ? (
            <button
              className="drawer__signout-btn"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          ) : (
            <Link href="/login" className="drawer__post-btn" onClick={() => setDrawerOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </>
  );
}