"use client";
import Link from "next/link";
import styles from "./terms.module.css";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using rezidence ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. These terms apply to all users, including students, landlords, and agents.`,
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: `rezidence is a student housing platform that connects students in Port Harcourt, Nigeria with verified landlords and agents near universities including Rivers State University (RSU), University of Port Harcourt (UniPort), IAUE, and Ken Saro-Wiwa Polytechnic. We provide listing discovery, roommate matching, inspection booking, and a secure reservation and payment system.`,
  },
  {
    id: "eligibility",
    title: "3. Eligibility",
    content: `You must be at least 18 years old to use rezidence. By registering, you confirm that the information you provide is accurate and complete. Students must register with a valid student email or provide proof of enrollment. Landlords and agents must complete our verification process before listing properties.`,
  },
  {
    id: "accounts",
    title: "4. User Accounts",
    content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. rezidence reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or post misleading listings.`,
  },
  {
    id: "listings",
    title: "5. Listings & Accuracy",
    content: `Landlords and agents are solely responsible for the accuracy of their listings. All listed properties must be real, available, and accurately described. rezidence does not guarantee the accuracy of any listing content but provides a scam reporting system and verification badges to promote trust. Misrepresentation of a property is grounds for immediate account removal.`,
  },
  {
    id: "payments",
    title: "6. Payments & Escrow",
    content: `Payments made through rezidence are processed via Paystack and held in escrow for 48 hours after a reservation is confirmed. Funds are released to the landlord after the escrow period unless a dispute is raised. By making a payment, you agree to Paystack's terms of service in addition to ours. rezidence charges a platform fee on successful transactions, which will be disclosed at checkout.`,
  },
  {
    id: "disputes",
    title: "7. Disputes",
    content: `If a dispute is raised within the 48-hour escrow window, the transaction will be frozen and reviewed by rezidence's support team. Both parties will be contacted for evidence. rezidence's decision on disputes is final within the scope of the platform. We are not liable for disputes arising outside of transactions processed through the Platform.`,
  },
  {
    id: "prohibited",
    title: "8. Prohibited Conduct",
    content: `You agree not to: post fraudulent or misleading listings; harass, threaten, or scam other users; use the Platform for any unlawful purpose; attempt to circumvent our payment system by taking transactions off-platform; scrape or reproduce Platform content without permission; or impersonate any person or organization.`,
  },
  {
    id: "intellectual",
    title: "9. Intellectual Property",
    content: `All content on rezidence — including the brand name, logo, design, and software — is owned by rezidence and protected by applicable intellectual property laws. User-submitted content (photos, descriptions) remains the property of the submitting user, but you grant rezidence a non-exclusive license to display that content on the Platform.`,
  },
  {
    id: "liability",
    title: "10. Limitation of Liability",
    content: `rezidence is a marketplace platform and is not a party to any rental agreement between students and landlords. We do not guarantee the quality, safety, or legality of any listed property. To the maximum extent permitted by law, rezidence is not liable for any indirect, incidental, or consequential damages arising from your use of the Platform.`,
  },
  {
    id: "changes",
    title: "11. Changes to Terms",
    content: `We may update these Terms of Service from time to time. Continued use of the Platform after changes are posted constitutes your acceptance of the revised terms. We will notify users of significant changes via email or an in-app notice.`,
  },
  {
    id: "contact",
    title: "12. Contact",
    content: `If you have questions about these Terms, please contact us at support@rezidence.ng or through the Help section of the Platform.`,
  },
];

export default function TermsPage() {
  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          Vel<em>en</em>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/browse">Browse</Link>
          <Link href="/roommates">Roommates</Link>
          <Link href="/privacy" className={styles.navActive}>Privacy Policy</Link>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <span className={styles.badge}>Legal</span>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.subtitle}>
            Please read these terms carefully before using rezidence.
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
              <Link href="/privacy" className={styles.sidebarCardLink}>
                Privacy Policy →
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
                Questions about these terms?{" "}
                <a href="mailto:support@rezidence.ng" className={styles.link}>
                  Contact us
                </a>
              </p>
              <Link href="/privacy" className={styles.footerLink}>
                Read our Privacy Policy →
              </Link>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}