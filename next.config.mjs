/** @type {import('next').NextConfig} */
// A Content-Security-Policy é montada por requisição (nonce) em src/middleware.ts
// e src/lib/csp.ts — next.config.mjs é estático demais para isso e duas CSPs
// simultâneas (uma com nonce, outra sem) se combinariam de forma imprevisível.
const nextConfig = {
  transpilePackages: ['@react-pdf/renderer'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'pdf-parse', 'tesseract.js', 'bullmq', 'ioredis', 'isomorphic-dompurify', 'jsdom'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
