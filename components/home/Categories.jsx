"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiOutlineHome,
  HiOutlineHomeModern,
  HiOutlineBuildingOffice2,
  HiOutlineBuildingOffice,
  HiOutlineUserGroup,
  HiOutlineKey,
  HiArrowUpRight,
} from "react-icons/hi2";
import "@/styles/categories.css";

const CATEGORIES = [
  {
    label: "Self Contain",
    type: "self-contain",
    icon: HiOutlineHome,
    tag: "Most searched",
    blurb: "Compact, affordable, closest to campus.",
    featured: true,
  },
  { label: "Mini Flat", type: "mini-flat", icon: HiOutlineHomeModern },
  { label: "1 Bedroom", type: "1-bedroom", icon: HiOutlineBuildingOffice },
  { label: "2 Bedroom", type: "2-bedroom", icon: HiOutlineBuildingOffice2 },
  { label: "Shared Apartment", type: "shared", icon: HiOutlineUserGroup },
  { label: "Duplex", type: "duplex", icon: HiOutlineKey },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const tileVariant = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function Categories() {
  return (
    <section className="categories">
      <div className="categories__inner">
        <div className="categories__head">
          <div>
            <h2 className="categories__heading">Find your kind of space</h2>
          </div>
          <Link href="/listings" className="categories__viewall">
            View all listings
            <HiArrowUpRight aria-hidden="true" />
          </Link>
        </div>

        <motion.div
          className="categories__grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
        >
          {CATEGORIES.map(({ label, type, icon: Icon, tag, blurb, featured }, i) => (
            <motion.div
              key={type}
              variants={tileVariant}
              className={featured ? "categories__cell categories__cell--featured" : "categories__cell"}
            >
              <Link
                href={`/listings?type=${type}`}
                className={featured ? "categories__tile categories__tile--featured" : "categories__tile"}
              >
                <span className="categories__tile-index">{String(i + 1).padStart(2, "0")}</span>

                <span className="categories__tile-icon">
                  <Icon aria-hidden="true" />
                </span>

                {tag && <span className="categories__tile-tag">{tag}</span>}

                <span className="categories__tile-label">{label}</span>
                {blurb && <span className="categories__tile-blurb">{blurb}</span>}

                <span className="categories__tile-arrow">
                  <HiArrowUpRight aria-hidden="true" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}