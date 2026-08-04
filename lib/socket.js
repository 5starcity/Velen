// lib/socket.js
import { io } from "socket.io-client";
import { getAuth } from "firebase/auth";

const SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_API_URL;

let socket = null;

/**
 * Creates (or returns the existing) socket connection. Auth is a
 * callback function, not a static object — Socket.IO calls it fresh
 * on every connection attempt (initial connect AND every automatic
 * reconnect), so an expired token never gets reused.
 */
export async function connectSocket() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("connectSocket called with no authenticated user");
  }

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: async (cb) => {
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        cb({ token: null });
        return;
      }
      const token = await currentUser.getIdToken();
      cb({ token });
    },
    transports: ["websocket ","polling"],
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

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}