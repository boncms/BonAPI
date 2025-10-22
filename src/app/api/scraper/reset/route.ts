import { NextResponse } from 'next/server'
import { scrapingState } from '../state'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Reset all scraping state
    scrapingState.isRunning = false
    scrapingState.currentPage = 0
    scrapingState.totalPages = 0
    scrapingState.processed = 0
    scrapingState.total = 0
    scrapingState.errors = 0
    scrapingState.created = 0
    scrapingState.updated = 0
    scrapingState.currentItem = ''
    scrapingState.type = 'movies'
    scrapingState.keyword = ''
    scrapingState.logs = []
    
    return NextResponse.json({
      success: true,
      message: 'Scraping state reset successfully'
    })

  } catch (error) {
    console.error('Reset scraping state error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to reset scraping state' 
    }, { status: 500 })
  }
}

