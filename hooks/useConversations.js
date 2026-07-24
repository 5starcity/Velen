// hooks/useConversations.js
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { getSocket } from "@/lib/socket";

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL;

async function fetchConversations() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_URL}/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch conversations: ${res.status}`);
  }

  return res.json();
}

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("conversation:updated", handleUpdate);
    return () => socket.off("conversation:updated", handleUpdate);
  }, [queryClient]);

  return query;
}