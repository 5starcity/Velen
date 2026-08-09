"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/notifications/NotificationBell";
import "@/styles/navbar.css";

const CATEGORIES = [
  { label: "Self Contain", value: "self-contain" },
  { label: "Mini Flat", value: "mini-flat" },
  { label: "1 Bedroom", value: "1-bedroom" },
  { label: "2 Bedroom", value: "2-bedroom" },
  { label: "Shared Apartment", value: "shared" },
  { label: "Duplex", value: "duplex" },
];

export default function Navbar() {
  const { user: authUser, userRole, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("type") || "rent";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const user = mounted ? authUser : null;

  const avatarMenuRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  const initials = user?.displayName?.slice(0, 2).toUpperCase() || "ME";

  const pathSegments = (pathname || "").split("/").filter(Boolean);
  const isListingDetailPage = pathSegments[0] === "listings" && pathSegments.length === 2;

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

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        setAvatarMenuOpen(false);
        setDrawerOpen(false);
        setMobileSearchOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (drawerOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [drawerOpen]);

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

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    router.push("/listings?q=" + encodeURIComponent(trimmed));
    setMobileSearchOpen(false);
  }

  return (
    <>
      <nav className="navbar">
        {/* Logo */}
        <Link href="/" className="navbar__logo" aria-label="Rezidence home">
          <div className="navbar__logo-mark">R</div>
          <span className="navbar__logo-text">Rezidence</span>
        </Link>

        {isListingDetailPage && (
          <form className="navbar__search" onSubmit={handleSearchSubmit}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="navbar__search-icon">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="navbar__search-input"
              placeholder="Search another location or property..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </form>
        )}

        {/* ── Desktop actions ── */}
        <div className="navbar__actions">
          <Link href="/listings" className="navbar__link">
            Browse
          </Link>

          {/* Add listing — open to everyone, signed in or not */}
          <Link href="/add-listing" className="navbar__btn-post">
            + Add Listing
          </Link>

          {user && (
            <>
              <Link href="/saved" className="navbar__icon-link" aria-label="Saved homes" title="Saved homes">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V4.5a1 1 0 0 1 1-1Z" />
                </svg>
              </Link>

              <NotificationBell />

              <Link href="/chat" className="navbar__icon-link" aria-label="Messages" title="Messages">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
                </svg>
              </Link>
            </>
          )}

          {user ? (
            <div className="navbar__avatar-wrap" ref={avatarMenuRef}>
              <button
                className="navbar__avatar-btn"
                aria-label="Account menu"
                aria-expanded={avatarMenuOpen}
                onClick={() => setAvatarMenuOpen((v) => !v)}
              >
                <span className="navbar__avatar">{initials}</span>
              </button>

              {avatarMenuOpen && (
                <div className="navbar__avatar-menu">
                  <div className="navbar__avatar-menu-header">
                    <span className="navbar__avatar-menu-avatar">{initials}</span>
                    <div className="navbar__avatar-menu-who">
                      <span className="navbar__avatar-menu-name">
                        {user.displayName || "My account"}
                      </span>
                      {userRole && <span className="navbar__avatar-menu-role">{userRole}</span>}
                    </div>
                  </div>

                  <hr className="navbar__avatar-menu-divider" />

                  <Link href="/dashboard" className="navbar__avatar-menu-item" onClick={() => setAvatarMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link href="/profile" className="navbar__avatar-menu-item" onClick={() => setAvatarMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link href="/settings" className="navbar__avatar-menu-item" onClick={() => setAvatarMenuOpen(false)}>
                    Settings
                  </Link>

                  <hr className="navbar__avatar-menu-divider" />

                  <button
                    className="navbar__avatar-menu-item navbar__avatar-menu-item--danger"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    {signingOut ? "Signing out…" : "Log out"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="navbar__guest-actions">
              <Link href="/login" className="navbar__link">
                Log in
              </Link>
              <Link href="/signup" className="navbar__btn-signup">
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile actions ── */}
        <div className="navbar__mobile-actions">
          <button
            className="navbar__icon-btn-mobile"
            aria-label={mobileSearchOpen ? "Close search" : "Search"}
            aria-expanded={mobileSearchOpen}
            onClick={() => { setMobileSearchOpen((v) => !v); setDrawerOpen(false); }}
          >
            {mobileSearchOpen ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            )}
          </button>

          {user && <NotificationBell />}

          <button
            className="navbar__hamburger"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            onClick={() => { setDrawerOpen((v) => !v); setMobileSearchOpen(false); }}
          >
            {drawerOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileSearchOpen && (
        <form className="navbar__mobile-search-row" onSubmit={handleSearchSubmit}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="navbar__search-icon">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={mobileSearchInputRef}
            type="text"
            className="navbar__mobile-search-input"
            placeholder="Search location, e.g. Rumuokoro..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button type="submit" className="navbar__mobile-search-go">Go</button>
        </form>
      )}

      {drawerOpen && (
        <>
          <div className="drawer__scrim" onClick={() => setDrawerOpen(false)} />
          <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="drawer__header">
              <div className="drawer__header-logo">
                <div className="drawer__header-logo-mark">R</div>
                <span className="drawer__header-logo-text">Rezidence</span>
              </div>
              <button className="drawer__close-btn" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="drawer__body">
              {user && (
                <div className="drawer__profile">
                  <span className="drawer__profile-avatar">{initials}</span>
                  <div className="drawer__profile-info">
                    <span className="drawer__profile-name">{user.displayName || "My account"}</span>
                    {userRole && <span className="drawer__profile-role">{userRole}</span>}
                  </div>
                </div>
              )}

              <span className="drawer__section-label">Explore</span>
              <nav className="drawer__links">
                <Link href="/" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                  <span className="drawer__link-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </span>
                  Home
                </Link>

                <Link href="/listings" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                  <span className="drawer__link-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </span>
                  Browse listings
                </Link>
              </nav>

              <span className="drawer__section-label">Categories</span>
              <div className="drawer__categories">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.value}
                    href={`/listings?type=${cat.value}`}
                    className={activeCategory === cat.value ? "drawer__category drawer__category--active" : "drawer__category"}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>

              {user && (
                <>
                  <span className="drawer__section-label">Account</span>
                  <nav className="drawer__links">
                    <Link href="/saved" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                      <span className="drawer__link-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.2L5 21V4.5a1 1 0 0 1 1-1Z" />
                        </svg>
                      </span>
                      Saved homes
                    </Link>

                    <Link href="/chat" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                      <span className="drawer__link-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-5 4v-4H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
                        </svg>
                      </span>
                      Messages
                    </Link>

                    <Link href="/dashboard" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                      <span className="drawer__link-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="4" />
                          <rect x="14" y="11" width="7" height="10" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                      </span>
                      My dashboard
                    </Link>

                    <Link href="/profile" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                      <span className="drawer__link-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      Profile
                    </Link>

                    <Link href="/settings" className="drawer__link" onClick={() => setDrawerOpen(false)}>
                      <span className="drawer__link-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      </span>
                      Settings
                    </Link>
                  </nav>
                </>
              )}
            </div>

            {/* Sticky footer — primary actions always in reach */}
            <div className="drawer__footer">
              <Link href="/add-listing" className="drawer__post-btn" onClick={() => setDrawerOpen(false)}>
                + Add Listing
              </Link>

              {user ? (
                <button className="drawer__signout-btn" onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? "Signing out…" : "Log out"}
                </button>
              ) : (
                <div className="drawer__guest-actions">
                  <Link href="/login" className="drawer__link-btn drawer__link-btn--ghost" onClick={() => setDrawerOpen(false)}>
                    Log in
                  </Link>
                  <Link href="/signup" className="drawer__link-btn drawer__link-btn--primary" onClick={() => setDrawerOpen(false)}>
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}