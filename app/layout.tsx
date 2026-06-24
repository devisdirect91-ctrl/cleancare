import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { PostHogProvider } from '@/components/providers/PostHogProvider'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  style: ['normal', 'italic'],
  weight: ['400', '500', '600'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ),
  title: 'LumiScan — Analyse ta peau en 30 secondes',
  description:
    'Scan ton visage, reçois un diagnostic personnalisé et la routine skincare faite pour toi en 30 secondes.',
}

// Mobile-first : safe areas (notch/home indicator) via viewport-fit cover.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FAF6EE',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body
        className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} bg-cream font-sans text-charcoal antialiased`}
      >
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Toaster />
      </body>
    </html>
  )
}
