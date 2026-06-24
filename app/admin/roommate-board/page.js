'use client';

import { useState } from 'react';

const posts = [
  { id: 'RM-041', author: 'Obinna Chukwu', type: 'seeking', location: 'GRA Phase 2', budget: '₦80,000', tags: ['No smoking', 'Quiet hours', 'Students only'], interests: 3, status: 'active', posted: 'Jun 23, 2025' },
  { id: 'RM-040', author: 'Kemi Adeyemi', type: 'offering', location: 'D-Line', budget: '₦60,000', tags: ['Female only', 'No parties'], interests: 7, status: 'active', posted: 'Jun 22, 2025' },
  { id: 'RM-039', author: 'Tunde Alabi', type: 'seeking', location: 'Rumuola', budget: '₦50,000', tags: ['Males only', 'Night workers ok'], interests: 1, status: 'active', posted: 'Jun 21, 2025' },
  { id: 'RM-038', author: 'Ngozi Eze', type: 'offering', location: 'Ada George', budget: '₦45,000', tags: ['Students only', 'No smoking'], interests: 5, status: 'flagged', posted: 'Jun 20, 2025' },
  { id: 'RM-037', author: 'Grace Okoro', type: 'seeking', location: 'Trans-Amadi', budget: '₦70,000', tags: ['Professionals', 'Quiet hours'], interests: 2, status: 'expired', posted: 'Jun 10, 2025' },
];

export default function AdminRoommateBoard() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = posts.filter((p) => {
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchType && matchStatus;
  });

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__row">
          <div>
            <p className="admin-page-header__eyebrow">Platform</p>
            <h1 className="admin-page-header__title">Roommate Board</h1>
            <p className="admin-page-header__subtitle">Moderate roommate posts and flag inappropriate content</p>
          </div>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Active Posts', value: '83' },
          { label: 'Seeking Rooms', value: '51' },
          { label: 'Offering Rooms', value: '32' },
          { label: 'Flagged', value: '4' },
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
            <span className="admin-card__title">All Posts</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="admin-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All types</option>
                <option value="seeking">Seeking</option>
                <option value="offering">Offering</option>
              </select>
              <select className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="flagged">Flagged</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Author</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Budget</th>
                  <th>Tags</th>
                  <th>Interests</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                        {p.id}
                      </span>
                    </td>
                    <td>
                      <a href="#" className="admin-table__link">{p.author}</a>
                    </td>
                    <td>
                      <span className={`admin-badge ${p.type === 'seeking' ? 'admin-badge--info' : 'admin-badge--active'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>{p.location}</td>
                    <td style={{ fontWeight: 600 }}>{p.budget}/mo</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {p.tags.map((tag) => (
                          <span key={tag} style={{
                            fontSize: '10px', padding: '2px 6px', borderRadius: '12px',
                            background: 'var(--admin-page-bg)', border: '1px solid var(--admin-border)',
                            color: 'var(--admin-text-muted)',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, textAlign: 'center' }}>{p.interests}</td>
                    <td>
                      <span className={`admin-badge ${
                        p.status === 'active' ? 'admin-badge--active' :
                        p.status === 'flagged' ? 'admin-badge--pending' :
                        'admin-badge--inactive'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{p.posted}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn--outline admin-btn--sm">View</button>
                        {p.status === 'flagged' && (
                          <>
                            <button className="admin-btn admin-btn--primary admin-btn--sm">Clear</button>
                            <button className="admin-btn admin-btn--danger admin-btn--sm">Remove</button>
                          </>
                        )}
                        {p.status === 'active' && (
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
            <span>Showing {filtered.length} of 87 posts</span>
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