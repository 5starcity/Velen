"use client";

import { motion } from "framer-motion";
import {
  HiMagnifyingGlass,
  HiOutlineCalendarDays,
  HiOutlineKey,
} from "react-icons/hi2";
import "@/styles/how-it-works.css";

const STEPS = [
  {
    icon: <HiMagnifyingGlass aria-hidden="true" />,
    title: "Browse verified listings",
    body: "Filter by school, price, and type. Every listing is field-verified by our team.",
  },
  {
    icon: <HiOutlineCalendarDays aria-hidden="true" />,
    title: "Book an inspection",
    body: "Schedule a visit directly through the platform. No middlemen, no runaround.",
  },
  {
    icon: <HiOutlineKey aria-hidden="true" />,
    title: "Move in",
    body: "Pay securely, get your keys, and move in. Simple as that.",
  },
];

const inView = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

export default function HowItWorks() {
  return (
    <section className="hiw">
      <div className="hiw__inner">

        <motion.div
          className="hiw__header"
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <span className="hiw__eyebrow">Simple process</span>
          <h2 className="hiw__heading">How it works</h2>
        </motion.div>

        <motion.div
          className="hiw__steps"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {STEPS.map((step, i) => (
            <motion.div key={i} className="hiw__step" variants={inView}>
              <div className="hiw__step-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="hiw__step-icon">{step.icon}</div>
              <h3 className="hiw__step-title">{step.title}</h3>
              <p className="hiw__step-body">{step.body}</p>
              {i < STEPS.length - 1 && (
                <div className="hiw__connector" aria-hidden="true" />
              )}
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}