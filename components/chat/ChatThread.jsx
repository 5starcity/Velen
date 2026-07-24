"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";
import { useConversations } from "@/hooks/useConversations";
import { getAuth } from "firebase/auth";
import Image from "next/image";

function formatMessageTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatThread({ conversationId }) {
  const router = useRouter();
  const { messages, isLoading, isError, sendMessage, markAsRead } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  const conversation = conversations?.find((c) => c.id === conversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      markAsRead();
    }
  }, [conversationId, markAsRead, messages.length]);

  function handleSend(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
  }

  return (
    <div className="chat-thread">
      <header className="chat-thread__header">
        <div className="chat-thread__header-user">
          <button
            type="button"
            className="chat-thread__back-btn"
            onClick={() => router.push("/chat")}
            aria-label="Back to conversations"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="chat-thread__avatar">
            {conversation?.otherParticipant?.avatarUrl ? (
              <Image
                src={conversation.otherParticipant.avatarUrl}
                alt={conversation.otherParticipant.name}
                width={40}
                height={40}
                className="chat-thread__avatar-img"
              />
            ) : (
              <span className="chat-thread__avatar-fallback">
                {conversation?.otherParticipant?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <span className="chat-thread__header-name">
            {conversation?.otherParticipant?.name ?? "Conversation"}
          </span>
        </div>

        {conversation?.listing && (
          <div className="chat-thread__listing-card">
            {conversation.listing.coverImage && (
              <Image
                src={conversation.listing.coverImage}
                alt={conversation.listing.title}
                width={40}
                height={40}
                className="chat-thread__listing-img"
              />
            )}
            <div className="chat-thread__listing-info">
              <span className="chat-thread__listing-title">{conversation.listing.title}</span>
              {conversation.listing.price && (
                <span className="chat-thread__listing-price">
                  ₦{conversation.listing.price.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="chat-thread__messages">
        {isLoading && <div className="chat-thread__state">Loading messages…</div>}

        {isError && (
          <div className="chat-thread__state chat-thread__state--error">
            Couldn&apos;t load messages.
          </div>
        )}

        {!isLoading &&
          !isError &&
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            const isSystem = msg.senderId === "system";

            if (isSystem) {
              return (
                <div key={msg.id} className="chat-thread__system-message">
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`chat-thread__bubble-row ${
                  isOwn ? "chat-thread__bubble-row--own" : ""
                }`}
              >
                <div className={`chat-thread__bubble ${isOwn ? "chat-thread__bubble--own" : ""}`}>
                  <p>{msg.text}</p>
                  <span className="chat-thread__bubble-time">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}

        <div ref={bottomRef} />
      </div>

      <form className="chat-thread__input-row" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-thread__input"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="chat-thread__send-btn" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}