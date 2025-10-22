import { NextResponse } from 'next/server'
import { scrapingState } from '../state'

export const dynamic = 'force-dynamic'

// use shared scrapingState

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      status: scrapingState
    })

  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to get status' 
    }, { status: 500 })
  }
}
