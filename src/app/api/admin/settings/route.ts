import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'
import { safeLog, safeError } from '@/lib/safe-logger'

export const dynamic = 'force-dynamic'

// GET /api/admin/settings - Get full settings (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const token = request.headers.get('authorization')
    // if (!isValidAdminToken(token)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const settings = await dbService.getSettings()
    safeLog('🔐 Admin settings fetched', { keys: Object.keys(settings) })
    return NextResponse.json(settings)
  } catch (error) {
    safeError('Error fetching admin settings', error)
    return NextResponse.json({ error: 'Failed to fetch admin settings' }, { status: 500 })
  }
}

// PUT /api/admin/settings - Update settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const token = request.headers.get('authorization')
    // if (!isValidAdminToken(token)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    const settings = await request.json()
    
    // Create safe copy for logging (remove sensitive data)
    const safeSettings = { ...settings }
    const hasPasswordChange = typeof settings.adminPassword === 'string' && settings.adminPassword.trim().length > 0
    
    // Handle admin password change securely
    if (hasPasswordChange) {
      const crypto = await import('crypto')
      const newHash = crypto.createHash('sha256').update(String(settings.adminPassword)).digest('hex')
      dbService.db.prepare('UPDATE admins SET password_hash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 1').run(newHash)
      dbService.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE admin_id = ? AND revoked = 0').run(1)
      delete settings.adminPassword
      delete safeSettings.adminPassword
    }
    
    safeLog('🔐 Admin settings updated', { 
      keys: Object.keys(safeSettings), 
      passwordChanged: hasPasswordChange 
    })
    
    // Upsert remaining settings keys
    for (const [key, value] of Object.entries(settings)) {
      await dbService.upsertSetting(key, value as any)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('Error updating admin settings', error)
    return NextResponse.json({ error: 'Failed to update admin settings' }, { status: 500 })
  }
}
