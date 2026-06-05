// components/support/SupportWidget.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineXMark,
  HiOutlineArrowRight,
  HiOutlineQuestionMarkCircle,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineHomeModern,
} from "react-icons/hi2";
import "@/styles/support-widget.css";

const QUICK_LINKS = [
  { icon: <HiOutlineHomeModern />, label: "How to reserve a room", href: "/support#reserve" },
  { icon: <HiOutlineShieldCheck />, label: "Is my payment secure?", href: "/support#payment" },
  { icon: <HiOutlineQuestionMarkCircle />, label: "Report a fake listing", href: "/support#report" },
  { icon: <HiOutlineEnvelope />, label: "Contact support", href: "/support#contact" },
];

export default function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="support-widget">
      <AnimatePresence>
        {open && (
          <motion.div
            className="support-widget__panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="support-widget__header">
              <div className="support-widget__header-left">
                <div className="support-widget__avatar">V</div>
                <div>
                  <p className="support-widget__name">rezidence Support</p>
                  <p className="support-widget__status">
                    <span className="support-widget__dot" /> Usually replies within 24h
                  </p>
                </div>
              </div>
              <button className="support-widget__close" onClick={() => setOpen(false)}>
                <HiOutlineXMark />
              </button>
            </div>

            <div className="support-widget__body">
              <p className="support-widget__greeting">
                👋 Hi there! How can we help you today?
              </p>
              <div className="support-widget__links">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="support-widget__link"
                    onClick={() => setOpen(false)}
                  >
                    <span className="support-widget__link-icon">{link.icon}</span>
                    <span className="support-widget__link-label">{link.label}</span>
                    <HiOutlineArrowRight className="support-widget__link-arrow" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="support-widget__footer">
              <Link href="/support" className="support-widget__cta" onClick={() => setOpen(false)}>
                Visit Help Center <HiOutlineArrowRight />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={"support-widget__btn" + (open ? " open" : "")}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Support"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <HiOutlineXMark />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <HiOutlineChatBubbleLeftRight />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}