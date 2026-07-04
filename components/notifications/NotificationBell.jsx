"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBell,
  HiBell,
  HiOutlineCheckCircle,
  HiOutlineHomeModern,
  HiOutlineXMark,
  HiOutlineClipboardDocumentCheck,
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
  HiOutlineUserGroup,
  HiOutlineArrowRight,
} from "react-icons/hi2";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/firestoreNotifications";
import "@/styles/notifications.css";

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function notifIcon(type) {
  if (type === "roommate_interest")     return <HiOutlineUserGroup className="notif-item__icon notif-item__icon--roommate" />;
  if (type === "listing_interest")      return <HiOutlineHomeModern className="notif-item__icon notif-item__icon--home" />;
  if (type === "inspection_booked")     return <HiOutlineClipboardDocumentCheck className="notif-item__icon notif-item__icon--inspect" />;
  if (type === "reservation_request")   return <HiOutlineShieldCheck className="notif-item__icon notif-item__icon--reserve" />;
  if (type === "reservation_confirmed") return <HiOutlineCheckCircle className="notif-item__icon notif-item__icon--confirmed" />;
  if (type === "reservation_declined")  return <HiOutlineXMark className="notif-item__icon notif-item__icon--declined" />;
  if (type === "listing_approved")      return <HiOutlineShieldCheck className="notif-item__icon notif-item__icon--approved" />;
  if (type === "payment_received")      return <HiOutlineBanknotes className="notif-item__icon notif-item__icon--payment" />;
  return <HiOutlineBell className="notif-item__icon" />;
}

function notifHref(n) {
  if (n.listingId && (n.type === "listing_interest" || n.type === "reservation_request" || n.type === "listing_approved")) {
    return `/listings/${n.listingId}`;
  }
  if (n.listingId && (n.type === "reservation_confirmed" || n.type === "reservation_declined")) {
    return `/my-reservations`;
  }
  if (n.listingId && n.type === "inspection_booked") {
    return `/my-inspections`;
  }
  if (n.postId) return `/roommates`;
  if (n.type === "payment_received") return `/my-reservations`;
  return null;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const unread = notifications.filter((n) => !n.read).length;
  const preview = notifications.slice(0, 8);

  async function handleItemClick(n) {
    if (!n.read) await markNotificationRead(n.id);
    setOpen(false);
  }

  async function handleMarkAll() {
    await markAllNotificationsRead(user.uid);
  }

  return (
    <div className="notif-bell" ref={ref}>
      <button
        className={"notif-bell__btn" + (unread > 0 ? " has-unread" : "")}
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        {unread > 0 ? <HiBell /> : <HiOutlineBell />}
        {unread > 0 && (
          <span className="notif-bell__badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="notif-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className="notif-dropdown__header">
              <span>Notifications {unread > 0 && <span className="notif-dropdown__unread-count">{unread}</span>}</span>
              <div className="notif-dropdown__header-actions">
                {unread > 0 && (
                  <button className="notif-dropdown__mark-all" onClick={handleMarkAll}>
                    <HiOutlineCheckCircle /> Mark all read
                  </button>
                )}
                <button className="notif-dropdown__close" onClick={() => setOpen(false)}>
                  <HiOutlineXMark />
                </button>
              </div>
            </div>

            <div className="notif-dropdown__list">
              {preview.length === 0 ? (
                <div className="notif-dropdown__empty">
                  <HiOutlineBell className="notif-dropdown__empty-icon" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                preview.map((n) => {
                  const href = notifHref(n);
                  const inner = (
                    <div
                      key={n.id}
                      className={"notif-item" + (!n.read ? " unread" : "")}
                      onClick={() => handleItemClick(n)}
                    >
                      <div className="notif-item__left">{notifIcon(n.type)}</div>
                      <div className="notif-item__body">
                        <p className="notif-item__title">{n.title}</p>
                        <p className="notif-item__message">{n.message}</p>
                        <p className="notif-item__time">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <div className="notif-item__actions">
                          <div className="notif-item__unread-dot" />
                        </div>
                      )}
                    </div>
                  );
                  return href ? (
                    <Link href={href} key={n.id} style={{ textDecoration: "none" }}>{inner}</Link>
                  ) : (
                    <div key={n.id}>{inner}</div>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <Link href="/notifications" className="notif-dropdown__footer" onClick={() => setOpen(false)}>
                View all notifications <HiOutlineArrowRight />
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}