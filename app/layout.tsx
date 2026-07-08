import type { Metadata } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import Navbar from '@/components/layout/Navbar'
import PostHogProvider from '@/components/layout/PostHogProvider'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <PostHogProvider />
            <Navbar />
            {children}
        </AuthProvider>
      </body>
    </html>
  )
}