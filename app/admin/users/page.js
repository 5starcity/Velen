'use client';

import { useState } from 'react';

const users = [
  { id: 'U001', name: 'Chukwuemeka Obi', email: 'c.obi@gmail.com', role: 'landlord', listings: 3, verified: true, joined: 'Mar 2025', lastActive: '2h ago' },
  { id: 'U002', name: 'Amaka Nwosu', email: 'amaka.n@yahoo.com', role: 'landlord', listings: 1, verified: true, joined: 'Apr 2025', lastActive: '1d ago' },
  { id: 'U003', name: 'Obinna Chukwu', email: 'obinna@gmail.com', role: 'tenant', listings: 0, verified: true, joined: 'May 2025', lastActive: '5h ago' },
  { id: 'U004', name: 'Fatima Bello', email: 'f.bello@outlook.com', role: 'landlord', listings: 2, verified: false, joined: 'Jun 2025', lastActive: '3h ago' },
  { id: 'U005', name: 'Grace Okoro', email: 'grace.o@gmail.com', role: 'tenant', listings: 0, verified: true, joined: 'Jun 2025', lastActive: '1h ago' },
  { id: 'U006', name: 'Daniel Briggs', email: 'd.briggs@gmail.com', role: 'landlord', listings: 1, verified: false, joined: 'Jun 2025', lastActive: '2d ago' },
];

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchVerified =
      verifiedFilter === 'all' ||
      (verifiedFilter === 'verified' && u.verified) ||
      (verifiedFilter === 'unverified' && !u.verified);
    const matchSearch =
      search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchVerified && matchSearch;
  });

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__row">
          <div>
            <p className="admin-page-header__eyebrow">Platform</p>
            <h1 className="admin-page-header__title">Users & Landlords</h1>
            <p className="admin-page-header__subtitle">Manage all registered users and landlord verifications</p>
          </div>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Users', value: '1,834' },
          { label: 'Landlords', value: '312' },
          { label: 'Verified Landlords', value: '298' },
          { label: 'Pending Verification', value: '14' },
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
            <span className="admin-card__title">All Users</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div className="admin-toolbar">
              <div className="admin-search">
                <span className="admin-search__icon">🔍</span>
                <input
                  type="text"
                  className="admin-search__input"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="admin-filter-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All roles</option>
                <option value="landlord">Landlords</option>
                <option value="tenant">Tenants</option>
              </select>
              <select className="admin-filter-select" value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)}>
                <option value="all">All verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Listings</th>
                  <th>Verified</th>
                  <th>Joined</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: 'var(--admin-accent-muted)',
                          border: '1px solid var(--admin-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700, color: 'var(--admin-accent)',
                          flexShrink: 0,
                        }}>
                          {u.name[0]}
                        </div>
                        <div>
                          <a href="#" className="admin-table__link">{u.name}</a>
                          <div className="admin-table__meta">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${u.role === 'landlord' ? 'admin-badge--info' : 'admin-badge--active'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {u.listings > 0 ? u.listings : <span style={{ color: 'var(--admin-text-light)' }}>—</span>}
                    </td>
                    <td>
                      {u.verified ? (
                        <span className="admin-badge admin-badge--verified">✓ Verified</span>
                      ) : (
                        <span className="admin-badge admin-badge--pending">Pending</span>
                      )}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{u.joined}</td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{u.lastActive}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn--outline admin-btn--sm">View</button>
                        {!u.verified && u.role === 'landlord' && (
                          <button className="admin-btn admin-btn--primary admin-btn--sm">Verify</button>
                        )}
                        <button className="admin-btn admin-btn--danger admin-btn--sm">Ban</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <span>Showing {filtered.length} of 1,834 users</span>
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