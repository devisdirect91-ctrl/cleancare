import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LumiScan · Analyse ta peau en 30 secondes',
  description:
    'Scan personnalisé de ta peau et routine skincare sur-mesure. Gratuit.',
  openGraph: {
    title: 'LumiScan · Analyse ta peau en 30 secondes',
    description:
      'Scan personnalisé de ta peau et routine skincare sur-mesure. Gratuit.',
    type: 'website',
    // TODO: remplacer par le visuel OG définitif une fois créé (/public/og-scan.png)
    images: ['/og-scan.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LumiScan · Analyse ta peau en 30 secondes',
    description:
      'Scan personnalisé de ta peau et routine skincare sur-mesure. Gratuit.',
    images: ['/og-scan.png'],
  },
}

export default function ScanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
