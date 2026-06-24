'use client';

import { useState } from 'react';

const inspections = [
  { id: 'INS-081', listing: 'Self-con at Rumuola', tenant: 'Obinna Chukwu', landlord: 'Chukwuemeka Obi', date: 'Jun 25, 2025', time: '10:00 AM', status: 'scheduled', notes: '' },
  { id: 'INS-080', listing: '2-bed, GRA Phase 2', tenant: 'Kemi Adeyemi', landlord: 'Amaka Nwosu', date: 'Jun 24, 2025', time: '2:00 PM', status: 'completed', notes: 'Tenant interested' },
  { id: 'INS-079', listing: 'Mini flat, Trans-Amadi', tenant: 'Tunde Alabi', landlord: 'Fatima Bello', date: 'Jun 24, 2025', time: '11:00 AM', status: 'scheduled', notes: '' },
  { id: 'INS-078', listing: 'Room, Ada George', tenant: 'Ngozi Eze', landlord: 'Daniel Briggs', date: 'Jun 23, 2025', time: '3:00 PM', status: 'cancelled', notes: 'Tenant no-show' },
  { id: 'INS-077', listing: '1-bed, D-Line', tenant: 'Grace Okoro', landlord: 'Emeka Eze', date: 'Jun 22, 2025', time: '9:00 AM', status: 'completed', notes: 'Payment made after' },
];

export default function AdminInspections() {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = inspections.filter((i) =>
    statusFilter === 'all' || i.status === statusFilter
  );

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__row">
          <div>
            <p className="admin-page-header__eyebrow">Transactions</p>
            <h1 className="admin-page-header__title">Inspections</h1>
            <p className="admin-page-header__subtitle">Track all property inspection bookings</p>
          </div>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { label: 'Total Booked', value: '64' },
          { label: 'Scheduled', value: '18' },
          { label: 'Completed', value: '39' },
          { label: 'Cancelled', value: '7' },
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
            <span className="admin-card__title">Inspection Bookings</span>
            <select className="admin-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Listing</th>
                  <th>Tenant</th>
                  <th>Landlord</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ins) => (
                  <tr key={ins.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                        {ins.id}
                      </span>
                    </td>
                    <td>
                      <a href="#" className="admin-table__link">{ins.listing}</a>
                    </td>
                    <td>{ins.tenant}</td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>{ins.landlord}</td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{ins.date}</div>
                      <div className="admin-table__meta">{ins.time}</div>
                    </td>
                    <td>
                      <span className={`admin-badge ${
                        ins.status === 'scheduled' ? 'admin-badge--pending' :
                        ins.status === 'completed' ? 'admin-badge--active' :
                        'admin-badge--inactive'
                      }`}>
                        {ins.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                      {ins.notes || '—'}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn--outline admin-btn--sm">View</button>
                        {ins.status === 'scheduled' && (
                          <button className="admin-btn admin-btn--danger admin-btn--sm">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <span>Showing {filtered.length} of 64 inspections</span>
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