"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HiOutlineArrowRight, HiOutlineBuildingOffice2 } from "react-icons/hi2";
import "@/styles/landlord-cta.css";

const inView = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

export default function LandlordCTA() {
  return (
    <section className="lcta">
      <div className="lcta__inner">

        <motion.div
          className="lcta__content"
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <div className="lcta__icon" aria-hidden="true">
            <HiOutlineBuildingOffice2 />
          </div>

          <span className="lcta__eyebrow">For landlords</span>

          <h2 className="lcta__heading">
            Reach thousands of students
          </h2>

          <p className="lcta__sub">
            List your property on Rezidence and connect directly with verified
            student tenants — no agents, no commission cuts. Free to get started.
          </p>

          <div className="lcta__actions">
            <Link href="/add-listing" className="lcta__btn lcta__btn--primary">
              List a space <HiOutlineArrowRight aria-hidden="true" />
            </Link>
            <Link href="/landlord/feature" className="lcta__btn lcta__btn--ghost">
              Learn about featured slots
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}