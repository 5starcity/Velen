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
  title: "Velen — Student Housing in Port Harcourt",
  description: "Find verified rooms near RSU, UniPort and more. No agents, no hidden fees, no stress.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
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


