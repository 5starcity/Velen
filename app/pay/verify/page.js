// app/pay/verify/page.js
import { Suspense } from "react";
import VerifyPaymentContent from "./VerifyPaymentContent";

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={
      <main style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100svh",
        gap: 16,
      }}>
        <span style={{
          width: 32,
          height: 32,
          border: "3px solid rgba(255,255,255,0.08)",
          borderTopColor: "#4f6ef7",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
          display: "block",
        }} />
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Verifying payment...</p>
      </main>
    }>
      <VerifyPaymentContent />
    </Suspense>
  );
}