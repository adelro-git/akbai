/** @type {import('next').NextConfig} */
const path = require('path')
const createNextIntlPlugin = require('next-intl/plugin')
const { withSentryConfig } = require('@sentry/nextjs')

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts')

const nextConfig = {
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
}

module.exports = withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})
