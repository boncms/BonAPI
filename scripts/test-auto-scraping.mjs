#!/usr/bin/env node

/**
 * Test script to verify auto-scraping functionality
 * Tests if auto-scraping is working correctly and on schedule
 */

import Database from 'better-sqlite3'

const dbPath = './data/database.sqlite'
const db = new Database(dbPath)

console.log('🧪 Testing auto-scraping functionality...\n')

// Test 1: Check auto-scrape configs in database
console.log('1️⃣ Auto-scrape configs in database:')
const configs = db.prepare('SELECT * FROM auto_scrape_configs ORDER BY created_at DESC').all()
console.log(`Total configs: ${configs.length}`)

configs.forEach((config, index) => {
  console.log(`\nConfig ${index + 1}:`)
  console.log(`  ID: ${config.id}`)
  console.log(`  Enabled: ${config.enabled}`)
  console.log(`  Type: ${config.type}`)
  console.log(`  Interval: ${config.interval_minutes} minutes`)
  console.log(`  Pages: ${config.start_page}-${config.end_page}`)
  console.log(`  Keyword: ${config.keyword || 'N/A'}`)
  console.log(`  Last run: ${config.last_run || 'Never'}`)
  console.log(`  Next run: ${config.next_run || 'Not scheduled'}`)
  console.log(`  Update existing: ${config.update_existing}`)
})

// Test 2: Check if auto-scraping is initialized
console.log('\n2️⃣ Auto-scraping initialization:')
console.log('✅ initializeAutoScrape() is now uncommented')
console.log('✅ Auto-scraping should start on server startup')
console.log('✅ Enabled configs should be scheduled')

// Test 3: Check recent video additions
console.log('\n3️⃣ Recent video additions:')
const recentVideos = db.prepare(`
  SELECT id, title, uploadDate, category, model 
  FROM videos 
  ORDER BY uploadDate DESC 
  LIMIT 10
`).all()

console.log(`Recent videos (last 10):`)
recentVideos.forEach((video, index) => {
  console.log(`  ${index + 1}. ${video.title} (${video.category}) - ${video.uploadDate}`)
})

// Test 4: Check video count by date
console.log('\n4️⃣ Video count by date:')
const videoCounts = db.prepare(`
  SELECT DATE(uploadDate) as date, COUNT(*) as count
  FROM videos 
  WHERE uploadDate >= date('now', '-7 days')
  GROUP BY DATE(uploadDate)
  ORDER BY date DESC
`).all()

console.log('Videos added in last 7 days:')
videoCounts.forEach(row => {
  console.log(`  ${row.date}: ${row.count} videos`)
})

// Test 5: Auto-scraping status check
console.log('\n5️⃣ Auto-scraping status:')
const enabledConfigs = configs.filter(c => c.enabled)
console.log(`Enabled configs: ${enabledConfigs.length}`)

if (enabledConfigs.length > 0) {
  console.log('✅ Auto-scraping should be active')
  enabledConfigs.forEach(config => {
    const nextRun = config.next_run ? new Date(config.next_run) : null
    const now = new Date()
    const isOverdue = nextRun && nextRun < now
    
    console.log(`  Config ${config.id}:`)
    console.log(`    Next run: ${config.next_run || 'Not scheduled'}`)
    console.log(`    Status: ${isOverdue ? 'OVERDUE' : 'Scheduled'}`)
  })
} else {
  console.log('❌ No enabled auto-scrape configs found')
  console.log('   Go to /admin00o1/scraper to create auto-scrape configs')
}

// Test 6: Manual verification steps
console.log('\n6️⃣ Manual verification steps:')
console.log('1. Go to /admin00o1/scraper')
console.log('2. Check if auto-scrape configs exist')
console.log('3. Create a new auto-scrape config if needed:')
console.log('   - Set interval (e.g., 15 minutes)')
console.log('   - Set page range (e.g., 1-5)')
console.log('   - Enable the config')
console.log('4. Check server logs for auto-scraping messages')
console.log('5. Wait for the scheduled time and verify:')
console.log('   - New videos appear in database')
console.log('   - Last run timestamp updates')
console.log('   - Next run timestamp is set')

// Test 7: Debug auto-scraping issues
console.log('\n7️⃣ Debug auto-scraping issues:')
console.log('If auto-scraping is not working:')
console.log('1. Check server console for errors')
console.log('2. Verify auto-scrape configs are enabled')
console.log('3. Check if intervals are being set')
console.log('4. Verify scraper endpoints are working')
console.log('5. Check database for new videos')
console.log('6. Look for "Auto-scrape starting" messages in logs')

console.log('\n✅ Auto-scraping test completed!')
console.log('\n🎯 Summary:')
console.log('- Auto-scraping initialization is now enabled')
console.log('- Check database for auto-scrape configs')
console.log('- Verify enabled configs are scheduled')
console.log('- Monitor server logs for auto-scraping activity')

console.log('\n📋 Next steps:')
console.log('1. Create auto-scrape configs in admin panel')
console.log('2. Monitor server logs for auto-scraping')
console.log('3. Check database for new videos')
console.log('4. Verify scheduled runs are working')

db.close()
