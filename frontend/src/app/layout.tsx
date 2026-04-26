import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Fraunces } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import PostHogProvider from '@/components/providers/posthog-provider'
import { PaletteProvider } from '@/lib/palette/palette-context'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AKBai — Katuwang ng Negosyo Mo',
  description:
    'AI-powered na kaakbay mo sa tax, expenses, at daily operations — para sa Filipino MSMEs. 97% cheaper than hiring a bookkeeper.',
  // manifest moved to (app) layout — landing page should not trigger PWA install
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()
  const htmlLang = locale === 'en' ? 'en' : 'tl'
  return (
    <html
      lang={htmlLang}
      className={`${plusJakartaSans.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon-light.png" type="image/png" sizes="48x48" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
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
                  var palette = localStorage.getItem('akbai-palette');
                  if (palette === 'honey' || palette === 'cream' || palette === 'dawn') {
                    document.documentElement.setAttribute('data-palette', palette);
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground min-h-dvh antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PaletteProvider>
            <PostHogProvider>
              {children}
            </PostHogProvider>
          </PaletteProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
