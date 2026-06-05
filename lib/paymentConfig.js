// lib/paymentConfig.js
// Single source of truth for all payment config
// Change these env vars to adjust fees without touching code

export const PAYMENT_CONFIG = {
  // Service fee on rent payments (percentage)
  serviceFeePercent: Number(process.env.NEXT_PUBLIC_PAYMENT_SERVICE_FEE_PERCENT || 5),

  // Escrow release window in hours
  escrowReleaseHours: Number(process.env.NEXT_PUBLIC_ESCROW_RELEASE_HOURS || 48),

  // Reservation fees (activate later)
  reservationFeeUnder500k: 25000,
  reservationFeeAbove500k: 50000,

  // Are reservation fees active?
  reservationFeesActive: process.env.NEXT_PUBLIC_RESERVATION_FEES_ACTIVE === "true",

  // Are listing fees active?
  listingFeesActive: process.env.NEXT_PUBLIC_LISTING_FEES_ACTIVE === "true",

  // Support contacts
  supportWhatsApp: process.env.NEXT_PUBLIC_rezidence_SUPPORT_WHATSAPP || "2349015117668",
  supportPhone: process.env.NEXT_PUBLIC_rezidence_SUPPORT_PHONE || "09015117668",

  // Paystack
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
};

export function calculateServiceFee(amount) {
  return Math.round(amount * (PAYMENT_CONFIG.serviceFeePercent / 100));
}

export function calculateReservationFee(rentAmount) {
  if (!PAYMENT_CONFIG.reservationFeesActive) return 0;
  return rentAmount >= 500000
    ? PAYMENT_CONFIG.reservationFeeAbove500k
    : PAYMENT_CONFIG.reservationFeeUnder500k;
}

export function calculateTotal(amount) {
  const fee = calculateServiceFee(amount);
  const total = amount + fee;
  return { amount, fee, total };
}