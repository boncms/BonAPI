import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const ACCESS_COOKIE = 'xcms_access_token'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(ACCESS_COOKIE)?.value
    if (!token) return NextResponse.json({ authenticated: false })

    const accessSecret = process.env.XCMS_JWT_ACCESS_SECRET || process.env.NEXTAUTH_SECRET || 'dev_access_secret'
    try {
      const payload: any = jwt.verify(token, accessSecret)
      return NextResponse.json({ authenticated: true, admin: { id: payload?.sub, username: payload?.username } })
    } catch {
      return NextResponse.json({ authenticated: false })
    }
  } catch (e: any) {
    return NextResponse.json({ authenticated: false })
  }
}


