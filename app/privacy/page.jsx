"use client";
import Link from "next/link";
import styles from "./privacy.module.css";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    content: `rezidence ("we", "our", or "the Platform") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data. By using rezidence, you agree to the practices described in this policy.`,
  },
  {
    id: "what-we-collect",
    title: "2. Information We Collect",
    content: `We collect information you provide directly: your name, email address, phone number, university affiliation, and profile photo when you register. For landlords and agents, we collect NIN (National Identification Number) and bank account details for verification and payout purposes. We also collect listing content including photos, descriptions, and pricing that you submit to the Platform. When you make or receive payments, transaction details are processed and logged by Paystack; rezidence stores references to those transactions but not your full card details.`,
  },
  {
    id: "automatic",
    title: "3. Automatically Collected Information",
    content: `When you use rezidence, we automatically collect usage data such as pages visited, listings viewed, searches performed, and actions taken (e.g. bookmarks, reports, reservations). This is collected via PostHog analytics. We may also collect device type, browser, and approximate location data to improve the relevance of listings shown to you.`,
  },
  {
    id: "how-we-use",
    title: "4. How We Use Your Information",
    content: `We use your information to: operate and improve the Platform; verify your identity as a student, landlord, or agent; process payments; send you transactional notifications (reservation confirmations, payment receipts, dispute updates); display your profile to other users where relevant (e.g. agent profiles are public); and analyse usage patterns to improve features and detect fraud. We do not use your data for targeted advertising.`,
  },
  {
    id: "sharing",
    title: "5. Sharing of Information",
    content: `We do not sell your personal data. We share your information only with: Paystack (for payment processing); Firebase/Google (for authentication and data storage); Cloudinary (for image hosting); PostHog (for product analytics). When a student contacts a landlord or books an inspection, basic contact details may be shared between the relevant parties. Verified landlord and agent profiles are publicly viewable on the Platform.`,
  },
  {
    id: "nin",
    title: "6. NIN & Verification Data",
    content: `For landlord and agent verification, we collect your National Identification Number (NIN). This data is used solely to verify your identity and is not shared with third parties beyond our verification process. NIN data is stored securely and access is restricted to authorised rezidence staff only. You may request deletion of this data by contacting us, subject to legal retention obligations.`,
  },
  {
    id: "retention",
    title: "7. Data Retention",
    content: `We retain your account data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are legally required to retain it (e.g. transaction records for financial compliance). Anonymised usage data may be retained indefinitely for analytics purposes.`,
  },
  {
    id: "security",
    title: "8. Security",
    content: `We take reasonable technical and organisational measures to protect your data, including encrypted connections (HTTPS), secure Firestore rules, and restricted access to sensitive data. However, no system is completely secure. You are responsible for keeping your account credentials confidential and for notifying us immediately of any suspected breach.`,
  },
  {
    id: "rights",
    title: "9. Your Rights",
    content: `You have the right to access the personal data we hold about you, request corrections to inaccurate data, request deletion of your account and associated data, and withdraw consent for certain data processing activities. To exercise these rights, contact us at support@rezidence.ng. We will respond within 14 business days.`,
  },
  {
    id: "cookies",
    title: "10. Cookies & Local Storage",
    content: `rezidence uses browser storage (localStorage and sessionStorage) for session management and user preferences. We use PostHog cookies for analytics. You can clear browser storage at any time through your browser settings. Disabling cookies may affect some Platform functionality.`,
  },
  {
    id: "children",
    title: "11. Children's Privacy",
    content: `rezidence is not intended for users under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has registered on the Platform, please contact us and we will remove the account promptly.`,
  },
  {
    id: "changes",
    title: "12. Changes to This Policy",
    content: `We may update this Privacy Policy periodically. We will notify you of significant changes via email or an in-app notice. Your continued use of the Platform after changes are posted constitutes your acceptance of the revised policy.`,
  },
  {
    id: "contact",
    title: "13. Contact Us",
    content: `For any privacy-related questions, requests, or concerns, please contact us at support@rezidence.ng or through the Help section of the Platform. We are based in Port Harcourt, Rivers State, Nigeria.`,
  },
];

export default function PrivacyPage() {
  return (
    <div>
      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <span className={styles.badge}>Legal</span>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.subtitle}>
            How rezidence collects, uses, and protects your personal information.
          </p>
          <p className={styles.lastUpdated}>Last updated: May 2026</p>
        </div>

        <div className={styles.layout}>
          {/* Sidebar TOC */}
          <aside className={styles.sidebar}>
            <p className={styles.sidebarLabel}>On this page</p>
            <ul className={styles.toc}>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className={styles.tocLink}>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className={styles.sidebarCard}>
              <p>Also read our</p>
              <Link href="/terms" className={styles.sidebarCardLink}>
                Terms of Service →
              </Link>
            </div>
          </aside>

          {/* Content */}
          <article className={styles.content}>
            {sections.map((s) => (
              <section key={s.id} id={s.id} className={styles.section}>
                <h2 className={styles.sectionTitle}>{s.title}</h2>
                <p className={styles.sectionText}>{s.content}</p>
              </section>
            ))}

            <div className={styles.footer}>
              <p>
                Privacy questions?{" "}
                <a href="mailto:support@rezidence.ng" className={styles.link}>
                  Contact us
                </a>
              </p>
              <Link href="/terms" className={styles.footerLink}>
                Read our Terms of Service →
              </Link>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}