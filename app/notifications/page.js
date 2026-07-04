"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineHomeModern,
  HiOutlineClipboardDocumentCheck,
  HiOutlineShieldCheck,
  HiOutlineBanknotes,
  HiOutlineUserGroup,
  HiOutlineXMark,
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlineStar,
} from "react-icons/hi2";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeToNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/firestoreNotifications";
import "@/styles/notifications-page.css";

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function isToday(ts) {
  if (!ts) return false;
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toDateString() === new Date().toDateString();
}

function notifIcon(type) {
  const cls = "notif-page-item__icon";
  if (type === "roommate_interest") return <HiOutlineUserGroup className={`${cls} ${cls}--roommate`} />;
  if (type === "listing_interest") return <HiOutlineHomeModern className={`${cls} ${cls}--home`} />;
  if (type === "inspection_booked") return <HiOutlineClipboardDocumentCheck className={`${cls} ${cls}--inspect`} />;
  if (type === "reservation_request") return <HiOutlineShieldCheck className={`${cls} ${cls}--reserve`} />;
  if (type === "reservation_confirmed") return <HiOutlineCheckCircle className={`${cls} ${cls}--confirmed`} />;
  if (type === "reservation_declined") return <HiOutlineXMark className={`${cls} ${cls}--declined`} />;
  if (type === "listing_approved") return <HiOutlineShieldCheck className={`${cls} ${cls}--approved`} />;
  if (type === "payment_received") return <HiOutlineBanknotes className={`${cls} ${cls}--payment`} />;
  if (type === "featured_activated") return <HiOutlineStar className={`${cls} ${cls}--featured`} />;
  return <HiOutlineBell className={cls} />;
}

function notifHref(n) {
  if (n.type === "featured_activated") return `/listings/${n.listingId}`;
  if (n.listingId && ["listing_interest", "reservation_request", "listing_approved"].includes(n.type)) {
    return `/listings/${n.listingId}`;
  }
  if (["reservation_confirmed", "reservation_declined"].includes(n.type)) return `/my-reservations`;
  if (n.type === "inspection_booked") return `/my-inspections`;
  if (n.postId) return `/roommates`;
  if (n.type === "payment_received") return `/my-reservations`;
  return null;
}

function notifColor(type) {
  if (type === "reservation_confirmed" || type === "listing_approved") return "green";
  if (type === "reservation_declined") return "red";
  if (type === "payment_received") return "yellow";
  if (type === "roommate_interest") return "teal";
  if (type === "featured_activated") return "featured";
  return "blue";
}

const FILTERS = ["all", "unread", "listings", "reservations", "roommates", "featured"];

function matchesFilter(n, filter) {
  if (filter === "all") return true;
  if (filter === "unread") return !n.read;
  if (filter === "listings") return ["listing_interest", "listing_approved"].includes(n.type);
  if (filter === "reservations") return ["reservation_request", "reservation_confirmed", "reservation_declined", "payment_received", "inspection_booked"].includes(n.type);
  if (filter === "roommates") return n.type === "roommate_interest";
  if (filter === "featured") return n.type === "featured_activated";
  return true;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.uid, setNotifications);
    return () => unsub();
  }, [user]);

  if (authLoading) {
    return (
      <main className="notif-page">
        <div className="notif-page__loading"><div className="notif-page__spinner" /></div>
      </main>
    );
  }

  if (!user) return null;

  const filtered = notifications.filter((n) => matchesFilter(n, filter));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const todayItems = filtered.filter((n) => isToday(n.createdAt));
  const earlierItems = filtered.filter((n) => !isToday(n.createdAt));

  const hasFeatured = notifications.some((n) => n.type === "featured_activated");
  const visibleFilters = FILTERS.filter((f) => f !== "featured" || hasFeatured);

  async function handleClick(n) {
    if (!n.read) await markNotificationRead(n.id);
    const href = notifHref(n);
    if (href) router.push(href);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead(user.uid);
  }

  function NotifItem({ n }) {
    const color = notifColor(n.type);
    const href = notifHref(n);
    return (
      <motion.div
        className={`notif-page-item${!n.read ? " unread" : ""} notif-page-item--${color}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        onClick={() => handleClick(n)}
        style={{ cursor: href || !n.read ? "pointer" : "default" }}
      >
        <div className="notif-page-item__icon-wrap">
          {notifIcon(n.type)}
        </div>

        <div className="notif-page-item__body">
          <div className="notif-page-item__top">
            <p className="notif-page-item__title">{n.title}</p>
            <span className="notif-page-item__time">{timeAgo(n.createdAt)}</span>
          </div>
          <p className="notif-page-item__message">{n.message || n.body}</p>
          {n.senderName && (
            <p className="notif-page-item__sender">From: {n.senderName}</p>
          )}
          {n.type === "featured_activated" && n.txRef && (
            <p className="notif-page-item__ref">Payment ref: {n.txRef}</p>
          )}
        </div>

        <div className="notif-page-item__right">
          {!n.read && <div className="notif-page-item__dot" />}
        </div>
      </motion.div>
    );
  }

  function Group({ label, items }) {
    if (items.length === 0) return null;
    return (
      <div className="notif-page__group">
        <p className="notif-page__group-label">{label}</p>
        <AnimatePresence>
          {items.map((n) => <NotifItem key={n.id} n={n} />)}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <main className="notif-page">

      <motion.div
        className="notif-page__header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Link href="/listings" className="notif-page__back">
          <HiOutlineArrowLeft /> Back
        </Link>
        <div className="notif-page__header-top">
          <div>
            <h1>
              Notifications
              {unreadCount > 0 && (
                <span className="notif-page__unread-badge">{unreadCount}</span>
              )}
            </h1>
            <p className="notif-page__sub">Stay up to date with your activity on rezidence.</p>
          </div>
          {unreadCount > 0 && (
            <div className="notif-page__header-actions">
              <button className="notif-page__action-btn" onClick={handleMarkAllRead}>
                <HiOutlineCheck /> Mark all read
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {notifications.length > 0 && (
        <motion.div
          className="notif-page__filters"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {visibleFilters.map((f) => {
            const count = f === "all"
              ? notifications.length
              : f === "unread"
                ? unreadCount
                : notifications.filter((n) => matchesFilter(n, f)).length;
            return (
              <button
                key={f}
                className={`notif-page__filter${filter === f ? " active" : ""}${f === "featured" ? " notif-page__filter--featured" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "featured" && <HiOutlineStar />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {count > 0 && (
                  <span className={`notif-page__filter-count${f === "featured" ? " notif-page__filter-count--featured" : ""}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      )}

      <div className="notif-page__content">
        {filtered.length === 0 ? (
          <motion.div
            className="notif-page__empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <HiOutlineBell className="notif-page__empty-icon" />
            <h2>{filter === "all" ? "No notifications yet" : `No ${filter} notifications`}</h2>
            <p>
              {filter === "all"
                ? "When landlords respond or students show interest, you'll see it here."
                : "Try switching to a different filter."}
            </p>
          </motion.div>
        ) : (
          <>
            <Group label="Today" items={todayItems} />
            <Group label="Earlier" items={earlierItems} />
          </>
        )}
      </div>

    </main>
  );
}