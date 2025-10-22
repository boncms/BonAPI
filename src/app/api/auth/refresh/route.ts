import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbService } from '@/lib/database'

export const dynamic = 'force-dynamic'

const ACCESS_COOKIE = 'xcms_access_token'
const REFRESH_COOKIE = 'xcms_refresh_token'

export async function POST(request: NextRequest) {
  try {
    const refreshJwt = request.cookies.get(REFRESH_COOKIE)?.value
    if (!refreshJwt) return NextResponse.json({ success: false, message: 'Missing refresh token' }, { status: 401 })

    const refreshSecret = process.env.XCMS_JWT_REFRESH_SECRET || process.env.NEXTAUTH_SECRET || 'dev_refresh_secret'
    let payload: any
    try {
      payload = jwt.verify(refreshJwt, refreshSecret)
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid refresh token' }, { status: 401 })
    }

    const adminId = Number(payload?.sub)
    const jti = String(payload?.jti || '')
    if (!adminId || !jti) {
      return NextResponse.json({ success: false, message: 'Invalid token payload' }, { status: 401 })
    }

    const stored = await dbService.getRefreshToken(jti)
    if (!stored || stored.admin_id !== adminId) {
      return NextResponse.json({ success: false, message: 'Refresh token not found' }, { status: 401 })
    }

    const accessSecret = process.env.XCMS_JWT_ACCESS_SECRET || process.env.NEXTAUTH_SECRET || 'dev_access_secret'
    const admin = await dbService.db.prepare('SELECT id, username FROM admins WHERE id = ?').get(adminId) as any
    if (!admin) return NextResponse.json({ success: false, message: 'User not found' }, { status: 401 })

    const newAccess = jwt.sign({ sub: admin.id, username: admin.username, role: 'admin' }, accessSecret, { expiresIn: '1h' })
    const res = NextResponse.json({ success: true })
    res.cookies.set(ACCESS_COOKIE, newAccess, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Refresh failed' }, { status: 500 })
  }
}


