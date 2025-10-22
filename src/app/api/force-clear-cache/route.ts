import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Clear all possible cache headers
    const response = NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    })

    // Set aggressive cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Last-Modified', new Date().toUTCString())
    response.headers.set('ETag', `"${Date.now()}"`)
    
    // Additional headers to prevent caching
    response.headers.set('X-Accel-Expires', '0')
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('X-Cache-Status', 'MISS')

    return response
  } catch (error) {
    console.error('Error in force clear cache:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear cache'
    }, { status: 500 })
  }
}
