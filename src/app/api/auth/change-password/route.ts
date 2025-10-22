import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { dbService } from '@/lib/database'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const ACCESS_COOKIE = 'xcms_access_token'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(ACCESS_COOKIE)?.value
    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })

    const accessSecret = process.env.XCMS_JWT_ACCESS_SECRET || process.env.NEXTAUTH_SECRET || 'dev_access_secret'
    let payload: any
    try {
      payload = jwt.verify(token, accessSecret)
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })
    }

    const adminId = Number(payload?.sub)
    if (!adminId) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })

    const contentType = request.headers.get('content-type') || ''
    let currentPassword = ''
    let newPassword = ''
    if (contentType.includes('application/json')) {
      const body = await request.json()
      currentPassword = String(body?.currentPassword || '')
      newPassword = String(body?.newPassword || '')
    } else {
      const form = await request.formData()
      currentPassword = String(form.get('currentPassword') || '')
      newPassword = String(form.get('newPassword') || '')
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Missing params' }, { status: 400 })
    }

    const admin = await dbService.db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId) as any
    if (!admin) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })

    const currentHash = crypto.createHash('sha256').update(currentPassword).digest('hex')
    if (currentHash !== admin.password_hash) {
      return NextResponse.json({ success: false, message: 'Current password incorrect' }, { status: 400 })
    }

    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex')
    dbService.db.prepare('UPDATE admins SET password_hash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, adminId)
    // Revoke all existing refresh tokens for this admin
    dbService.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE admin_id = ? AND revoked = 0').run(adminId)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Change password failed' }, { status: 500 })
  }
}


