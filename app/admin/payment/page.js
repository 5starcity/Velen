'use client';

import { useState } from 'react';

const payments = [
  { ref: 'TXN-2841', tenant: 'Obinna Chukwu', landlord: 'Chukwuemeka Obi', listing: 'Self-con at Rumuola', amount: '₦180,000', type: 'rent', status: 'paid', channel: 'card', date: 'Jun 23, 2025' },
  { ref: 'TXN-2840', tenant: 'Grace Okoro', landlord: null, listing: 'Featured — 30 days', amount: '₦2,000', type: 'featured', status: 'paid', channel: 'transfer', date: 'Jun 23, 2025' },
  { ref: 'TXN-2839', tenant: 'Tunde Alabi', landlord: 'Daniel Briggs', listing: 'Room, Ada George', amount: '₦95,000', type: 'rent', status: 'pending', channel: 'transfer', date: 'Jun 22, 2025' },
  { ref: 'TXN-2838', tenant: 'Ngozi Eze', landlord: null, listing: 'Featured — 7 days', amount: '₦15,000', type: 'featured', status: 'failed', channel: 'card', date: 'Jun 22, 2025' },
  { ref: 'TXN-2837', tenant: 'Emeka Eze', landlord: 'Amaka Nwosu', listing: '2-bed, GRA Phase 2', amount: '₦650,000', type: 'rent', status: 'paid', channel: 'transfer', date: 'Jun 21, 2025' },
  { ref: 'TXN-2836', tenant: 'Kemi Adeyemi', landlord: null, listing: 'Featured — 14 days', amount: '₦6,000', type: 'featured', status: 'paid', channel: 'card', date: 'Jun 20, 2025' },
];

export default function AdminPayments() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = payments.filter((p) => {
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchType && matchStatus;
  });

  const total = payments.filter(p => p.status === 'paid').reduce((acc, p) => {
    const num = parseInt(p.amount.replace(/[₦,]/g, ''));
    return acc + num;
  }, 0);

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__row">
          <div>
            <p className="admin-page-header__eyebrow">Transactions</p>
            <h1 className="admin-page-header__title">Payments</h1>
            <p className="admin-page-header__subtitle">All Paystack transactions — rent payments and featured slot purchases</p>
          </div>
          <button className="admin-btn admin-btn--outline">Export CSV</button>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Revenue (Month)', value: '₦318,000', change: '+23%', dir: 'up' },
          { label: 'Rent Payments', value: '142', change: '', dir: 'neutral' },
          { label: 'Featured Revenue', value: '₦84,000', change: '', dir: 'neutral' },
          { label: 'Failed Transactions', value: '7', change: '', dir: 'down' },
        ].map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-card__label">{s.label}</div>
            <div className="admin-stat-card__value">{s.value}</div>
            {s.change && (
              <div className={`admin-stat-card__change admin-stat-card__change--${s.dir}`}>
                {s.dir === 'up' ? '↑' : s.dir === 'down' ? '↓' : ''} {s.change}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <div className="admin-card__header">
            <span className="admin-card__title">All Transactions</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div className="admin-toolbar">
              <select className="admin-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All types</option>
                <option value="rent">Rent</option>
                <option value="featured">Featured</option>
              </select>
              <select className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Tenant</th>
                  <th>Listing</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.ref}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                        {p.ref}
                      </span>
                    </td>
                    <td>{p.tenant}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{p.listing}</div>
                      {p.landlord && (
                        <div className="admin-table__meta">via {p.landlord}</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.amount}</td>
                    <td>
                      <span className={`admin-badge ${p.type === 'featured' ? 'admin-badge--featured' : 'admin-badge--info'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'capitalize' }}>
                      {p.channel}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${p.status}`}>{p.status}</span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{p.date}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn--outline admin-btn--sm">Receipt</button>
                        {p.status === 'failed' && (
                          <button className="admin-btn admin-btn--primary admin-btn--sm">Retry</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <span>Showing {filtered.length} of 149 transactions</span>
            <div className="admin-pagination__pages">
              <button className="admin-pagination__btn admin-pagination__btn--active">1</button>
              <button className="admin-pagination__btn">2</button>
              <button className="admin-pagination__btn">→</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}