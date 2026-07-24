"use client";

import ConversationList from "@/components/chat/ConversationList";
import "@/styles/chat.css";

export default function ChatLayout({ children }) {
  return (
    <div className="chat-page">
      <aside className="chat-page__sidebar">
        <ConversationList />
      </aside>

      <main className="chat-page__main">
        {children}
      </main>
    </div>
  );
}