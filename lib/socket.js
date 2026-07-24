// lib/socket.js
import { io } from "socket.io-client";
import { getAuth } from "firebase/auth";

const SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_API_URL;

let socket = null;

/**
 * Creates (or returns the existing) socket connection, authenticated
 * with the current user's Firebase ID token.
 */
export async function connectSocket() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("connectSocket called with no authenticated user");
  }

  const token = await user.getIdToken();

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    // socket exists but disconnected — refresh token and reconnect
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("[socket] connected", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("[socket] connect_error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);
  });

  return socket;
}

/**
 * Returns the current socket instance without creating a new one.
 * Use inside components that expect connectSocket() was already called.
 */
export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}