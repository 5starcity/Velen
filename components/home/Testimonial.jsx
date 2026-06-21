"use client";

import { motion } from "framer-motion";
import { HiOutlineStar } from "react-icons/hi2";
import "@/styles/testimonial.css";

const TESTIMONIALS = [
  {
    quote:
      "Found my self-con in 2 days. No agent, no stress. The inspection booking made everything smooth.",
    name: "Amara Okonkwo",
    tag: "200L · RSU",
    initials: "AO",
  },
  {
    quote:
      "Every cost was shown upfront — I knew exactly what I was paying before I even visited the place.",
    name: "Chidi Nwosu",
    tag: "300L · UniPort",
    initials: "CN",
  },
  {
    quote:
      "Used the roommate board and split rent with someone from my faculty. Saved me almost ₦40k.",
    name: "Blessing Eze",
    tag: "100L · IAUE",
    initials: "BE",
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

function Stars() {
  return (
    <div className="testi__stars" aria-label="5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <HiOutlineStar key={i} aria-hidden="true" />
      ))}
    </div>
  );
}

export default function Testimonial() {
  return (
    <section className="testi">
      <div className="testi__inner">

        <motion.div
          className="testi__header"
          variants={inView}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <span className="testi__eyebrow">Student stories</span>
          <h2 className="testi__heading">What students say</h2>
        </motion.div>

        <motion.div
          className="testi__grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} className="testi__card" variants={inView}>
              <Stars />
              <p className="testi__quote">"{t.quote}"</p>
              <div className="testi__author">
                <div className="testi__avatar" aria-hidden="true">
                  {t.initials}
                </div>
                <div>
                  <div className="testi__name">{t.name}</div>
                  <div className="testi__tag">{t.tag}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}