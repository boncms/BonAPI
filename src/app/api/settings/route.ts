import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'
import { safeLog, safeError } from '@/lib/safe-logger'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const settings = await dbService.getSettings()
    
    // Filter out sensitive data before sending to client
    const safeSettings = { ...settings }
    delete safeSettings.adminPassword
    delete safeSettings.password
    delete safeSettings.passwordHash
    delete safeSettings.adHeaderScript
    delete safeSettings.adBodyScript
    delete safeSettings.adFooterScript
    // Keep custom scripts for frontend rendering
    // delete safeSettings.headerScript
    // delete safeSettings.bodyScript
    // delete safeSettings.footerScript
    
    safeLog('📋 Settings fetched', { keys: Object.keys(safeSettings) })
    return NextResponse.json(safeSettings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    safeError('Error fetching settings', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json()
    
    // Create safe copy for logging (remove sensitive data)
    const safeSettings = { ...settings }
    const hasPasswordChange = typeof settings.adminPassword === 'string' && settings.adminPassword.trim().length > 0
    
    // Handle admin password change securely (do not store in settings table)
    if (hasPasswordChange) {
      const crypto = await import('crypto')
      const newHash = crypto.createHash('sha256').update(String(settings.adminPassword)).digest('hex')
      // Update default admin password (single-admin system). If multi-admin later, use authenticated admin id.
      dbService.db.prepare('UPDATE admins SET password_hash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 1').run(newHash)
      // Revoke existing refresh tokens for admin id 1
      dbService.db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE admin_id = ? AND revoked = 0').run(1)
      // Remove from settings payload so it isn't persisted as plain text
      delete settings.adminPassword
      delete safeSettings.adminPassword
    }
    
    // Log safe settings (no sensitive data)
    safeLog('⚙️ Settings updated', { 
      keys: Object.keys(safeSettings), 
      passwordChanged: hasPasswordChange 
    })
    
    // Upsert remaining settings keys
    for (const [key, value] of Object.entries(settings)) {
      await dbService.upsertSetting(key, value as any)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    safeError('Error updating settings', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}