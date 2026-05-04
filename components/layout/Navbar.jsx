"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { logOut } from "@/lib/auth";
import {
  HiOutlineHome,
  HiOutlineBookmark,
  HiOutlineUser,
  HiOutlinePlus,
  HiOutlineArrowRightOnRectangle,
  HiOutlineArrowLeftOnRectangle,
  HiOutlineUserPlus,
  HiOutlineChartBarSquare,
  HiOutlineUserGroup,
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
  HiXMark,
  HiBars3,
} from "react-icons/hi2";
import NotificationBell from "@/components/notifications/NotificationBell";
import "@/styles/navbar.css";

export default function Navbar() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) return null;

  const firstName = user?.displayName?.split(" ")[0] || "User";

  const isActive = (href) => pathname.startsWith(href);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await logOut();
    setMenuOpen(false);
    router.push("/");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  // 🔥 Centralized navigation config
  const navLinks = [
    { href: "/", label: "Home", icon: <HiOutlineHome />, roles: ["all"] },
    { href: "/listings", label: "Browse", icon: <HiOutlineBuildingOffice2 />, roles: ["all"] },
    { href: "/roommates", label: "Roommates", icon: <HiOutlineUserGroup />, roles: ["student"] },
    { href: "/my-reservations", label: "Reservations", icon: <HiOutlineShieldCheck />, roles: ["student"] },
    { href: "/add-listing", label: "Add Listing", icon: <HiOutlinePlus />, roles: ["landlord"] },
    { href: "/dashboard", label: "Dashboard", icon: <HiOutlineChartBarSquare />, roles: ["landlord"] },
    { href: "/saved-listings", label: "Saved", icon: <HiOutlineBookmark />, roles: ["all"] },
    { href: "/transactions", label: "Transactions", icon: <HiOutlineBanknotes />, roles: ["all"], auth: true },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (link.auth && !user) return false;
    if (link.roles.includes("all")) return true;
    return link.roles.includes(userRole);
  });

  return (
    <>
      <nav className="navbar">
        <div className="navbar__container">
          <Link href="/" className="navbar__logo" onClick={closeMenu}>
            Vel<span>en</span>
          </Link>

          {/* Desktop Nav */}
          <div className="navbar__links">
            {filteredLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={isActive(link.href) ? "active" : ""}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="navbar__auth">
            {user ? (
              <div className="navbar__user">
                <NotificationBell />
                <Link
                  href="/profile"
                  className={"navbar__username" + (isActive("/profile") ? " active" : "")}
                >
                  👋 {firstName}
                </Link>
                <button
                  onClick={handleLogout}
                  className="navbar__logout"
                  disabled={loggingOut}
                >
                  {loggingOut ? "Logging out..." : "Log Out"}
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="navbar__login">Log In</Link>
                <Link href="/signup" className="navbar__signup">Sign Up</Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <HiXMark /> : <HiBars3 />}
          </button>
        </div>
      </nav>

      {menuOpen && <div className="navbar__overlay" onClick={closeMenu} />}

      {/* Mobile Drawer */}
      <div
        id="mobile-menu"
        className={"navbar__drawer" + (menuOpen ? " open" : "")}
      >
        <div className="navbar__drawer-header">
          <p className="navbar__drawer-logo">Vel<span>en</span></p>
          <div className="navbar__drawer-header-right">
            {user && <NotificationBell />}
            {user && <p className="navbar__drawer-user">👋 {firstName}</p>}
          </div>
        </div>

        <div className="navbar__drawer-links">
          {filteredLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={"navbar__drawer-link" + (isActive(link.href) ? " active" : "")}
              onClick={closeMenu}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}

          {user && (
            <Link
              href="/profile"
              className={"navbar__drawer-link" + (isActive("/profile") ? " active" : "")}
              onClick={closeMenu}
            >
              <HiOutlineUser />
              <span>My Profile</span>
            </Link>
          )}
        </div>

        <div className="navbar__drawer-auth">
          {user ? (
            <button
              className="navbar__drawer-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <HiOutlineArrowRightOnRectangle />
              <span>{loggingOut ? "Logging out..." : "Log Out"}</span>
            </button>
          ) : (
            <>
              <Link href="/login" className="navbar__drawer-login" onClick={closeMenu}>
                <HiOutlineArrowLeftOnRectangle />
                <span>Log In</span>
              </Link>
              <Link href="/signup" className="navbar__drawer-signup" onClick={closeMenu}>
                <HiOutlineUserPlus />
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}