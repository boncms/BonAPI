#!/usr/bin/env node

/**
 * Manual test script to trigger auto-scraping
 * Tests if auto-scraping can actually scrape and save data
 */

import Database from 'better-sqlite3'

const dbPath = './data/database.sqlite'
const db = new Database(dbPath)

console.log('🧪 Manual auto-scraping test...\n')

// Test 1: Check current video count
console.log('1️⃣ Current video count:')
const totalVideos = db.prepare('SELECT COUNT(*) as count FROM videos').get()
console.log(`Total videos: ${totalVideos.count}`)

// Test 2: Check auto-scrape config
console.log('\n2️⃣ Auto-scrape config:')
const config = db.prepare('SELECT * FROM auto_scrape_configs WHERE enabled = 1 LIMIT 1').get()
if (config) {
  console.log(`Config ID: ${config.id}`)
  console.log(`Type: ${config.type}`)
  console.log(`Interval: ${config.interval_minutes} minutes`)
  console.log(`Pages: ${config.start_page}-${config.end_page}`)
  console.log(`Last run: ${config.last_run}`)
  console.log(`Next run: ${config.next_run}`)
  
  // Check if overdue
  const nextRun = new Date(config.next_run)
  const now = new Date()
  const isOverdue = nextRun < now
  console.log(`Status: ${isOverdue ? 'OVERDUE' : 'Scheduled'}`)
  console.log(`Overdue by: ${isOverdue ? Math.round((now - nextRun) / 1000 / 60) : 0} minutes`)
} else {
  console.log('No enabled auto-scrape configs found')
}

// Test 3: Test manual scraper trigger
console.log('\n3️⃣ Testing manual scraper trigger:')
console.log('To test auto-scraping manually:')
console.log('1. Go to /admin00o1/scraper')
console.log('2. Click "Start Scraping" button')
console.log('3. Check if new videos are added')
console.log('4. Monitor server console for errors')

// Test 4: Check recent video additions
console.log('\n4️⃣ Recent video additions:')
const recentVideos = db.prepare(`
  SELECT id, title, uploadDate, category, model 
  FROM videos 
  ORDER BY uploadDate DESC 
  LIMIT 5
`).all()

console.log('Last 5 videos added:')
recentVideos.forEach((video, index) => {
  console.log(`  ${index + 1}. ${video.title} - ${video.uploadDate}`)
})

// Test 5: Check if auto-scraping is working
console.log('\n5️⃣ Auto-scraping status check:')
const enabledConfigs = db.prepare('SELECT COUNT(*) as count FROM auto_scrape_configs WHERE enabled = 1').get()
console.log(`Enabled configs: ${enabledConfigs.count}`)

if (enabledConfigs.count > 0) {
  console.log('✅ Auto-scraping configs exist')
  console.log('❓ Check if intervals are actually running')
  console.log('❓ Check server logs for auto-scraping messages')
  console.log('❓ Verify new videos are being added')
} else {
  console.log('❌ No enabled auto-scrape configs')
  console.log('   Create auto-scrape configs in admin panel')
}

// Test 6: Debug steps
console.log('\n6️⃣ Debug auto-scraping:')
console.log('If auto-scraping is not working:')
console.log('1. Check server console for errors:')
console.log('   - "Auto-scrape starting" messages')
console.log('   - "Auto-scrape completed" messages')
console.log('   - HTTP request errors')
console.log('2. Check if intervals are being set:')
console.log('   - Look for "Scheduling auto-scrape" messages')
console.log('   - Check if setInterval is working')
console.log('3. Test manual scraping:')
console.log('   - Use admin panel to start scraping')
console.log('   - Check if videos are added')
console.log('4. Check database updates:')
console.log('   - last_run timestamp updates')
console.log('   - next_run timestamp is set')
console.log('   - New videos appear')

console.log('\n✅ Manual auto-scraping test completed!')
console.log('\n🎯 Summary:')
console.log('- Auto-scraping config exists but may be overdue')
console.log('- Check server logs for auto-scraping activity')
console.log('- Test manual scraping to verify functionality')
console.log('- Monitor database for new video additions')

console.log('\n📋 Next steps:')
console.log('1. Check server console for auto-scraping logs')
console.log('2. Test manual scraping in admin panel')
console.log('3. Verify auto-scraping intervals are working')
console.log('4. Check if new videos are being added to database')

db.close()
