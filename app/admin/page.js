import Link from 'next/link';

// In production these come from your Firebase/DB
const stats = [
  { label: 'Total Listings', value: '248', change: '+12 this week', dir: 'up' },
  { label: 'Active Users', value: '1,834', change: '+89 this week', dir: 'up' },
  { label: 'Revenue (Month)', value: '₦318,000', change: '+23% vs last month', dir: 'up' },
  { label: 'Inspections', value: '64', change: '18 pending', dir: 'neutral' },
  { label: 'Pending Reviews', value: '11', change: '5 listings, 6 landlords', dir: 'neutral' },
  { label: 'Featured Slots', value: '9', change: '3 expire this week', dir: 'down' },
];

const recentListings = [
  { id: 'L001', title: 'Self-con at Rumuola', landlord: 'Chukwuemeka Obi', price: '₦180,000/yr', status: 'pending', posted: '2h ago' },
  { id: 'L002', title: '2-bedroom flat, GRA Phase 2', landlord: 'Amaka Nwosu', price: '₦650,000/yr', status: 'active', posted: '5h ago' },
  { id: 'L003', title: 'Room in shared house, Ada George', landlord: 'Daniel Briggs', price: '₦95,000/yr', status: 'active', posted: '1d ago' },
  { id: 'L004', title: 'Mini flat, Trans-Amadi', landlord: 'Fatima Bello', price: '₦220,000/yr', status: 'review', posted: '1d ago' },
];

const recentPayments = [
  { ref: 'TXN-2841', tenant: 'Obinna Chukwu', amount: '₦180,000', type: 'Rent', status: 'paid', time: '1h ago' },
  { ref: 'TXN-2840', tenant: 'Grace Okoro', amount: '₦2,000', type: 'Featured', status: 'paid', time: '3h ago' },
  { ref: 'TXN-2839', tenant: 'Tunde Alabi', amount: '₦95,000', type: 'Rent', status: 'pending', time: '6h ago' },
  { ref: 'TXN-2838', tenant: 'Ngozi Eze', amount: '₦15,000', type: 'Featured', status: 'failed', time: '8h ago' },
];

export default function AdminDashboard() {
  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__row">
          <div>
            <p className="admin-page-header__eyebrow">Rezidence Admin</p>
            <h1 className="admin-page-header__title">Dashboard</h1>
            <p className="admin-page-header__subtitle">Platform overview — updated just now</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin/listings?filter=pending" className="admin-btn admin-btn--primary">
              Review Pending
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-card__label">{s.label}</div>
            <div className="admin-stat-card__value">{s.value}</div>
            <div className={`admin-stat-card__change admin-stat-card__change--${s.dir}`}>
              {s.dir === 'up' ? '↑' : s.dir === 'down' ? '↓' : '·'} {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* Split content */}
      <div className="admin-content--split">
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Recent Listings */}
          <div className="admin-card">
            <div className="admin-card__header">
              <span className="admin-card__title">Recent Listings</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="admin-card__count">248 total</span>
                <Link href="/admin/listings" className="admin-btn admin-btn--outline admin-btn--sm">View all</Link>
              </div>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Listing</th>
                    <th>Landlord</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Posted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <a href={`/admin/listings/${l.id}`} className="admin-table__link">{l.title}</a>
                        <div className="admin-table__meta">{l.id}</div>
                      </td>
                      <td>{l.landlord}</td>
                      <td style={{ fontWeight: 500 }}>{l.price}</td>
                      <td>
                        <span className={`admin-badge admin-badge--${l.status}`}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>{l.posted}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-btn admin-btn--outline admin-btn--sm">View</button>
                          {l.status === 'pending' || l.status === 'review' ? (
                            <button className="admin-btn admin-btn--primary admin-btn--sm">Approve</button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="admin-card">
            <div className="admin-card__header">
              <span className="admin-card__title">Recent Payments</span>
              <Link href="/admin/payments" className="admin-btn admin-btn--outline admin-btn--sm">View all</Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Tenant</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((p) => (
                    <tr key={p.ref}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.ref}</span>
                      </td>
                      <td>{p.tenant}</td>
                      <td style={{ fontWeight: 600 }}>{p.amount}</td>
                      <td>
                        <span className="admin-badge admin-badge--info">{p.type}</span>
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge--${p.status}`}>{p.status}</span>
                      </td>
                      <td style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>{p.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Actions */}
          <div className="admin-card">
            <div className="admin-card__header">
              <span className="admin-card__title">Quick Actions</span>
            </div>
            <div className="admin-card__body" style={{ padding: '12px' }}>
              <div className="admin-quick-actions">
                <Link href="/admin/listings?filter=pending" className="admin-quick-action">
                  <span className="admin-quick-action__icon">🏠</span>
                  <div>
                    <div>Review Listings</div>
                    <div className="admin-quick-action__desc">5 awaiting approval</div>
                  </div>
                </Link>
                <Link href="/admin/users?filter=unverified" className="admin-quick-action">
                  <span className="admin-quick-action__icon">👤</span>
                  <div>
                    <div>Verify Landlords</div>
                    <div className="admin-quick-action__desc">6 pending verification</div>
                  </div>
                </Link>
                <Link href="/admin/featured" className="admin-quick-action">
                  <span className="admin-quick-action__icon">⭐</span>
                  <div>
                    <div>Manage Featured</div>
                    <div className="admin-quick-action__desc">3 slots expiring soon</div>
                  </div>
                </Link>
                <Link href="/admin/inspections?filter=pending" className="admin-quick-action">
                  <span className="admin-quick-action__icon">🔍</span>
                  <div>
                    <div>Inspection Queue</div>
                    <div className="admin-quick-action__desc">18 booked this week</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Platform Health */}
          <div className="admin-card">
            <div className="admin-card__header">
              <span className="admin-card__title">Platform Health</span>
            </div>
            <div className="admin-card__body">
              {[
                { label: 'Paystack Webhook', status: 'active', note: 'Last event 4m ago' },
                { label: 'Firebase Auth', status: 'active', note: 'All providers up' },
                { label: 'Cloudinary Storage', status: 'active', note: 'No errors' },
                { label: 'Email Notifications', status: 'pending', note: 'Check SMTP config' },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--admin-border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{item.note}</div>
                  </div>
                  <span className={`admin-badge admin-badge--${item.status}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}