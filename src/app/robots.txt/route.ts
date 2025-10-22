import { NextResponse } from 'next/server'

export async function GET() {
  const robots = `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://yoursite.com/sitemap.xml

# Disallow admin areas
Disallow: /admin00o1/
Disallow: /api/

# Allow important pages
Allow: /videos
Allow: /models
Allow: /categories
Allow: /category/
Allow: /video/`

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}

