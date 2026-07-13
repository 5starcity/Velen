import crypto from "crypto";

// Stateless token: no need to store per-user tokens in Firestore.
// Signature = HMAC(email) using a server-only secret, so a token
// can only be forged by someone with UNSUBSCRIBE_SECRET.

export function generateUnsubscribeToken(email) {
  return crypto
    .createHmac("sha256", process.env.UNSUBSCRIBE_SECRET)
    .update(email.toLowerCase().trim())
    .digest("hex");
}

export function verifyUnsubscribeToken(email, token) {
  const expected = generateUnsubscribeToken(email);
  // timing-safe compare to avoid leaking token via response-time attacks
  const a = Buffer.from(expected);
  const b = Buffer.from(token || "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}