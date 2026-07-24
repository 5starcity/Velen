// components/layout/Footer.jsx
import Link from "next/link";
import "@/styles/footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">

      {/* Top accent line */}
      <div className="footer__accent-line" />

      <div className="footer__container">

        {/* ── Top section ── */}
        <div className="footer__top">

          {/* Brand column */}
          <div className="footer__brand">
            <p className="footer__logo">
              Rezidence
            </p>
            <p className="footer__tagline">
              Verified student housing in Port Harcourt.
              Transparent pricing, no agents, no stress.
            </p>
            <div className="footer__badges">
              <span className="footer__badge">🔒 Verified listings</span>
              <span className="footer__badge">₦ No hidden fees</span>
              <span className="footer__badge">🎓 Student-first</span>
            </div>
          </div>

          {/* Links */}
          <div className="footer__links-group">
            <p className="footer__links-title">Browse</p>
            <Link href="/listings">All Listings</Link>
            <Link href="/listings?availability=Available Now">Available Now</Link>
            <Link href="/saved-listings">Saved Listings</Link>
            <Link href="/roommates">Roommate Board</Link>
          </div>

          <div className="footer__links-group">
            <p className="footer__links-title">Landlords</p>
            <Link href="/signup">Create Account</Link>
            <Link href="/add-listing">Post a Property</Link>
            <Link href="/verify-landlord">Get Verified</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>

          <div className="footer__links-group">
            <p className="footer__links-title">Support</p>
            <Link href="/support">Help Center</Link>
            <Link href="/support#contact">Contact Us</Link>
            <Link href="/support#report">Report a Listing</Link>
          </div>

          <div className="footer__links-group">
            <p className="footer__links-title">Legal</p>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>

        </div>

        {/* ── Divider ── */}
        <div className="footer__divider" />

        {/* ── Bottom ── */}
        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} rezidence. All rights reserved.
          </p>
          <p className="footer__sub">
            Built for students, by people who get it.
          </p>
        </div>

      </div>
    </footer>
  );
}