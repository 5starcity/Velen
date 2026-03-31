// components/layout/Navbar.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logOut } from "@/lib/auth";
import "@/styles/navbar.css";

export default function Navbar() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logOut();
    router.push("/");
  }

  return (
    <nav className="navbar">
      <div className="navbar__container">

    // New logo:
     <Link href="/" className="navbar__logo">
     Dwe<span>lla</span>
        </Link>   

        {/* Desktop Nav */}
        <div className="navbar__links">
          <Link href="/listings">Browse</Link>
          {userRole === "landlord" && (
            <Link href="/add-listing">Add Listing</Link>
          )}
          <Link href="/saved-listings">Saved</Link>
        </div>

        {/* Auth Buttons */}
        <div className="navbar__auth">
          {user ? (
            <div className="navbar__user">
              <span className="navbar__username">
                👋 {user.displayName?.split(" ")[0]}
              </span>
              <button onClick={handleLogout} className="navbar__logout">
                Log Out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="navbar__login">Log In</Link>
              <Link href="/signup" className="navbar__signup">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="navbar__mobile">
          <Link href="/listings" onClick={() => setMenuOpen(false)}>Browse</Link>
          {userRole === "landlord" && (
            <Link href="/add-listing" onClick={() => setMenuOpen(false)}>Add Listing</Link>
          )}
          <Link href="/saved-listings" onClick={() => setMenuOpen(false)}>Saved</Link>
          {user ? (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }}>
              Log Out
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}