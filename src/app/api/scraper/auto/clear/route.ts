import { NextResponse } from 'next/server'
import { clearAllAutoScrapeIntervals } from '@/lib/scraper-utils'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    clearAllAutoScrapeIntervals()
    
    return NextResponse.json({
      success: true,
      message: 'All auto-scrape intervals cleared successfully'
    })
  } catch (error) {
    console.error('Error clearing auto-scrape intervals:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to clear auto-scrape intervals' 
    }, { status: 500 })
  }
}
