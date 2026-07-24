// app/layout.js
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import PageTransition from "@/components/layout/PageTransition";
import SupportWidget from "@/components/support/SupportWidget";
import PostHogProvider from "@/components/layout/PostHogProvider";
import { QueryProvider } from '@/lib/queryClient';
import { Suspense } from "react";
import "./global.css";

export const metadata = {
  metadataBase: new URL("https://rezidence.ng"),
  title: {
    default: "Rezidence — Student Housing in Port Harcourt",
    template: "%s | Rezidence",
  },
  description: "Find verified rooms near RSU, UniPort and more. No agents, no hidden fees, no stress.",
  keywords: [
    "student housing Port Harcourt",
    "RSU hostel",
    "UniPort lodge",
    "student accommodation Port Harcourt",
    "Eleme student housing",
  ],
  authors: [{ name: "Rezidence" }],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://rezidence.ng",
    siteName: "Rezidence",
    title: "Rezidence — Student Housing in Port Harcourt",
    description: "Find verified rooms near RSU, UniPort and more. No agents, no hidden fees, no stress.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Rezidence — Student Housing in Port Harcourt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rezidence — Student Housing in Port Harcourt",
    description: "Find verified rooms near RSU, UniPort and more. No agents, no hidden fees, no stress.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    // fill in once you set up Google Search Console
    // google: "your-verification-code",
  },
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
            <QueryProvider >
            {children}
            </QueryProvider>
          </PageTransition>
          <ConditionalFooter />
        </AuthProvider>
      </body>
    </html>
  );
}


