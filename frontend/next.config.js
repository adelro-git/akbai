/** @type {import('next').NextConfig} */
const path = require('path')
const createNextIntlPlugin = require('next-intl/plugin')
const { withSentryConfig } = require('@sentry/nextjs')

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts')

// CAPACITOR_BUILD=1 → produces a static export bundle (`out/`) for Capacitor sync.
// Unset / falsy → ships the standard Vercel SSR build with API routes + middleware
// + Sentry + next-intl intact. ADR-019 §Sprint-15-pattern §3.
const isCapacitor = process.env.CAPACITOR_BUILD === '1'

const nextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    // next/image's optimizer is a server-side runtime; static export disables it.
    unoptimized: isCapacitor,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
  ...(isCapacitor && {
    output: 'export',
    // Static export only scans .tsx files as pages. This excludes:
    //   - app/api/**/route.ts (all API route handlers — every route.ts is .ts, never .tsx)
    //   - src/proxy.ts (Next 16 middleware — lives outside app/ but is .ts)
    //   - any colocated test .ts files under app/**/__tests__/
    pageExtensions: ['tsx'],
  }),
}

module.exports = withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})
