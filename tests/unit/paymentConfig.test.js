/**
 * Unit tests — lib/paymentConfig.js
 * Run: npx jest paymentConfig.test.js
 */

// Set env vars before import
process.env.NEXT_PUBLIC_PAYMENT_SERVICE_FEE_PERCENT = "5";
process.env.NEXT_PUBLIC_ESCROW_RELEASE_HOURS = "48";
process.env.NEXT_PUBLIC_RESERVATION_FEES_ACTIVE = "false";
process.env.NEXT_PUBLIC_LISTING_FEES_ACTIVE = "false";

const {
  calculateServiceFee,
  calculateReservationFee,
  calculateTotal,
  PAYMENT_CONFIG,
} = require("../../lib/paymentConfig");

// ── PAYMENT_CONFIG defaults ─────────────────────────────────
describe("PAYMENT_CONFIG", () => {
  it("serviceFeePercent defaults to 5", () => {
    expect(PAYMENT_CONFIG.serviceFeePercent).toBe(5);
  });

  it("escrowReleaseHours defaults to 48", () => {
    expect(PAYMENT_CONFIG.escrowReleaseHours).toBe(48);
  });

  it("reservationFeesActive defaults to false", () => {
    expect(PAYMENT_CONFIG.reservationFeesActive).toBe(false);
  });

  it("listingFeesActive defaults to false", () => {
    expect(PAYMENT_CONFIG.listingFeesActive).toBe(false);
  });

  it("reservationFeeUnder500k is 25000", () => {
    expect(PAYMENT_CONFIG.reservationFeeUnder500k).toBe(25000);
  });

  it("reservationFeeAbove500k is 50000", () => {
    expect(PAYMENT_CONFIG.reservationFeeAbove500k).toBe(50000);
  });
});

// ── calculateServiceFee ─────────────────────────────────────
describe("calculateServiceFee", () => {
  it("calculates 5% of ₦180,000 correctly", () => {
    expect(calculateServiceFee(180000)).toBe(9000);
  });

  it("calculates 5% of ₦500,000 correctly", () => {
    expect(calculateServiceFee(500000)).toBe(25000);
  });

  it("returns 0 for 0 amount", () => {
    expect(calculateServiceFee(0)).toBe(0);
  });

  it("rounds to nearest whole number", () => {
    // 5% of 100001 = 5000.05 → rounds to 5000
    expect(calculateServiceFee(100001)).toBe(5000);
  });

  it("handles large amounts correctly", () => {
    expect(calculateServiceFee(1000000)).toBe(50000);
  });
});

// ── calculateReservationFee ─────────────────────────────────
describe("calculateReservationFee", () => {
  it("returns 0 when reservation fees are inactive", () => {
    expect(calculateReservationFee(200000)).toBe(0);
    expect(calculateReservationFee(600000)).toBe(0);
  });

  // These tests simulate when fees are active
  it("returns 25000 for rent under ₦500,000 (fees active)", () => {
    // Temporarily enable fees
    PAYMENT_CONFIG.reservationFeesActive = true;
    expect(calculateReservationFee(450000)).toBe(25000);
    PAYMENT_CONFIG.reservationFeesActive = false;
  });

  it("returns 50000 for rent at or above ₦500,000 (fees active)", () => {
    PAYMENT_CONFIG.reservationFeesActive = true;
    expect(calculateReservationFee(500000)).toBe(50000);
    expect(calculateReservationFee(750000)).toBe(50000);
    PAYMENT_CONFIG.reservationFeesActive = false;
  });
});

// ── calculateTotal ──────────────────────────────────────────
describe("calculateTotal", () => {
  it("returns correct breakdown for ₦180,000", () => {
    const result = calculateTotal(180000);
    expect(result.amount).toBe(180000);
    expect(result.fee).toBe(9000);
    expect(result.total).toBe(189000);
  });

  it("total equals amount + fee", () => {
    const { amount, fee, total } = calculateTotal(250000);
    expect(total).toBe(amount + fee);
  });

  it("handles ₦0 correctly", () => {
    const result = calculateTotal(0);
    expect(result.amount).toBe(0);
    expect(result.fee).toBe(0);
    expect(result.total).toBe(0);
  });

  it("returns all three keys", () => {
    const result = calculateTotal(100000);
    expect(result).toHaveProperty("amount");
    expect(result).toHaveProperty("fee");
    expect(result).toHaveProperty("total");
  });
});