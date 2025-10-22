import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Import the intervals map from the main route
let autoScrapeIntervals: Map<string, NodeJS.Timeout> = new Map()

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      activeIntervals: autoScrapeIntervals.size,
      intervalIds: Array.from(autoScrapeIntervals.keys())
    })
  } catch (error) {
    console.error('Error getting auto-scrape status:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to get auto-scrape status' 
    }, { status: 500 })
  }
}
