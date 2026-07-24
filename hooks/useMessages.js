// hooks/useMessages.js
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getAuth } from "firebase/auth";
import { getSocket } from "@/lib/socket";

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL;

async function fetchMessages(conversationId) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch messages: ${res.status}`);
  }

  return res.json();
}

export function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const conversationIdRef = useRef(conversationId);

  // Keep a ref in sync so socket callbacks always know the current
  // conversation, without needing to re-subscribe on every render.
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  // Initial load + reload whenever the conversation changes
  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;
    setIsLoading(true);
    setIsError(false);

    fetchMessages(conversationId)
      .then((data) => {
        if (!cancelled) {
          setMessages(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Join the socket room + listen for live messages
  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit("conversation:join", { conversationId });

    const handleNewMessage = (message) => {
      // Only append if it belongs to the conversation currently open —
      // guards against a stray event if the user switched threads fast.
      if (message.conversationId === conversationIdRef.current) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    (text) => {
      const socket = getSocket();
      if (!socket || !conversationId || !text.trim()) return;

      socket.emit("message:send", { conversationId, text: text.trim() });
    },
    [conversationId]
  );

  const markAsRead = useCallback(() => {
    const socket = getSocket();
    if (!socket || !conversationId) return;

    socket.emit("message:read", { conversationId });
  }, [conversationId]);

  return { messages, isLoading, isError, sendMessage, markAsRead };
}