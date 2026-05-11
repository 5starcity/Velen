// app/support/page.js
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  HiOutlineQuestionMarkCircle,
  HiOutlineEnvelope,
  HiOutlineHomeModern,
  HiOutlineShieldCheck,
  HiOutlineFlag,
  HiOutlineBanknotes,
  HiOutlineUserCircle,
  HiOutlineClipboardDocumentCheck,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import { submitSupportTicket } from "@/lib/firestoreListings";
import "@/styles/support-page.css";

const FAQS = [
  {
    id: "reserve",
    category: "Reservations",
    icon: <HiOutlineHomeModern />,
    q: "How do I reserve a room on Velen?",
    a: "Find a listing you like, then click 'Reserve this Room' on the listing detail page. Fill in your preferred move-in date and phone number, then confirm. The landlord will be notified immediately and will confirm or decline your reservation. You can track the status in 'My Reservations'.",
  },
  {
    id: "payment",
    category: "Payments",
    icon: <HiOutlineBanknotes />,
    q: "Is my payment secure on Velen?",
    a: "Yes. All payments on Velen are processed securely. We use industry-standard encryption and your payment details are never stored on our servers. Each transaction generates a unique receipt with a tracking ID you can use to verify your payment.",
  },
  {
    id: "reservation-cancel",
    category: "Reservations",
    icon: <HiOutlineShieldCheck />,
    q: "Can I cancel a reservation after submitting it?",
    a: "Yes, you can cancel a pending reservation from the 'My Reservations' page as long as the landlord hasn't confirmed it yet. Once confirmed, contact the landlord directly or reach out to our support team for assistance.",
  },
  {
    id: "inspection",
    category: "Inspections",
    icon: <HiOutlineClipboardDocumentCheck />,
    q: "How do I book a property inspection?",
    a: "On any listing detail page, click 'Book Inspection'. Choose a date and time slot that works for you, add your phone number and any notes, then submit. The landlord will confirm the inspection and you'll receive a notification. You can track all your inspections under 'My Inspections'.",
  },
  {
    id: "report",
    category: "Safety",
    icon: <HiOutlineFlag />,
    q: "How do I report a fake or suspicious listing?",
    a: "On the listing detail page, scroll to the bottom and click 'Report this listing'. Select the reason (fake listing, scam, wrong price, etc.) and add any extra details. Our team reviews all reports within 24–48 hours. You can only submit one report per listing.",
  },
  {
    id: "verified",
    category: "Safety",
    icon: <HiOutlineShieldCheck />,
    q: "What does the 'Verified' badge mean?",
    a: "A Verified badge means Velen has confirmed the landlord's identity and the property exists as described. Verified listings are more trustworthy and have been reviewed by our team. We recommend prioritising verified listings when searching.",
  },
  {
    id: "roommate",
    category: "Roommates",
    icon: <HiOutlineUserCircle />,
    q: "How does the roommate board work?",
    a: "Students can post roommate requests on the Roommate Board — either linked to a specific listing or as a general request. You can set preferences like gender, sleep schedule, budget range, and study habits. Other students can then express interest and connect with you.",
  },
  {
    id: "account",
    category: "Account",
    icon: <HiOutlineUserCircle />,
    q: "How do I update my profile or change my password?",
    a: "Go to your Profile page (click your name in the navbar). From there you can update your display name, phone number, bio, university, course, and profile photo. To change your password, scroll to the Security section and click 'Change'.",
  },
  {
    id: "landlord",
    category: "Landlords",
    icon: <HiOutlineHomeModern />,
    q: "I'm a landlord — how do I list my property?",
    a: "Sign up or log in as a landlord, then click 'Add Listing' in the navbar. Fill in your property details including photos, price, location, and amenities. Your listing will go live immediately. You can manage all your listings, track views and reservations from your Dashboard.",
  },
  {
    id: "contact-landlord",
    category: "General",
    icon: <HiOutlineChatBubbleLeftRight />,
    q: "How do I contact a landlord?",
    a: "On the listing detail page you'll find 'Chat on WhatsApp' and 'Call Now' buttons which connect you directly to the landlord. You can also express interest using the '⚡ Express Interest' button and the landlord will be notified.",
  },
];

const CATEGORIES = ["All", "Reservations", "Payments", "Inspections", "Safety", "Roommates", "Account", "Landlords", "General"];

const TICKET_CATEGORIES = [
  { value: "general",  label: "General Question" },
  { value: "listing",  label: "Listing Issue" },
  { value: "payment",  label: "Payment Problem" },
  { value: "account",  label: "Account Help" },
  { value: "report",   label: "Report / Safety" },
];

