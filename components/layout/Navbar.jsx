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
  const router   = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen]   = useState(false);
  const [mounted, setMounted]     = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [scrolled, setScrolled]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (!mounted || loading) return null;

  const firstName = user?.displayName?.split(" ")[0] || "You";
  const isActive  = (href) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    await logOut();
    setMenuOpen(false);
    router.push("/");
  }

  const navLinks = [
    { href: "/",              label: "Home",         icon: <HiOutlineHome />,            roles: ["all"] },
    { href: "/listings",      label: "Browse",       icon: <HiOutlineBuildingOffice2 />, roles: ["all"] },
    { href: "/roommates",     label: "Roommates",    icon: <HiOutlineUserGroup />,       roles: ["student"] },
    { href: "/add-listing",   label: "Add Listing",  icon: <HiOutlinePlus />,            roles: ["landlord"] },
    { href: "/dashboard",     label: "Dashboard",    icon: <HiOutlineChartBarSquare />,  roles: ["landlord"] },
    { href: "/saved-listings",label: "Saved",        icon: <HiOutlineBookmark />,        roles: ["all"] },
    { href: "/transactions",  label: "Transactions", icon: <HiOutlineBanknotes />,       roles: ["all"], auth: true },
  ];

  const filtered = navLinks.filter(link => {
    if (link.auth && !user) return false;
    if (link.roles.includes("all")) return true;
    return link.roles.includes(userRole);
  });

  return (
    <>
      <nav className={"navbar" + (scrolled ? " navbar--scrolled" : "")}>
        <div className="navbar__container">

          {/* Logo */}
          <Link href="/" className="navbar__logo">
            Vel<em>en</em>
          </Link>

          {/* Desktop links */}
          <div className="navbar__links">
            {filtered.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={"navbar__link" + (isActive(link.href) ? " active" : "")}
              >
                {link.label}
                {isActive(link.href) && <span className="navbar__link-dot" />}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="navbar__auth">
            {user ? (
              <div className="navbar__user">
                <NotificationBell />
                <Link
                  href="/profile"
                  className={"navbar__profile-btn" + (isActive("/profile") ? " active" : "")}
                >
                  <span className="navbar__profile-avatar">
                    {firstName[0].toUpperCase()}
                  </span>
                  <span className="navbar__profile-name">{firstName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="navbar__logout"
                  disabled={loggingOut}
                >
                  {loggingOut ? "Leaving..." : "Log Out"}
                </button>
              </div>
            ) : (
              <div className="navbar__guest">
                <Link href="/login"  className="navbar__login">Log In</Link>
                <Link href="/signup" className="navbar__signup">Get Started</Link>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <HiXMark /> : <HiBars3 />}
          </button>

        </div>
      </nav>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="navbar__overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={"navbar__drawer" + (menuOpen ? " open" : "")}>

        <div className="navbar__drawer-header">
          <Link href="/" className="navbar__drawer-logo" onClick={() => setMenuOpen(false)}>
            Vel<em>en</em>
          </Link>
          <div className="navbar__drawer-header-right">
            {user && <NotificationBell />}
            <button className="navbar__drawer-close" onClick={() => setMenuOpen(false)}>
              <HiXMark />
            </button>
          </div>
        </div>

        {user && (
          <div className="navbar__drawer-user-row">
            <div className="navbar__drawer-avatar">
              {firstName[0].toUpperCase()}
            </div>
            <div>
              <p className="navbar__drawer-name">Hey, {firstName} 👋</p>
              <p className="navbar__drawer-email">{user.email}</p>
            </div>
          </div>
        )}

        <div className="navbar__drawer-links">
          {filtered.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={"navbar__drawer-link" + (isActive(link.href) ? " active" : "")}
              onClick={() => setMenuOpen(false)}
            >
              <span className="navbar__drawer-link-icon">{link.icon}</span>
              <span>{link.label}</span>
              {isActive(link.href) && <span className="navbar__drawer-active-dot" />}
            </Link>
          ))}

          {user && (
            <Link
              href="/profile"
              className={"navbar__drawer-link" + (isActive("/profile") ? " active" : "")}
              onClick={() => setMenuOpen(false)}
            >
              <span className="navbar__drawer-link-icon"><HiOutlineUser /></span>
              <span>My Profile</span>
            </Link>
          )}
        </div>

        <div className="navbar__drawer-footer">
          {user ? (
            <button className="navbar__drawer-logout" onClick={handleLogout} disabled={loggingOut}>
              <HiOutlineArrowRightOnRectangle />
              <span>{loggingOut ? "Logging out..." : "Log Out"}</span>
            </button>
          ) : (
            <div className="navbar__drawer-guest">
              <Link href="/login" className="navbar__drawer-login" onClick={() => setMenuOpen(false)}>
                <HiOutlineArrowLeftOnRectangle />
                <span>Log In</span>
              </Link>
              <Link href="/signup" className="navbar__drawer-signup" onClick={() => setMenuOpen(false)}>
                <HiOutlineUserPlus />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>

      </div>
    </>
  );
}