# rezidence — Product Documentation

> Student housing platform for Port Harcourt, Nigeria
> Version: 1.0 (V1) | Updated: May 2026

---

## What is rezidence?

rezidence is a student housing discovery platform built specifically for university students in Port Harcourt, Nigeria. It connects students looking for accommodation near RSU, UniPort, IAUE, and Ken Saro-Wiwa Polytechnic with verified landlords and agents — showing full move-in costs upfront, with no hidden fees.

**Core promise to students:** Find a verified room near your school, see exactly what you'll pay, contact the landlord directly.

**Core promise to landlords:** List your property in front of thousands of students actively looking for housing.

---

## Target Users

| User Type | Description |
|-----------|-------------|
| Student | University student in PH looking for accommodation |
| Landlord | Property owner listing one or more units |
| Agent | Property manager handling listings on behalf of owners |

---

## V1 Feature Set

### For Students

**Browse & Discover**
- Browse listings filtered by school proximity (Near RSU, Near UniPort, etc.)
- Filter by price range, room type (self-contain, shared), furnishing
- View full move-in cost breakdown: rent + caution fee + agency fee
- Scam warning flag on listings priced suspiciously low (under ₦50,000)
- View listing photos and video walkthrough

**Trust & Safety**
- Verified badge on landlord-verified listings
- Report a listing (flagged to admin for review)
- Duplicate report prevention — one report per user per listing
- Scam price threshold warning at ₦50,000

**Engagement**
- Express interest in a listing (logged to Firestore, notifies landlord)
- Save/bookmark listings to localStorage
- View saved listings at `/saved-listings` (auth-gated)

**Roommates**
- Browse students looking for roommates
- Post a roommate listing (auth required)

---

### For Landlords / Agents

**Listing Management**
- Create listings with: title, description, price, type, beds, baths, furnishing, location, school proximity, photos (Cloudinary), video
- Move-in cost auto-calculation (rent + caution + agency fee)
- Edit listings
- Delete listings
- Update availability inline from dashboard (Available Now / Available Soon / Unavailable)
- Renew listing (resets 90-day expiry clock)

**Dashboard**
- View all personal listings
- See view count and interest count per listing
- Manage listing status

**Verification**
- Submit NIN for identity verification
- Submit bank account details (verified via Paystack)
- Paystack subaccount created automatically on approval
- Verified badge awarded on admin approval

**Agent Profile**
- Public profile page at `/agent/[id]`
- Shows all active listings, reviews, verification status

---

### Platform-Wide

**Auth**
- Email/password signup and login
- Google Sign-In (with role selection for new users)
- Role-based access: students and landlords see different UIs
- Protected routes redirect unauthenticated users to login with `returnUrl`

**Notifications**
- In-app notification bell with unread count
- Notifications for: new interests, listing updates

**Payments (V1)**
- Paystack integration for direct payment
- 5% platform service fee on transactions
- Transaction history at `/transactions`
- Receipt page at `/transactions/[reference]`
- Paystack webhook for payment confirmation

**Support**
- Support ticket submission form
- WhatsApp support channel
- `/support` page

**Legal**
- Terms of Service at `/terms`
- Privacy Policy at `/privacy`

**Analytics**
- PostHog tracking on all key user events
- Events tracked: listing views, search, filter usage, express interest, payment initiated, signup, login

---

## Features Deliberately Deferred to V2

These features exist in the codebase but are disabled — pushed to V2 when rezidence has an active user base and landlord trust is established.

| Feature | Reason Deferred |
|---------|----------------|
| Reservation system | Too complex for V1; requires landlord discipline on availability management |
| Escrow / 48hr hold | Nigerian market not ready; landlords expect immediate payment; CBN compliance risk at scale |
| Dispute resolution UI | Depends on escrow being live |
| Listing fees | Free period of 3–5 months to build landlord base first |
| Reservation fees | Same as above |
| Apple Sign-In | Requires $99/yr Apple Developer Account |

---

## Pricing Model (V1)

**Free period:** All features free for landlords for 3–5 months after launch.

**Platform fee on payments:** 5% service fee charged to student on each transaction. Configurable via `NEXT_PUBLIC_PAYMENT_SERVICE_FEE_PERCENT` env var.

**V2 subscription tiers (planned):**
| Tier | Price | Features |
|------|-------|---------|
| Free | ₦0 | 2 listings, basic profile |
| Basic | TBD | 5 listings, verified badge |
| Pro | TBD | Unlimited listings, featured in search, analytics dashboard |

