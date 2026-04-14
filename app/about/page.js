// app/about/page.js
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import "@/styles/about.css";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

const VALUES = [
  {
    number: "01",
    title:  "Full cost, upfront.",
    body:   "Every listing on Velen shows the complete move-in cost — rent, caution fee, legal fee, agency fee, all of it. No surprises after you have fallen in love with a place.",
  },
  {
    number: "02",
    title:  "Verified where it matters.",
    body:   "We manually review landlords who apply for verification. It is not a checkbox — it is a signal you can trust.",
  },
  {
    number: "03",
    title:  "Direct contact. No middlemen.",
    body:   "You reach the property owner or manager directly. No agent taking a cut just for forwarding your message.",
  },
  {
    number: "04",
    title:  "Built for Port Harcourt.",
    body:   "Not a Lagos product awkwardly extended. Every area, every landmark, every price range is tuned for the way people actually rent here.",
  },
];

const WHO = [
  { label: "Fresh graduates",  desc: "Starting a new job and finding a place before the first salary arrives." },
  { label: "Students",         desc: "Looking for a safe, affordable flat near campus without getting scammed." },
  { label: "Families",         desc: "Needing more space and a trustworthy process to find it." },
  { label: "Professionals",    desc: "Relocating to Port Harcourt and needing somewhere to land quickly." },
  { label: "Property owners",  desc: "Who want serious enquiries, not tyre-kickers — and tools to manage them." },
];

export default function AboutPage() {
  return (
    <main className="about">

      {/* Hero */}
      <motion.section
        className="about__hero"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <motion.p className="about__eyebrow" variants={fadeUp}>About Velen</motion.p>
        <motion.h1 className="about__hero-title" variants={fadeUp}>
          Renting in Port Harcourt<br />
          <span className="about__hero-accent">should not be a gamble.</span>
        </motion.h1>
        <motion.p className="about__hero-sub" variants={fadeUp}>
          We built Velen because we were tired of listings that hide the real cost,
          agents who disappear after payment, and properties that look nothing like
          the photos. There had to be a better way.
        </motion.p>
      </motion.section>

      {/* Pull quote */}
      <motion.section
        className="about__quote-wrap"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="about__quote-rule" />
        <blockquote className="about__quote">
          "The average renter in Port Harcourt discovers the true move-in cost
          only after they have already committed. We think that is wrong."
        </blockquote>
        <div className="about__quote-rule" />
      </motion.section>

      {/* The problem */}
      <motion.section
        className="about__section"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        <motion.p className="about__section-label" variants={fadeUp}>The problem</motion.p>
        <div className="about__two-col">
          <motion.div variants={fadeUp}>
            <h2 className="about__section-heading">
              Hidden costs are<br />the norm, not<br />the exception.
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} className="about__two-col-body">
            <p>
              You find a flat you like. The rent is ₦300,000. You budget for it,
              tell your family, start planning. Then you get to the landlord and
              learn about the caution fee, the legal fee, the agency fee, the
              service charge. Suddenly you need ₦600,000 you do not have.
            </p>
            <p>
              This happens every day in Port Harcourt. It is not an accident —
              it is how the informal rental market has always worked. Velen
              exists to change that, one transparent listing at a time.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Stat strip */}
      <motion.section
        className="about__strip"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        {[
          { value: "100%", label: "of listings show full move-in cost" },
          { value: "₦0",   label: "in hidden fees, ever" },
          { value: "PH",   label: "built specifically for Port Harcourt" },
        ].map((s) => (
          <motion.div key={s.label} className="about__strip-item" variants={fadeUp}>
            <span className="about__strip-value">{s.value}</span>
            <span className="about__strip-label">{s.label}</span>
          </motion.div>
        ))}
      </motion.section>

      {/* Values */}
      <motion.section
        className="about__section"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        <motion.p className="about__section-label" variants={fadeUp}>What we stand for</motion.p>
        <motion.h2
          className="about__section-heading about__section-heading--center"
          variants={fadeUp}
        >
          Four things we will never<br />compromise on.
        </motion.h2>
        <div className="about__values">
          {VALUES.map((v) => (
            <motion.div key={v.number} className="about__value-card" variants={fadeUp}>
              <span className="about__value-num">{v.number}</span>
              <h3 className="about__value-title">{v.title}</h3>
              <p className="about__value-body">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Who we serve */}
      <motion.section
        className="about__section"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        <motion.p className="about__section-label" variants={fadeUp}>Who Velen is for</motion.p>
        <motion.h2 className="about__section-heading" variants={fadeUp}>
          Everyone who rents.<br />Everyone who lets.
        </motion.h2>
        <div className="about__who">
          {WHO.map((w, i) => (
            <motion.div key={w.label} className="about__who-item" variants={fadeUp}>
              <span className="about__who-index">{String(i + 1).padStart(2, "0")}</span>
              <div className="about__who-content">
                <p className="about__who-label">{w.label}</p>
                <p className="about__who-desc">{w.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Mission */}
      <motion.section
        className="about__mission"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      >
        <p className="about__mission-eyebrow">Our mission</p>
        <p className="about__mission-text">
          To make every rental transaction in Port Harcourt — and eventually
          across Nigeria — start with full information, mutual respect,
          and zero hidden surprises.
        </p>
      </motion.section>

      {/* CTA */}
      <motion.section
        className="about__cta"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        <motion.h2 className="about__cta-title" variants={fadeUp}>
          Ready to find your next home?
        </motion.h2>
        <motion.p className="about__cta-sub" variants={fadeUp}>
          Browse every listing with a full cost breakdown — no surprises, no agents, no stress.
        </motion.p>
        <motion.div className="about__cta-btns" variants={fadeUp}>
          <Link href="/listings" className="about__btn about__btn--primary">
            Browse Properties
          </Link>
          <Link href="/signup" className="about__btn about__btn--secondary">
            List Your Property
          </Link>
        </motion.div>
      </motion.section>

    </main>
  );
}