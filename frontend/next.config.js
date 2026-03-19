/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: [
    'akbai-preview.cluster-0.preview.emergentcf.cloud',
    'akbai-preview.preview.emergentagent.com',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
}

module.exports = nextConfig
