'use client';

import { useState } from 'react';

const listings = [
  { id: 'L001', title: 'Self-con at Rumuola', landlord: 'Chukwuemeka Obi', type: 'Self-contain', price: '₦180,000', location: 'Rumuola', status: 'pending', featured: false, images: 4, posted: 'Jun 23, 2025' },
  { id: 'L002', title: '2-bedroom flat, GRA Phase 2', landlord: 'Amaka Nwosu', type: '2-Bedroom', price: '₦650,000', location: 'GRA Phase 2', status: 'active', featured: true, images: 8, posted: 'Jun 22, 2025' },
  { id: 'L003', title: 'Room in shared house, Ada George', landlord: 'Daniel Briggs', type: 'Room', price: '₦95,000', location: 'Ada George', status: 'active', featured: false, images: 3, posted: 'Jun 21, 2025' },
  { id: 'L004', title: 'Mini flat, Trans-Amadi', landlord: 'Fatima Bello', type: 'Mini flat', price: '₦220,000', location: 'Trans-Amadi', status: 'review', featured: false, images: 6, posted: 'Jun 21, 2025' },
  { id: 'L005', title: '1-bedroom apartment, D-Line', landlord: 'Emeka Eze', type: '1-Bedroom', price: '₦280,000', location: 'D-Line', status: 'active', featured: true, images: 5, posted: 'Jun 20, 2025' },
  { id: 'L006', title: 'Bedsitter at Rumunduru', landlord: 'Sandra Okafor', type: 'Bedsitter', price: '₦120,000', location: 'Rumunduru', status: 'inactive', featured: false, images: 2, posted: 'Jun 18, 2025' },
];

export default function AdminListings() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = listings.filter((l) => {
    const matchesFilter = filter === 'all' || l.status === filter;
    const matchesSearch =
      search === '' ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.landlord.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__row">
          <div>
            <p className="admin-page-header__eyebrow">Platform</p>
            <h1 className="admin-page-header__title">Listings</h1>
            <p className="admin-page-header__subtitle">Manage all property listings on Rezidence</p>
          </div>
          <button className="admin-btn admin-btn--primary">+ Add listing</button>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total', value: '248' },
          { label: 'Active', value: '214' },
          { label: 'Pending Review', value: '11' },
          { label: 'Inactive', value: '23' },
        ].map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-card__label">{s.label}</div>
            <div className="admin-stat-card__value">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <div className="admin-card__header">
            <span className="admin-card__title">All Listings</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div className="admin-toolbar">
              <div className="admin-search">
                <span className="admin-search__icon">🔍</span>
                <input
                  type="text"
                  className="admin-search__input"
                  placeholder="Search listings or landlords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="admin-filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="review">Under review</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Landlord</th>
                  <th>Type</th>
                  <th>Price/yr</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Posted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <a href="#" className="admin-table__link">{l.title}</a>
                      <div className="admin-table__meta">{l.id} · {l.images} images</div>
                    </td>
                    <td>{l.landlord}</td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>{l.type}</td>
                    <td style={{ fontWeight: 600 }}>{l.price}</td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{l.location}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${l.status}`}>{l.status}</span>
                    </td>
                    <td>
                      {l.featured ? (
                        <span className="admin-badge admin-badge--featured">⭐ Yes</span>
                      ) : (
                        <span style={{ color: 'var(--admin-text-light)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{l.posted}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn--outline admin-btn--sm">View</button>
                        {(l.status === 'pending' || l.status === 'review') && (
                          <button className="admin-btn admin-btn--primary admin-btn--sm">Approve</button>
                        )}
                        {l.status === 'active' && (
                          <button className="admin-btn admin-btn--danger admin-btn--sm">Suspend</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <span>Showing {filtered.length} of 248 listings</span>
            <div className="admin-pagination__pages">
              <button className="admin-pagination__btn admin-pagination__btn--active">1</button>
              <button className="admin-pagination__btn">2</button>
              <button className="admin-pagination__btn">3</button>
              <button className="admin-pagination__btn">→</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}