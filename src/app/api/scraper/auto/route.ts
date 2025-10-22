import { NextRequest, NextResponse } from 'next/server'
import { scrapingState, ScrapeType } from '../state'
import dbService from '@/lib/database'
import { getAutoScrapeIntervals, setAutoScrapeInterval, clearAutoScrapeInterval } from '@/lib/scraper-utils'

export const dynamic = 'force-dynamic'

interface AutoScrapeConfig {
  id: string
  enabled: boolean
  interval: number // minutes
  type: ScrapeType
  startPage: number
  endPage: number
  keyword?: string
  updateExisting?: boolean
  lastRun?: string
  nextRun?: string
}

// Get intervals map from utility
const autoScrapeIntervals = getAutoScrapeIntervals()

export async function GET() {
  try {
    const configs = await dbService.getAutoScrapeConfigs()
    // Convert database format to API format
    const formattedConfigs = configs.map((config: any) => ({
      id: config.id,
      enabled: Boolean(config.enabled),
      interval: config.interval_minutes,
      type: config.type,
      startPage: config.start_page,
      endPage: config.end_page,
      keyword: config.keyword,
      updateExisting: Boolean(config.update_existing),
      lastRun: config.last_run,
      nextRun: config.next_run
    }))
    
    return NextResponse.json({
      success: true,
      configs: formattedConfigs
    })
  } catch (error) {
    console.error('Get auto-scrape configs error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to get auto-scrape configs' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { enabled, interval, type, startPage, endPage, keyword, updateExisting } = await request.json()
    
    if (!interval || !type || !startPage || !endPage) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters' 
      })
    }

    const now = new Date()
    const nextRunTime = enabled ? new Date(now.getTime() + interval * 60 * 1000) : undefined
    
    const config: AutoScrapeConfig = {
      id: Date.now().toString(),
      enabled,
      interval,
      type,
      startPage,
      endPage,
      keyword: keyword?.trim() || undefined,
      updateExisting: Boolean(updateExisting),
      lastRun: undefined,
      nextRun: nextRunTime?.toISOString()
    }

    // Save to database
    const savedConfig = await dbService.createAutoScrapeConfig(config)

    if (enabled) {
      scheduleAutoScrape(config)
    }

    return NextResponse.json({
      success: true,
      config: savedConfig,
      message: 'Auto-scrape config created successfully'
    })

  } catch (error) {
    console.error('Create auto-scrape config error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create auto-scrape config' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, enabled, interval, type, startPage, endPage, keyword, updateExisting } = await request.json()
    
    const existingConfig = await dbService.getAutoScrapeConfigById(id)
    if (!existingConfig) {
      return NextResponse.json({ 
        success: false, 
        message: 'Config not found' 
      })
    }

    // Clear existing interval
    clearAutoScrapeInterval(id)

    // Update config
    const now = new Date()
    const nextRunTime = enabled ? new Date(now.getTime() + interval * 60 * 1000) : undefined
    
    const updatedConfig: AutoScrapeConfig = {
      id,
      enabled,
      interval,
      type,
      startPage,
      endPage,
      keyword: keyword?.trim() || undefined,
      updateExisting: Boolean(updateExisting),
      lastRun: existingConfig.last_run,
      nextRun: nextRunTime?.toISOString()
    }

    // Save to database
    const savedConfig = await dbService.updateAutoScrapeConfig(id, updatedConfig)

    if (enabled) {
      scheduleAutoScrape(updatedConfig)
    }

    return NextResponse.json({
      success: true,
      config: savedConfig,
      message: 'Auto-scrape config updated successfully'
    })

  } catch (error) {
    console.error('Update auto-scrape config error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to update auto-scrape config' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing config ID' 
      })
    }

    // Clear interval
    clearAutoScrapeInterval(id)

    // Remove from database
    const deleted = await dbService.deleteAutoScrapeConfig(id)
    
    if (!deleted) {
      return NextResponse.json({ 
        success: false, 
        message: 'Config not found' 
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-scrape config deleted successfully'
    })

  } catch (error) {
    console.error('Delete auto-scrape config error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to delete auto-scrape config' 
    }, { status: 500 })
  }
}

function scheduleAutoScrape(config: AutoScrapeConfig) {
  const intervalMs = config.interval * 60 * 1000 // Convert minutes to milliseconds
  
  console.log(`Scheduling auto-scrape for config ${config.id}: ${config.type} every ${config.interval} minutes`)
  
  const interval = setInterval(async () => {
    // Check if scraping is already running
    if (scrapingState.isRunning) {
      console.log(`Auto-scrape skipped: scraping already running`)
      return
    }

    console.log(`Starting auto-scrape: ${config.type} pages ${config.startPage}-${config.endPage}`)
    
    try {
      // Update last run time in database
      try {
        const now = new Date()
        const nextRunTime = new Date(now.getTime() + intervalMs)
        
        await dbService.updateAutoScrapeConfig(config.id, {
          ...config,
          lastRun: now.toISOString(),
          nextRun: nextRunTime.toISOString()
        })
      } catch (error) {
        console.error('Error updating auto-scrape config:', error)
      }

      // Start scraping by calling the start function directly
      console.log(`Auto-scrape starting: ${config.type} pages ${config.startPage}-${config.endPage}`)
      
      try {
        // Call the scraping function via HTTP request since it's not exported
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8888'}/api/scraper/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: config.type,
            startPage: config.startPage,
            endPage: config.endPage,
            keyword: config.keyword,
            updateExisting: config.updateExisting
          })
        })
        
        if (!response.ok) {
          console.error('Auto-scrape HTTP request failed:', response.status)
        }
        
        console.log(`Auto-scrape completed: ${config.type} pages ${config.startPage}-${config.endPage}`)
      } catch (error) {
        console.error('Auto-scrape error:', error)
      }
    } catch (error) {
      console.error('Auto-scrape error:', error)
    }
  }, intervalMs)

  setAutoScrapeInterval(config.id, interval)
  console.log(`Auto-scrape scheduled: ${config.type} every ${config.interval} minutes`)
  console.log(`Total active intervals: ${autoScrapeIntervals.size}`)
}

// Initialize auto-scrape configs on module load
async function initializeAutoScrape() {
  try {
    const configs = await dbService.getAutoScrapeConfigs()
    const enabledConfigs = configs.filter((config: any) => config.enabled)
    
    console.log(`Initializing ${enabledConfigs.length} auto-scrape configs`)
    
    for (const config of enabledConfigs) {
      const formattedConfig = {
        id: config.id,
        enabled: Boolean(config.enabled),
        interval: config.interval_minutes,
        type: config.type,
        startPage: config.start_page,
        endPage: config.end_page,
        keyword: config.keyword,
        updateExisting: Boolean(config.update_existing),
        lastRun: config.last_run,
        nextRun: config.next_run
      }
      
      scheduleAutoScrape(formattedConfig)
    }
  } catch (error) {
    console.error('Error initializing auto-scrape configs:', error)
  }
}


// Initialize on module load - only if there are enabled configs
initializeAutoScrape()
