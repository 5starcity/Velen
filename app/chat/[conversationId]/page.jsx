"use client";

import { useParams } from "next/navigation";
import ChatThread from "@/components/chat/ChatThread";
import "@/styles/chat.css";


export default function ConversationPage() {
  const { conversationId } = useParams();
  return <ChatThread conversationId={conversationId} />;
}