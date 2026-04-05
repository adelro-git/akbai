import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import PostHogProvider from '@/components/providers/posthog-provider'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
})

export const metadata: Metadata = {
  title: 'AKBai — Katuwang ng Negosyo Mo',
  description:
    'AI-powered na kaakbay mo sa tax, expenses, at daily operations — para sa Filipino MSMEs. 97% cheaper than hiring a bookkeeper.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://akbai.vercel.app'),
  openGraph: {
    title: 'AKBai — Katuwang ng Negosyo Mo',
    description:
      'AI-powered na kaakbay mo sa tax, expenses, at daily operations — para sa Filipino MSMEs.',
    url: 'https://akbai.vercel.app',
    siteName: 'AKBai',
    locale: 'fil_PH',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AKBai — Katuwang ng Negosyo Mo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AKBai — Katuwang ng Negosyo Mo',
    description:
      'AI-powered na kaakbay mo sa tax, expenses, at daily operations — para sa Filipino MSMEs.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AKBai',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AKBai',
  description: 'AI-powered business partner for Filipino MSMEs',
  url: 'https://akbai.vercel.app',
}

export const viewport: Viewport = {
  themeColor: '#fdf9f2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tl" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('akbai-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground min-h-dvh antialiased">
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
