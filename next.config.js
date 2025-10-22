/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8888',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pdbm.b-cdn.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.us-east-005.backblazeb2.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
    // Allow explicit quality values used across the app (prepares for Next.js 16 requirement)
    qualities: [75, 85, 90, 95, 100],
  },
  serverExternalPackages: ['better-sqlite3'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('better-sqlite3')
    }
    return config
  },
}

module.exports = nextConfig