The free period strategy: give all landlords Pro features for free → they get addicted to analytics and visibility → introduce pricing when they already know what they'd lose by downgrading.

---

## User Flows

### Student: Finding a Room
```
Land on homepage
→ Browse Rooms button
→ Listings page (pre-filtered by school if set)
→ Apply filters (area, price, type)
→ Click listing card
→ View listing detail (photos, video, full cost breakdown)
→ Express interest OR contact landlord directly
→ (V2) Reserve and pay via Paystack
```

### Student: Saving Listings
```
Browse listings
→ Click heart/bookmark on any listing card
→ Saved to localStorage immediately
→ Visit /saved-listings (redirects to login if not auth'd)
→ View and compare saved listings
```

### Landlord: Listing a Property
```
Sign up / Log in as landlord
→ Complete verification (NIN + bank account)
→ Dashboard → Add Listing
→ Fill form: type, price, photos (min 1), video (optional), location
→ Submit → listing goes live immediately
→ Students can now find and contact you
```

### Landlord: Managing Listings
```
Dashboard
→ See all listings with view counts and interest counts
→ Change availability status inline
→ Edit listing details
→ Renew listing (resets expiry clock)
→ Delete listing
```

---

## Key Product Decisions

**Why plain CSS instead of Tailwind?**
Personal preference and full control over design. No utility class bloat, no purge configuration issues, easier to maintain for a solo developer.

**Why Cloudinary instead of Firebase Storage?**
Better transformation API, easier video support, free tier is more generous for media-heavy apps.

**Why localStorage for bookmarks instead of Firestore?**
Speed and simplicity for V1. No Firestore read cost, works even when offline. Downside: bookmarks don't sync across devices. V2 may move this to Firestore.

**Why WhatsApp-first for landlord contact instead of in-app messaging?**
Students and landlords in Nigeria are already on WhatsApp. Building a full in-app messaging system for V1 would take weeks and add complexity without proven demand. WhatsApp pre-fill links solve the problem in a day.

**Why Port Harcourt first?**
Deep focus on one market is better than shallow presence in many. Choba (Back Gate) alone has thousands of students. Nail PH first, then expand to other university cities.

**Why push escrow and reservations to V2?**
See product docs above. Nigerian market trust dynamics, landlord payment expectations, and CBN compliance risk all point to introducing these features gradually after proving the platform works.

---

## Scam Prevention Strategy

rezidence's approach to trust and safety:

1. **Verified badge** — only landlords who complete NIN + bank verification get the badge
2. **Scam price flag** — listings under ₦50,000/yr automatically show a warning banner
3. **Report system** — students can flag any listing; reports go to admin review
4. **Duplicate report prevention** — one report per user per listing to prevent abuse
5. **Agent public profile** — full review history visible, accountability layer

---

## Supported Universities (V1)

| Key | University | Main Area |
|-----|-----------|-----------|
| UST | Rivers State University (RSU) | Choba, Obirikwe |
| UniPort | University of Port Harcourt | Choba, Rumuola |
| IAUE | Ignatius Ajuru University | Rumuola, Eliozu |
| KenSaro | Ken Saro-Wiwa Polytechnic | Bori, Rumuola |
| RSFCOLLEGE | Rivers State College of Arts & Science | Peter Odili |

---

## Competition

| Platform | Gap rezidence Fills |
|----------|----------------|
| PropertyPro.ng | Not student-focused, poor mobile UX |
| Nigeria Property Centre | Agent/realtor heavy, no student tools |
| Tolet.com.ng | General, not Port Harcourt depth |
| Houza | Better UX but Lagos-focused |

**rezidence's moat:** Student-only focus + verified listings + Port Harcourt depth + full move-in cost transparency. Nobody is doing all of this together for PH students.

---

## Roadmap

### V1 (Current)
- Listings with school-proximity filtering
- Verified landlord badges
- Scam warnings and report system
- Roommate board
- Direct Paystack payment (no escrow)
- Agent public profiles
- Notification system
- Terms + Privacy pages

### V2 (After first 100 active users)
- Reservation system
- Escrow with 48hr inspection window
- Dispute resolution UI
- Subscription tiers for landlords
- Listing fees
- Apple Sign-In
- Full-text search (Algolia)
- Push notifications (mobile)

### V3 (Scale)
- Multi-city expansion (Benin, Owerri, Enugu)
- Campus ambassador program
- Analytics dashboard for landlords
- API for third-party integrations