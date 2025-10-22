#!/usr/bin/env node

/**
 * Script to add favicon setting to database
 */

import Database from 'better-sqlite3'

const dbPath = './data/database.sqlite'
const db = new Database(dbPath)

console.log('🔧 Adding favicon setting to database...\n')

try {
  // Check if favicon setting already exists
  const existingFavicon = db.prepare('SELECT * FROM settings WHERE key = ?').get('faviconUrl')
  
  if (existingFavicon) {
    console.log('✅ Favicon setting already exists:')
    console.log(`  Key: ${existingFavicon.key}`)
    console.log(`  Value: ${existingFavicon.value}`)
    console.log(`  Type: ${existingFavicon.type}`)
  } else {
    // Insert favicon setting
    const result = db.prepare(`
      INSERT INTO settings (key, value, type, createdAt, updatedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run('faviconUrl', '', 'string')
    
    console.log('✅ Favicon setting added successfully!')
    console.log(`  Key: faviconUrl`)
    console.log(`  Value: (empty)`)
    console.log(`  Type: string`)
  }
  
  // Show all settings
  console.log('\n📋 All settings in database:')
  const allSettings = db.prepare('SELECT key, value, type FROM settings ORDER BY key').all()
  allSettings.forEach(setting => {
    console.log(`  ${setting.key}: ${setting.value} (${setting.type})`)
  })
  
} catch (error) {
  console.error('❌ Error adding favicon setting:', error)
} finally {
  db.close()
}

console.log('\n✅ Favicon setting setup completed!')
