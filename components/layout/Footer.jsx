// components/layout/Footer.jsx
import Link from "next/link";
import "@/styles/footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">

        <div className="footer__top">
          {/* Brand */}
          <div className="footer__brand">
            <p className="footer__logo">
              DWE <span>LLA</span>
            </p>
            <p className="footer__tagline">
              Find verified housing in Port Harcourt — no hidden fees, no stress.
            </p>
          </div>

          {/* Links */}
          <div className="footer__links-group">
            <p className="footer__links-title">Browse</p>
            <Link href="/listings">All Listings</Link>
            <Link href="/listings?availability=Available Now">Available Now</Link>
            <Link href="/saved-listings">Saved Listings</Link>
          </div>

          <div className="footer__links-group">
            <p className="footer__links-title">Landlords</p>
            <Link href="/signup">Create Account</Link>
            <Link href="/add-listing">Post a Property</Link>
            <Link href="/verify-landlord">Get Verified</Link>
          </div>

          <div className="footer__links-group">
            <p className="footer__links-title">Account</p>
            <Link href="/login">Log In</Link>
            <Link href="/signup">Sign Up</Link>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} Dwella. All rights reserved.
          </p>
          <p className="footer__sub">
            Built for convience. No stress. No hidden fees.
          </p>
        </div>

      </div>
    </footer>
  );
}