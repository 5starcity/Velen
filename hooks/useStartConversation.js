// hooks/useStartConversation.js
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL;

export function useStartConversation() {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);

  const startConversation = useCallback(
    async ({ otherUserId, listingId, listingTitle, listingImage, listingPrice }) => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("You need to be logged in to message a landlord.");
        return;
      }

      if (user.uid === otherUserId) {
        setError("You can't message yourself.");
        return;
      }

      setIsStarting(true);
      setError(null);

      try {
        const token = await user.getIdToken();

        const res = await fetch(`${API_URL}/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            otherUserId,
            listingId,
            listingTitle,
            listingImage,
            listingPrice,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to start conversation: ${res.status}`);
        }

        const conversation = await res.json();
        router.push(`/chat/${conversation.id}`);
      } catch (err) {
        setError("Couldn't start the conversation. Try again.");
      } finally {
        setIsStarting(false);
      }
    },
    [router]
  );

  return { startConversation, isStarting, error };
}