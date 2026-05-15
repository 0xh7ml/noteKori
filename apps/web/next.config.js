/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@notekori/types'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://notekori-api-production.saikat-oubd.workers.dev',
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig
