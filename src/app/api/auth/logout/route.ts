import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbService } from '@/lib/database'

export const dynamic = 'force-dynamic'

const ACCESS_COOKIE = 'xcms_access_token'
const REFRESH_COOKIE = 'xcms_refresh_token'

export async function POST(request: NextRequest) {
  try {
    const refreshJwt = request.cookies.get(REFRESH_COOKIE)?.value
    if (refreshJwt) {
      try {
        const refreshSecret = process.env.XCMS_JWT_REFRESH_SECRET || process.env.NEXTAUTH_SECRET || 'dev_refresh_secret'
        const payload: any = jwt.verify(refreshJwt, refreshSecret)
        const jti = String(payload?.jti || '')
        if (jti) await dbService.revokeRefreshToken(jti)
      } catch {}
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
    res.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
    return res
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Logout failed' }, { status: 500 })
  }
}


