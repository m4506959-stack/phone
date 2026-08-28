import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    default: 'iPhone 18 Series Pre-Order | الحجز المسبق الرسمي لسلسلة آيفون 18',
    template: '%s | iPhone 18 Pre-Order',
  },
  description: 'احجز نسختك من سلسلة iPhone 18 الآن بضمان رسمي في ليبيا والدفع عند الاستلام.',
  keywords: ['iPhone 18', 'iPhone 18 Pro Max', 'iPhone 18 Air', 'حجز مسبق', 'ليبيا', 'آيفون'],
  robots: 'index, follow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
