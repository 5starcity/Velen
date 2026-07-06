import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rezidence - Student Housing Port Harcourt',
  description: 'Find verified student housing near RSU, UniPort, IAUE, and KSU — no agent fees.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
}