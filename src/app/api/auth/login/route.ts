import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbService } from '@/lib/database'

export const dynamic = 'force-dynamic'

const ACCESS_COOKIE = 'xcms_access_token'
const REFRESH_COOKIE = 'xcms_refresh_token'

export async function POST(request: NextRequest) {
  try {
    await dbService.ensureDefaultAdmin()

    const contentType = request.headers.get('content-type') || ''
    let username = ''
    let password = ''

    let recaptchaToken = ''

    if (contentType.includes('application/json')) {
      const body = await request.json()
      username = String(body?.username || '')
      password = String(body?.password || '')
      recaptchaToken = String(body?.recaptchaToken || '')
    } else {
      const form = await request.formData()
      username = String(form.get('username') || '')
      password = String(form.get('password') || '')
      recaptchaToken = String(form.get('recaptchaToken') || '')
    }

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Missing credentials' }, { status: 400 })
    }

    // Verify reCAPTCHA
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
    if (recaptchaSecret && recaptchaToken) {
      const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${recaptchaSecret}&response=${recaptchaToken}`
      })
      const recaptchaData = await recaptchaResponse.json()
      
      if (!recaptchaData.success) {
        return NextResponse.json({ success: false, message: 'reCAPTCHA verification failed' }, { status: 400 })
      }
    }

    const admin = await dbService.verifyAdminCredentials(username, password)
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Invalid username or password' }, { status: 401 })
    }

    const accessSecret = process.env.XCMS_JWT_ACCESS_SECRET || process.env.NEXTAUTH_SECRET || 'dev_access_secret'
    const refreshSecret = process.env.XCMS_JWT_REFRESH_SECRET || process.env.NEXTAUTH_SECRET || 'dev_refresh_secret'

    const accessToken = jwt.sign({ sub: admin.id, username: admin.username, role: 'admin' }, accessSecret, { expiresIn: '1h' })
    const refreshToken = await dbService.createRefreshToken(admin.id, 7)
    const refreshJwt = jwt.sign({ sub: admin.id, jti: refreshToken }, refreshSecret, { expiresIn: '7d' })

    const res = NextResponse.json({ success: true, admin: { id: admin.id, username: admin.username } })
    res.cookies.set(ACCESS_COOKIE, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60
    })
    res.cookies.set(REFRESH_COOKIE, refreshJwt, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 3600
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Login failed' }, { status: 500 })
  }
}


