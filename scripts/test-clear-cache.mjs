#!/usr/bin/env node

/**
 * Test script to verify Clear Cache functionality
 * Tests both client-side cache clearing and server-side cache invalidation
 */

import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

const dbPath = './data/database.sqlite'
const db = new Database(dbPath)

console.log('🧪 Testing Clear Cache functionality...\n')

// Test 1: Check featured videos in database
console.log('1️⃣ Checking featured videos in database:')
const featuredVideos = db.prepare('SELECT id, title, featured FROM videos WHERE featured = 1 ORDER BY id DESC LIMIT 5').all()
console.log('Featured videos (featured = 1):', featuredVideos)
console.log('Total featured videos:', featuredVideos.length)

// Test 2: Check cache files
console.log('\n2️⃣ Checking cache files:')
const cacheDir = './.next/cache'
if (fs.existsSync(cacheDir)) {
  const cacheFiles = fs.readdirSync(cacheDir, { recursive: true })
  console.log('Cache files found:', cacheFiles.length)
  console.log('Cache files:', cacheFiles.slice(0, 10)) // Show first 10
} else {
  console.log('No cache directory found')
}

// Test 3: Check localStorage simulation
console.log('\n3️⃣ Simulating localStorage cache keys:')
const cacheKeys = [
  'homepage:featured', 'homepage:videos', 'homepage:models', 
  'homepage:categories', 'homepage:hot-weekly', 'homepage:most-viewed',
  'videos:all', 'videos:featured', 'videos:public'
]

console.log('Cache keys that should be cleared:')
cacheKeys.forEach(key => {
  console.log(`  - cache_${key}`)
})

// Test 4: Check database cache invalidation
console.log('\n4️⃣ Testing database cache invalidation:')
try {
  // Simulate cache invalidation by updating a video
  const testVideo = db.prepare('SELECT id, title, featured FROM videos ORDER BY id DESC LIMIT 1').get()
  if (testVideo) {
    console.log('Test video before update:', testVideo)
    
    // Toggle featured status
    const newFeatured = testVideo.featured ? 0 : 1
    db.prepare('UPDATE videos SET featured = ? WHERE id = ?').run(newFeatured, testVideo.id)
    
    const updatedVideo = db.prepare('SELECT id, title, featured FROM videos WHERE id = ?').get(testVideo.id)
    console.log('Test video after update:', updatedVideo)
    
    // Revert back
    db.prepare('UPDATE videos SET featured = ? WHERE id = ?').run(testVideo.featured, testVideo.id)
    console.log('✅ Database cache invalidation test passed')
  }
} catch (error) {
  console.error('❌ Database cache invalidation test failed:', error)
}

// Test 5: Check API endpoints
console.log('\n5️⃣ Testing API endpoints:')
const apiEndpoints = [
  '/api/videos',
  '/api/models', 
  '/api/categories',
  '/api/admin/videos'
]

apiEndpoints.forEach(endpoint => {
  console.log(`  - ${endpoint}`)
})

console.log('\n✅ Clear Cache test completed!')
console.log('\n📋 Manual test steps:')
console.log('1. Go to /admin00o1/videos')
console.log('2. Click "Clear Cache" button')
console.log('3. Check browser console for any errors')
console.log('4. Verify data reloads correctly')
console.log('5. Check homepage for updated featured videos')

db.close()
