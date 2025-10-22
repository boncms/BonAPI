#!/usr/bin/env node

/**
 * Script to add domain setting to database
 */

import Database from 'better-sqlite3'

const dbPath = './data/database.sqlite'
const db = new Database(dbPath)

console.log('🔧 Adding domain setting to database...\n')

try {
  // Check if domain setting already exists
  const existingDomain = db.prepare('SELECT * FROM settings WHERE key = ?').get('siteUrl')
  
  if (existingDomain) {
    console.log('✅ Domain setting already exists:')
    console.log(`  Key: ${existingDomain.key}`)
    console.log(`  Value: ${existingDomain.value}`)
    console.log(`  Type: ${existingDomain.type}`)
  } else {
    // Insert domain setting
    const result = db.prepare(`
      INSERT INTO settings (key, value, type, createdAt, updatedAt)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run('siteUrl', 'https://yourdomain.com', 'string')
    
    console.log('✅ Domain setting added successfully!')
    console.log(`  Key: siteUrl`)
    console.log(`  Value: https://yourdomain.com`)
    console.log(`  Type: string`)
  }
  
  // Show all settings
  console.log('\n📋 All settings in database:')
  const allSettings = db.prepare('SELECT key, value, type FROM settings ORDER BY key').all()
  allSettings.forEach(setting => {
    console.log(`  ${setting.key}: ${setting.value} (${setting.type})`)
  })
  
} catch (error) {
  console.error('❌ Error adding domain setting:', error)
} finally {
  db.close()
}

console.log('\n✅ Domain setting setup completed!')
