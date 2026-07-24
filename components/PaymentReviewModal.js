// components/PaymentReviewModal.js
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineXMark,
  HiOutlineInformationCircle,
  HiOutlineClipboardDocumentCheck,
} from "react-icons/hi2";
import "@/styles/payment-review-modal.css";

export default function PaymentReviewModal({
  open,
  onClose,
  onConfirm,
  paying,
  listing,
  rentAmount,
  serviceFee,
  serviceFeePercent,
  selectedAddons,   // [{ id, name, price }]
  total,
  hasInspection,    // null while loading, true/false once known
  onBookInspection,
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="prm__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="prm__modal"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="prm__header">
            <div>
              <p className="prm__title">Review and pay</p>
              <p className="prm__sub">{listing?.title}</p>
            </div>
            <button className="prm__close" onClick={onClose}>
              <HiOutlineXMark />
            </button>
          </div>

          {hasInspection === false && (
            <div className="prm__notice">
              <HiOutlineInformationCircle className="prm__notice-icon" />
              <div>
                <p className="prm__notice-title">Haven&apos;t inspected yet?</p>
                <p className="prm__notice-text">
                  We advise inspecting the property before paying.
                </p>
                <button className="prm__notice-btn" onClick={onBookInspection}>
                  <HiOutlineClipboardDocumentCheck /> Book inspection
                </button>
              </div>
            </div>
          )}

          <div className="prm__rows">
            <div className="prm__row">
              <span>Annual rent</span>
              <strong>₦{rentAmount.toLocaleString()}</strong>
            </div>

            {selectedAddons.map((addon) => (
              <div className="prm__row" key={addon.id}>
                <span>{addon.name}</span>
                <strong>₦{addon.price.toLocaleString()}</strong>
              </div>
            ))}

            <div className="prm__row">
              <span>Rezidence service fee ({serviceFeePercent}%)</span>
              <strong>₦{serviceFee.toLocaleString()}</strong>
            </div>
          </div>

          <div className="prm__total-row">
            <span>Total</span>
            <strong>₦{total.toLocaleString()}</strong>
          </div>

          <button className="prm__pay-btn" onClick={onConfirm} disabled={paying}>
            {paying ? "Redirecting to payment..." : `Pay ₦${total.toLocaleString()} securely`}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}