# Velen — Technical Documentation

> Last updated: May 2026 | Stack: Next.js 14, Firebase, Paystack, Cloudinary

---

## Stack Overview

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14 (App Router) | Plain CSS, no Tailwind |
| Auth | Firebase Auth | Email/password + Google OAuth |
| Database | Firestore (NoSQL) | Real-time, document-based |
| Storage | Cloudinary | Images and video uploads |
| Payments | Paystack | Nigerian payment gateway |
| Analytics | PostHog | Event tracking |
| Deployment | Vercel | Auto-deploy from Git |

---

## Folder Structure

```
rsu-housing/
├── app/                          # Next.js App Router pages
│   ├── page.js                   # Landing page
│   ├── layout.js                 # Root layout (Navbar, PostHog, Auth)
│   ├── listings/
│   │   ├── page.js               # Browse listings
│   │   └── [id]/page.js          # Listing detail
│   ├── login/page.js             # Login (email + Google)
│   ├── signup/page.js            # Signup with role selection
│   ├── dashboard/page.js         # Landlord dashboard
│   ├── add-listing/page.js       # Create listing form
│   ├── saved-listings/page.js    # Bookmarked listings (auth-gated)
│   ├── roommates/
│   │   ├── page.js               # Roommate board
│   │   └── post/page.js          # Post roommate listing
│   ├── agent/[id]/page.js        # Public agent profile
│   ├── transactions/
│   │   ├── page.js               # Transaction history
│   │   └── [reference]/page.js   # Receipt page
│   ├── notifications/page.js     # Notification centre
│   ├── verify-landlord/page.js   # Landlord NIN + bank verification
│   ├── terms/page.jsx            # Terms of Service
│   ├── privacy/page.jsx          # Privacy Policy
│   ├── support/page.js           # Support ticket form
│   └── api/
│       └── paystack/
│           ├── initialize/       # Create Paystack payment
│           ├── verify/           # Verify payment after redirect
│           ├── webhook/          # Paystack webhook handler
│           ├── verify-account/   # Verify bank account (landlord onboarding)
│           ├── create-subaccount/# Create Paystack split subaccount
│           └── refund/           # Initiate refund
│
├── components/
│   ├── home/
│   │   ├── Hero.jsx              # Landing page hero section
│   │   └── FeaturedListings.jsx  # Featured listings on home
│   ├── layout/
│   │   ├── Navbar.jsx            # Sticky navbar with auth state
│   │   ├── Footer.jsx            # Footer with legal links
│   │   ├── PageTransition.jsx    # Framer Motion page transitions
│   │   └── PostHogProvider.jsx   # Analytics wrapper
│   ├── listings/
│   │   ├── ListingCard.jsx       # Card used on browse + saved pages
│   │   ├── ListingTag.jsx        # Tag chips (Near RSU, Shared, etc.)
│   │   ├── FilterBar.jsx         # School/price/type filters
│   │   └── RoomatesSection.jsx   # Roommate section on landing
│   ├── notifications/
│   │   └── NotificationBell.jsx  # Bell icon with unread count
│   └── support/
│       └── SupportWidget.jsx     # Floating support button
│
├── context/
│   └── AuthContext.jsx           # Global auth state via onAuthStateChanged
│
├── lib/
│   ├── firebase.js               # Firebase app + auth + db init
│   ├── firebase-admin.js         # Firebase Admin SDK (server-side)
│   ├── auth.js                   # signUp, logIn, signInWithGoogle, logOut
│   ├── firestoreListings.js      # CRUD for listings collection
│   ├── firestoreAgents.js        # Agent profile queries
│   ├── firestoreTransactions.js  # Transaction read/write
│   ├── firestoreNotifications.js # Notifications CRUD
│   ├── firestoreRoommates.js     # Roommate post CRUD
│   ├── firestoreInspections.js   # Inspection booking (V1 light)
│   ├── firestoreDisputes.js      # Dispute submission (V2)
│   ├── firestoreReservations.js  # Reservations (V2)
│   ├── firestoreEscrow.js        # Escrow logic (V2)
│   ├── favorites.js              # localStorage bookmark helpers
│   ├── listingTags.js            # Tag generation from listing data
│   ├── locations.js              # PH areas, universities, area map
│   ├── paymentConfig.js          # Fee config + calculation helpers
│   ├── verification.js           # Landlord NIN + bank verification
│   ├── cloudinary.js             # Image upload helpers
│   ├── posthog.js                # PostHog client init
│   └── storageListings.js        # Legacy local storage listings
│
├── styles/                       # Plain CSS modules per page/component
├── data/
│   └── listings.js               # Static seed data (dev only)
└── tests/
    ├── unit/                     # Jest unit tests
    └── e2e/                      # Playwright E2E tests
```

---

## Firestore Collections

