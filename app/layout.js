// app/layout.js
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/layout/PageTransition";
import SupportWidget from "@/components/support/SupportWidget";
import PostHogProvider from "@/components/layout/PostHogProvider";
import { Suspense } from "react";
import "./global.css";



export const metadata = {
  title: "Velen",
  description: "Find verified housing across Nigeria — no agents, no stress",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Suspense fallback={null}>
            <PostHogProvider />
          </Suspense>
          <Navbar />
          <SupportWidget />
          <PageTransition>
            {children}
          </PageTransition>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}


