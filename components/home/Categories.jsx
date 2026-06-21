"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  HiOutlineHome,
  HiOutlineBuildingOffice2,
  HiOutlineSquares2X2,
  HiOutlineSparkles,
  HiOutlineWrenchScrewdriver,
  HiOutlineRectangleGroup,
} from "react-icons/hi2";
import "@/styles/categories.css";

const CATS = [
  { icon: <HiOutlineHome aria-hidden="true" />,                  label: "Single room",     href: "/listings?type=single-room" },
  { icon: <HiOutlineRectangleGroup aria-hidden="true" />,        label: "Self-con",         href: "/listings?type=self-con" },
  { icon: <HiOutlineBuildingOffice2 aria-hidden="true" />,       label: "Room & parlour",  href: "/listings?type=room-parlour" },
  { icon: <HiOutlineSquares2X2 aria-hidden="true" />,            label: "Flat",             href: "/listings?type=flat" },
  { icon: <HiOutlineSparkles aria-hidden="true" />,              label: "Studio",           href: "/listings?type=studio" },
  { icon: <HiOutlineWrenchScrewdriver aria-hidden="true" />,     label: "Boys quarters",   href: "/listings?type=boys-quarters" },
];

const inView = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

export default function Categories() {
  return (
    <section className="cats">
      <div className="cats__inner">

        <motion.div
          className="cats__header"
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <span className="cats__eyebrow">What are you looking for?</span>
          <h2 className="cats__heading">Browse by type</h2>
        </motion.div>

        <motion.div
          className="cats__grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {CATS.map((cat) => (
            <motion.div key={cat.label} variants={inView}>
              <Link href={cat.href} className="cats__item">
                <div className="cats__icon">{cat.icon}</div>
                <span className="cats__label">{cat.label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}