export default function SupportPage() {
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq]               = useState(null);
  const [search, setSearch]                 = useState("");

  // Contact form
  const [name, setName]               = useState(user?.displayName || "");
  const [email, setEmail]             = useState(user?.email || "");
  const [category, setCategory]       = useState("");
  const [message, setMessage]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [formError, setFormError]     = useState("");

  const filtered = FAQS.filter((faq) => {
    const matchesCat = activeCategory === "All" || faq.category === activeCategory;
    const matchesSearch = !search || faq.q.toLowerCase().includes(search.toLowerCase()) || faq.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  async function handleSubmit() {
    setFormError("");
    if (!name.trim() || !email.trim() || !category || !message.trim()) {
      setFormError("Please fill in all fields.");
      return;
    }
    if (message.trim().length < 20) {
      setFormError("Please describe your issue in a bit more detail.");
      return;
    }
    setSubmitting(true);
    try {
      await submitSupportTicket({
        userId:   user?.uid || "anonymous",
        name:     name.trim(),
        email:    email.trim(),
        category,
        message:  message.trim(),
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="support-page">

      {/* Header */}
      <motion.div
        className="support-page__hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/listings" className="support-page__back">
          <HiOutlineArrowLeft /> Back
        </Link>
        <div className="support-page__hero-icon">
          <HiOutlineQuestionMarkCircle />
        </div>
        <h1>How can we help?</h1>
        <p>Find answers to common questions or get in touch with our team.</p>

        {/* Search */}
        <div className="support-page__search-wrap">
          <HiOutlineQuestionMarkCircle className="support-page__search-icon" />
          <input
            type="text"
            className="support-page__search"
            placeholder="Search for answers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {/* FAQ section */}
      <motion.div
        className="support-page__section"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="support-page__section-title">Frequently Asked Questions</h2>

        {/* Category filter */}
        <div className="support-page__cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={"support-page__cat" + (activeCategory === cat ? " active" : "")}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div className="support-page__faqs">
          {filtered.length === 0 ? (
            <div className="support-page__no-results">
              <HiOutlineQuestionMarkCircle />
              <p>No results found. Try a different search or contact us below.</p>
            </div>
          ) : (
            filtered.map((faq) => (
              <div
                key={faq.id}
                id={faq.id}
                className={"support-page__faq" + (openFaq === faq.id ? " open" : "")}
              >
                <button
                  className="support-page__faq-q"
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                >
                  <span className="support-page__faq-icon">{faq.icon}</span>
                  <span className="support-page__faq-text">{faq.q}</span>
                  <HiOutlineChevronDown className="support-page__faq-chevron" />
                </button>
                <AnimatePresence>
                  {openFaq === faq.id && (
                    <motion.div
                      className="support-page__faq-a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ overflow: "hidden" }}
                    >
                      <p>{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Contact form */}
      <motion.div
        className="support-page__section"
        id="contact"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <h2 className="support-page__section-title">Still need help?</h2>
        <p className="support-page__section-sub">
          Send us a message and we'll get back to you at{" "}
          <a href="mailto:davidamejima88@gmail.com" className="support-page__email-link">
            davidamejima88@gmail.com
          </a>
        </p>

        <div className="support-page__form-card">
          {submitted ? (
            <motion.div
              className="support-page__submitted"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <HiOutlineCheckCircle className="support-page__submitted-icon" />
              <h3>Message received!</h3>
              <p>We'll review your message and get back to you within 24 hours at <strong>{email}</strong>.</p>
              <button className="support-page__submit-another" onClick={() => { setSubmitted(false); setMessage(""); setCategory(""); }}>
                Send another message
              </button>
            </motion.div>
          ) : (
            <div className="support-page__form">
              <div className="support-page__form-row">
                <div className="support-page__form-field">
                  <label>Your name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chidi Okeke"
                  />
                </div>
                <div className="support-page__form-field">
                  <label>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="support-page__form-field">
                <label>What is this about?</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="support-page__select">
                  <option value="">Select a category...</option>
                  {TICKET_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="support-page__form-field">
                <label>Your message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  maxLength={1000}
                />
                <span className="support-page__char-count">{message.length}/1000</span>
              </div>

              {formError && (
                <div className="support-page__form-error">
                  <HiOutlineExclamationTriangle /> {formError}
                </div>
              )}

              <button
                className="support-page__submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Email direct */}
      <motion.div
        className="support-page__direct"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.24 }}
      >
        <HiOutlineEnvelope />
        <p>Or email us directly at <a href="mailto:davidamejima88@gmail.com">davidamejima88@gmail.com</a></p>
      </motion.div>

    </main>
  );
}