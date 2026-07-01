const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || "rezidence";
const TERMII_BASE_URL = process.env.TERMII_BASE_URL || "https://v3.api.termii.com";

/**
 * Send an SMS via Termii
 * @param {string} to - phone number with country code e.g. 2348012345678
 * @param {string} message - SMS body (max 160 chars for single SMS)
 */
export async function sendSMS(to, message) {
  // Normalize phone number to international format
  const phone = normalizePhone(to);
  if (!phone) {
    console.error("Invalid phone number:", to);
    return;
  }

  try {
    const res = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: phone,
        from: TERMII_SENDER_ID,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: TERMII_API_KEY,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.code === "error") {
      console.error("Termii SMS failed:", data);
      return;
    }

    console.log("SMS sent to:", phone, "| Message ID:", data.message_id);
    return data;
  } catch (e) {
    // Never let SMS failure crash the main flow
    console.error("Termii error:", e.message);
  }
}

/**
 * Normalize Nigerian phone numbers to international format
 * 08012345678 → 2348012345678
 * 2348012345678 → 2348012345678
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("234")) return cleaned;
  if (cleaned.startsWith("0")) return "234" + cleaned.slice(1);
  return null;
}