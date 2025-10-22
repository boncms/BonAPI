import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ACCESS_COOKIE = 'xcms_access_token'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.nextUrl.origin
  const adminPath = '/admin00o1'

  const isAdminArea = pathname === adminPath || pathname.startsWith(`${adminPath}/`) || pathname === '/admin00o1' || pathname.startsWith('/admin00o1/')
  const isLoginPage = pathname === '/login' || pathname === '/(auth)/login'

  if (isAdminArea && !isLoginPage) {
    const cookieHeader = request.headers.get('cookie') || ''
    const match = cookieHeader.match(new RegExp(`${ACCESS_COOKIE}=([^;]+)`))
    const token = match?.[1]
    if (!token) {
      const loginUrl = request.nextUrl.clone()
      // Redirect to public auth route
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Validate access token by calling internal endpoint
    try {
      const res = await fetch(`${origin}/api/auth/me`, {
        headers: { cookie: cookieHeader },
        cache: 'no-store'
      })
      const data = await res.json()
      if (!data?.authenticated) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = '/login'
        loginUrl.searchParams.set('from', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // No dynamic path rewriting
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin00o1', '/admin00o1/:path*']
}


