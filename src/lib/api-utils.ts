import { NextResponse } from 'next/server'

/**
 * Utility function to create API responses with proper cache headers
 * Prevents browser caching issues for dynamic content
 */

export const createApiResponse = (data: any, status: number = 200, options?: {
  cache?: boolean
  headers?: Record<string, string>
}) => {
  const { cache = false, headers = {} } = options || {}
  
  const responseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  }
  
  // Add no-cache headers if cache is disabled (default)
  if (!cache) {
    Object.assign(responseHeaders, {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    })
  }
  
  return NextResponse.json(data, { 
    status, 
    headers: responseHeaders 
  })
}

/**
 * Create error response with no-cache headers
 */
export const createErrorResponse = (message: string, status: number = 500) => {
  return createApiResponse({ error: message }, status)
}

/**
 * Create success response with no-cache headers
 */
export const createSuccessResponse = (data: any, status: number = 200) => {
  return createApiResponse(data, status)
}

/**
 * Create response with custom cache settings
 */
export const createCachedResponse = (data: any, ttl: number = 300) => {
  return createApiResponse(data, 200, {
    cache: true,
    headers: {
      'Cache-Control': `public, max-age=${ttl}`,
      'ETag': `"${Date.now()}"`
    }
  })
}
