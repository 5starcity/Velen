// components/layout/Footer.jsx
import Link from "next/link";
import "@/styles/footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">

        {/* TOP */}
        <div className="footer__top">

          {/* Brand */}
          <div className="footer__brand">
            <p className="footer__logo">
              Vel<span>en</span>
            </p>

            <p className="footer__tagline">
              Find verified homes in Port Harcourt with transparent pricing and no hidden fees.
            </p>

          </div>

          {/* Browse */}
          <div className="footer__links-group">
            <p className="footer__links-title">Browse</p>
            <Link href="/listings">All Listings</Link>
            <Link href="/listings?availability=Available Now">Available Now</Link>
            <Link href="/saved-listings">Saved Listings</Link>
          </div>

          {/* Landlords */}
          <div className="footer__links-group">
            <p className="footer__links-title">Landlords</p>
            <Link href="/signup">Create Account</Link>
            <Link href="/add-listing">Post a Property</Link>
            <Link href="/verify-landlord">Get Verified</Link>
          </div>

          {/* Support / Trust */}
          <div className="footer__links-group">
            <p className="footer__links-title">Support</p>
            <Link href="/about">About Velen</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/report">Report a Listing</Link>
          </div>

          {/* Legal */}
          <div className="footer__links-group">
            <p className="footer__links-title">Legal</p>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>

        </div>

        {/* BOTTOM */}
        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} Velen. All rights reserved.
          </p>

          <p className="footer__sub">
            Clear pricing. Trusted listings. Better decisions.
          </p>
        </div>

      </div>
    </footer>
  );
}