### `users`
```
{
  uid: string,
  name: string,
  email: string,
  role: "student" | "landlord",
  phone: string,
  verified: boolean,
  verificationStatus: "pending" | "verified" | "rejected",
  bankName: string,
  bankCode: string,
  accountNumber: string,
  accountName: string,
  paystackSubaccount: string,
  nin: string,
  createdAt: ISO string
}
```

### `listings`
```
{
  id: auto,
  title: string,
  description: string,
  price: number,
  type: string,                    // "Self Contain" | "Shared Room" | etc.
  beds: number,
  baths: number,
  furnishing: string,
  location: string,                // from LOCATIONS constant
  nearSchool: string,              // university key (UST, UniPort, etc.)
  availability: string,            // "Available Now" | "Available Soon" | "Unavailable"
  images: string[],                // Cloudinary URLs
  videoUrl: string,
  landlordId: string,              // uid of creating user
  landlordName: string,
  verified: boolean,
  featured: boolean,
  views: number,
  interests: number,
  totalMoveInCost: number,
  cautionFee: number,
  agencyFee: number,
  renewedAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: ISO string
}
```

### `reports`
```
{
  listingId: string,
  reporterId: string,
  category: string,
  detail: string,
  reviewed: boolean,
  status: "pending" | "reviewed" | "dismissed",
  createdAt: Timestamp
}
```

### `interests`
```
{
  listingId: string,
  userId: string,
  userName: string,
  createdAt: Timestamp
}
```

### `verificationRequests`
```
{
  uid: string,
  name: string,
  phone: string,
  address: string,
  nin: string,
  bankName: string,
  bankCode: string,
  accountNumber: string,
  accountName: string,
  paystackSubaccount: string,
  propertyType: string,
  yearsActive: string,
  status: "pending" | "approved" | "rejected",
  submittedAt: Timestamp
}
```

### `support_tickets`
```
{
  userId: string,
  name: string,
  email: string,
  category: string,
  message: string,
  status: "open" | "resolved",
  createdAt: Timestamp
}
```

### `notifications`
```
{
  userId: string,
  message: string,
  read: boolean,
  createdAt: Timestamp
}
```

---

## Auth Flow

```
User visits app
  └── AuthContext (onAuthStateChanged) fires
        ├── User exists → set currentUser in context
        └── No user → currentUser = null

Protected pages check:
  - onAuthStateChanged resolves
  - if no user → router.replace("/login?returnUrl=[current path]")
  - if wrong role → redirect to appropriate page
```

Google Sign-In new user flow:
```
signInWithGoogle()
  └── Check Firestore users/[uid]
        ├── Exists with role → proceed to app
        └── New or no role → show role selection screen
              └── saveSocialUserProfile(user, selectedRole)
                    └── redirect to app
```

---

## Payment Flow (V1 — Direct, no escrow)

```
Student clicks Pay on listing
  └── POST /api/paystack/initialize
        ├── amount = rent + service fee (5%)
        ├── metadata = { listingId, landlordId, userId }
        └── returns { authorization_url, reference }

Browser redirects to Paystack checkout
  └── Student pays

Paystack redirects to /pay/verify?reference=[ref]
  └── POST /api/paystack/verify
        ├── Verify reference with Paystack API
        ├── Write transaction to Firestore
        └── Redirect to /transactions/[reference]

Simultaneously — Paystack fires webhook to /api/paystack/webhook
  └── Verify signature
  └── Process charge.success event
  └── Update transaction status in Firestore
```

---

## Environment Variables

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=

# Payment Config
NEXT_PUBLIC_PAYMENT_SERVICE_FEE_PERCENT=5
NEXT_PUBLIC_ESCROW_RELEASE_HOURS=48        # V2 — not active
NEXT_PUBLIC_RESERVATION_FEES_ACTIVE=false  # V2 — not active
NEXT_PUBLIC_LISTING_FEES_ACTIVE=false      # V2 — not active

# Support
NEXT_PUBLIC_VELEN_SUPPORT_WHATSAPP=2349015117668
NEXT_PUBLIC_VELEN_SUPPORT_PHONE=09015117668

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

---

## Known Deferred Features (V2)

| Feature | File | Status |
|---------|------|--------|
| Escrow / 48hr hold | `lib/firestoreEscrow.js`, `app/cron/release-escrow/` | Code exists, disabled |
| Reservation system | `lib/firestoreReservations.js` | Code exists, not wired to UI |
| Dispute resolution | `lib/firestoreDisputes.js` | Code exists, not wired to UI |
| Apple Sign-In | `lib/auth.js` → `signInWithApple()` | Code exists, button hidden — needs Apple Dev Account ($99) |
| Listing fees | `paymentConfig.js` → `listingFeesActive` | Config exists, flag is false |

---

## Running Locally

```bash
git clone [repo]
cd rsu-housing
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                   # http://localhost:3000
```

## Running Tests

```bash
# Unit tests
npx jest

# E2E tests (requires dev server running)
npx playwright install chromium
npx playwright test

# E2E with UI
npx playwright test --ui
```