import { NextResponse } from 'next/server'
import { scrapingState, appendLog } from '../state'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    scrapingState.isRunning = false
    scrapingState.currentItem = 'Stopped by user'
    appendLog({ type: scrapingState.type, title: 'Scraping stopped', status: 'info', message: 'Stopped by user' })
    
    return NextResponse.json({
      success: true,
      message: 'Scraping stopped successfully'
    })

  } catch (error) {
    console.error('Stop scraping error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to stop scraping' 
    }, { status: 500 })
  }
}
