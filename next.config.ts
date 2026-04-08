import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['test.talayseaman.com', 'localhost:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firtvvsktvlqwhmbzeyh.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
