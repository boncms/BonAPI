import { NextResponse } from 'next/server'
import dbService from '@/lib/database'
import { scheduleAutoScrape } from '@/lib/scraper-utils'

export const dynamic = 'force-dynamic'

// Load and start auto-scrape configs on server startup
export async function POST() {
  try {
    const configs = await dbService.getAutoScrapeConfigs()
    
    // Filter enabled configs
    const enabledConfigs = configs.filter((config: any) => config.enabled)
    
    console.log(`Loading ${enabledConfigs.length} enabled auto-scrape configs`)
    
    // Start intervals for enabled configs
    for (const config of enabledConfigs) {
      const formattedConfig = {
        id: config.id,
        enabled: Boolean(config.enabled),
        interval: config.interval_minutes,
        type: config.type,
        startPage: config.start_page,
        endPage: config.end_page,
        keyword: config.keyword,
        lastRun: config.last_run,
        nextRun: config.next_run
      }
      
      // Start the auto-scrape scheduler
      scheduleAutoScrape(formattedConfig)
    }
    
    return NextResponse.json({
      success: true,
      message: `Loaded ${enabledConfigs.length} auto-scrape configs`,
      configs: enabledConfigs.length
    })
    
  } catch (error) {
    console.error('Error loading auto-scrape configs:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to load auto-scrape configs' 
    }, { status: 500 })
  }
}
