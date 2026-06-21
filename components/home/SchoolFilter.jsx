"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import "@/styles/school-filter.css";

const SCHOOLS = [
  { label: "RSU",    full: "Rivers State University" },
  { label: "UniPort", full: "University of Port Harcourt" },
  { label: "IAUE",   full: "Ignatius Ajuru University" },
  { label: "KSU",    full: "Ken Saro-Wiwa Polytechnic" },
];

const inView = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export default function SchoolFilter() {
  const router = useRouter();
  const [active, setActive] = useState("RSU");

  function handlePick(label) {
    setActive(label);
    router.push(`/listings?school=${label}`);
  }

  return (
    <section className="sf">
      <div className="sf__inner">

        <motion.div
          className="sf__header"
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <span className="sf__eyebrow">Filter by campus</span>
          <h2 className="sf__heading">Near your school</h2>
          <p className="sf__sub">
            Pick your university and see every verified listing within reach.
          </p>
        </motion.div>

        <motion.div
          className="sf__pills"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {SCHOOLS.map((s) => (
            <button
              key={s.label}
              className={`sf__pill${active === s.label ? " sf__pill--active" : ""}`}
              onClick={() => handlePick(s.label)}
            >
              {s.label}
              <span className="sf__pill-full">{s.full}</span>
            </button>
          ))}
        </motion.div>

      </div>
    </section>
  );
}