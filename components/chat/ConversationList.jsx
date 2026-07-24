"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useConversations } from "@/hooks/useConversations";
import Image from "next/image";

function formatTimestamp(iso) {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], { weekday: "short" });
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ConversationList() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: conversations, isLoading, isError } = useConversations();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];

    return conversations.filter((conv) => {
      const name = conv.otherParticipant?.name ?? "";
      const lastMessage = conv.lastMessage?.text ?? "";

      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        lastMessage.toLowerCase().includes(search.toLowerCase());

      const matchesTab = activeTab === "all" || conv.unreadCount > 0;

      return matchesSearch && matchesTab;
    });
  }, [conversations, search, activeTab]);

  function handleConversationClick(conversationId) {
    router.push(`/chat/${conversationId}`);
  }

  return (
    <section className="conversation-list">
      <header className="conversation-list__header">
        <div>
          <h1>Messages</h1>
          <p>Conversations about your listings</p>
        </div>
      </header>

      <div className="conversation-list__search-wrapper">
        <svg
          className="conversation-list__search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>

        <input
          type="search"
          placeholder="Search conversations"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="conversation-list__search"
        />

        {search && (
          <button
            type="button"
            className="conversation-list__clear-search"
            onClick={() => setSearch("")}
          >
            ×
          </button>
        )}
      </div>

      <div className="conversation-list__tabs">
        <button
          type="button"
          className={
            activeTab === "all"
              ? "conversation-list__tab conversation-list__tab--active"
              : "conversation-list__tab"
          }
          onClick={() => setActiveTab("all")}
        >
          All
        </button>

        <button
          type="button"
          className={
            activeTab === "unread"
              ? "conversation-list__tab conversation-list__tab--active"
              : "conversation-list__tab"
          }
          onClick={() => setActiveTab("unread")}
        >
          Unread
        </button>
      </div>

      <div className="conversation-list__items">
        {isLoading && <LoadingState />}

        {isError && !isLoading && (
          <div className="conversation-list__empty">
            <h3>Couldn&apos;t load conversations</h3>
            <p>Check your connection and try again.</p>
          </div>
        )}

        {!isLoading && !isError && filteredConversations.length === 0 && (
          <EmptyState search={search} activeTab={activeTab} />
        )}

        {!isLoading &&
          !isError &&
          filteredConversations.map((conv) => {
            const isActive = pathname === `/chat/${conv.id}`;

            return (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={isActive}
                onClick={() => handleConversationClick(conv.id)}
              />
            );
          })}
      </div>
    </section>
  );
}

/* =====================================================
   CONVERSATION ITEM
===================================================== */

function ConversationItem({ conversation, isActive, onClick }) {
  const name = conversation.otherParticipant?.name ?? "Unknown user";
  const avatarUrl = conversation.otherParticipant?.avatarUrl;
  const initials = getInitials(name);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "conversation-item",
        isActive && "conversation-item--active",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="conversation-item__avatar-wrapper">
        <div className="conversation-item__avatar">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={48}
              height={48}
              className="conversation-item__avatar-image"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>
      </div>

      <div className="conversation-item__content">
        <div className="conversation-item__top">
          <span className="conversation-item__name">{name}</span>
          <span className="conversation-item__timestamp">
            {formatTimestamp(conversation.updatedAt)}
          </span>
        </div>

        <div className="conversation-item__bottom">
          <span
            className={[
              "conversation-item__preview",
              conversation.unreadCount > 0 &&
                "conversation-item__preview--unread",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {conversation.lastMessage?.text ?? "No messages yet"}
          </span>

          {conversation.unreadCount > 0 && (
            <span className="conversation-item__unread">
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          )}
        </div>

        {conversation.listing?.title && (
          <div className="conversation-item__listing">
            <span className="conversation-item__listing-dot" />
            <span className="conversation-item__listing-title">
              {conversation.listing.title}
            </span>
          </div>
        )}
      </div>
    </button>
  );
}

/* =====================================================
   LOADING STATE
===================================================== */

function LoadingState() {
  return (
    <div className="conversation-list__loading">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="conversation-list__loading-row">
          <div className="conversation-list__loading-avatar" />
          <div className="conversation-list__loading-lines">
            <div className="conversation-list__loading-line conversation-list__loading-line--short" />
            <div className="conversation-list__loading-line conversation-list__loading-line--long" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* =====================================================
   EMPTY STATE
===================================================== */

function EmptyState({ search, activeTab }) {
  const showingUnreadOnly = activeTab === "unread" && !search;

  return (
    <div className="conversation-list__empty">
      <div className="conversation-list__empty-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.42 9.42 0 0 1-4-.9L3 21l1.9-4.5A8.38 8.38 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
        </svg>
      </div>

      <h3>
        {search
          ? "No conversations found"
          : showingUnreadOnly
          ? "No unread messages"
          : "No conversations yet"}
      </h3>

      <p>
        {search
          ? "Try searching for another name or message."
          : showingUnreadOnly
          ? "You're all caught up."
          : "Messages from landlords and tenants will show up here."}
      </p>
    </div>
  );
}