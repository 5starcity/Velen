'use client';

import { useState } from 'react';

const TIERS = {
  basic: { label: 'Basic', duration: '7 days', price: '₦2,000', color: '#a86523' },
  standard: { label: 'Standard', duration: '14 days', price: '₦6,000', color: '#2d5a28' },
  premium: { label: 'Premium', duration: '30 days', price: '₦15,000', color: '#1a4a6b' },
};

const featured = [
  { id: 'FT-012', listing: '2-bed, GRA Phase 2', landlord: 'Amaka Nwosu', tier: 'premium', started: 'Jun 1, 2025', expires: 'Jul 1, 2025', daysLeft: 7, status: 'active' },
  { id: 'FT-011', listing: '1-bed, D-Line', landlord: 'Emeka Eze', tier: 'standard', started: 'Jun 10, 2025', expires: 'Jun 24, 2025', daysLeft: 0, status: 'expired' },
  { id: 'FT-010', listing: 'Mini flat, Trans-Amadi', landlord: 'Fatima Bello', tier: 'basic', started: 'Jun 17, 2025', expires: 'Jun 24, 2025', daysLeft: 1, status: 'active' },
  { id: 'FT-009', listing: 'Self-con, Rumuola', landlord: 'Chukwuemeka Obi', tier: 'standard', started: 'Jun 20, 2025', expires: 'Jul 4, 2025', daysLeft: 10, status: 'active' },
  { id: 'FT-008', listing: 'Bedsitter, Rumunduru', landlord: 'Sandra Okafor', tier: 'basic', started: 'Jun 5, 2025', expires: 'Jun 12, 2025', daysLeft: 0, status: 'expired' },
];

export default function AdminFeatured() {
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = featured.filter((f) => {
    const matchTier = tierFilter === 'all' || f.tier === tierFilter;
    const matchStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchTier && matchStatus;
  });

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__row">
          <div>
            <p className="admin-page-header__eyebrow">Platform</p>
            <h1 className="admin-page-header__title">Featured Listings</h1>
            <p className="admin-page-header__subtitle">Manage paid featured slots across all tiers</p>
          </div>
        </div>
      </div>

      {/* Tier overview */}
      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {Object.entries(TIERS).map(([key, tier]) => (
          <div key={key} className="admin-stat-card" style={{ borderTop: `3px solid ${tier.color}` }}>
            <div className="admin-stat-card__label">{tier.label} — {tier.price}</div>
            <div className="admin-stat-card__value">
              {featured.filter(f => f.tier === key && f.status === 'active').length}
            </div>
            <div className="admin-stat-card__change admin-stat-card__change--neutral">
              {tier.duration} · {featured.filter(f => f.tier === key).length} total sold
            </div>
          </div>
        ))}
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <div className="admin-card__header">
            <span className="admin-card__title">Featured Slots</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="admin-filter-select" value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                <option value="all">All tiers</option>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
              <select className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Listing</th>
                  <th>Landlord</th>
                  <th>Tier</th>
                  <th>Started</th>
                  <th>Expires</th>
                  <th>Days Left</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                        {f.id}
                      </span>
                    </td>
                    <td>
                      <a href="#" className="admin-table__link">{f.listing}</a>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>{f.landlord}</td>
                    <td>
                      <span className="admin-badge admin-badge--featured" style={{
                        borderLeft: `3px solid ${TIERS[f.tier]?.color}`,
                        borderRadius: '0 4px 4px 0',
                      }}>
                        {TIERS[f.tier]?.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{f.started}</td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{f.expires}</td>
                    <td>
                      {f.daysLeft === 0 ? (
                        <span style={{ color: 'var(--admin-danger)', fontSize: '12px', fontWeight: 600 }}>Expired</span>
                      ) : f.daysLeft <= 3 ? (
                        <span style={{ color: 'var(--admin-warning)', fontSize: '12px', fontWeight: 600 }}>
                          {f.daysLeft}d left ⚠️
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>{f.daysLeft}d left</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${f.status}`}>{f.status}</span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn--outline admin-btn--sm">View</button>
                        {f.status === 'active' && (
                          <button className="admin-btn admin-btn--danger admin-btn--sm">Remove</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <span>Showing {filtered.length} of {featured.length} featured slots</span>
          </div>
        </div>
      </div>
    </>
  );
}