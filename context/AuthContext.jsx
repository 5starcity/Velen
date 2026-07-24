"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { connectSocket, disconnectSocket } from "@/lib/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // Fetch role from Firestore
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          } else {
            setUserRole(null);
          }

          // Connect chat socket now that we have an authenticated user
          try {
            await connectSocket();
          } catch (socketError) {
            console.error("Socket connection failed:", socketError);
            // Don't block auth on socket failure — chat just won't be live
          }
        } else {
          setUser(null);
          setUserRole(null);
          disconnectSocket();
        }
      } catch (error) {
        console.error("AuthContext error:", error);
        setUser(null);
        setUserRole(null);
        disconnectSocket();
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      disconnectSocket();
    };
  }, []);

  async function logout() {
    disconnectSocket();
    await signOut(auth);
    setUser(null);
    setUserRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, userRole, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}