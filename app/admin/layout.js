'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../../styles/admin.css';

const navSections = [
  {
    label: 'Overview',
    links: [
      { href: '/admin', label: 'Dashboard', icon: '▦' },
    ],
  },
  {
    label: 'Platform',
    links: [
      { href: '/admin/listings', label: 'Listings', icon: '🏠' },
      { href: '/admin/featured', label: 'Featured', icon: '⭐' },
      { href: '/admin/users', label: 'Users & Landlords', icon: '👤' },
      { href: '/admin/roommate-board', label: 'Roommate Board', icon: '🤝' },
    ],
  },
  {
    label: 'Transactions',
    links: [
      { href: '/admin/payments', label: 'Payments', icon: '₦' },
      { href: '/admin/inspections', label: 'Inspections', icon: '🔍' },
    ],
  },
];

const recentActivity = [
  { event: 'New listing posted', time: '2m ago', type: 'listing' },
  { event: 'Inspection booked', time: '8m ago', type: 'inspection' },
  { event: 'Payment received ₦45,000', time: '15m ago', type: 'payment' },
  { event: 'Landlord verified', time: '22m ago', type: 'user' },
  { event: 'Featured slot purchased', time: '1h ago', type: 'featured' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__top">
          <Link href="/admin" className="admin-logo">
            <span className="admin-logo__mark">R</span>
            <span className="admin-logo__text">Rezidence</span>
            <span className="admin-logo__badge">Admin</span>
          </Link>
        </div>

        <nav className="admin-nav">
          {navSections.map((section) => (
            <div key={section.label} className="admin-nav__section">
              <span className="admin-nav__label">{section.label}</span>
              {section.links.map((link) => {
                const isActive =
                  link.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`admin-nav__link${isActive ? ' admin-nav__link--active' : ''}`}
                  >
                    <span className="admin-nav__icon">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Live Activity Feed */}
        <div className="admin-activity">
          <span className="admin-activity__title">
            <span className="admin-activity__dot" />
            Live Activity
          </span>
          <ul className="admin-activity__list">
            {recentActivity.map((item, i) => (
              <li key={i} className={`admin-activity__item admin-activity__item--${item.type}`}>
                <span className="admin-activity__event">{item.event}</span>
                <span className="admin-activity__time">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <div className="admin-user__avatar">A</div>
            <div className="admin-user__info">
              <span className="admin-user__name">Admin</span>
              <span className="admin-user__role">Super Admin</span>
            </div>
          </div>
          <Link href="/" className="admin-back-link">← Back to site</Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}