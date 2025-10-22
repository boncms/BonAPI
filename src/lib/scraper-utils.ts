// In-memory intervals storage (configs are now in database)
let autoScrapeIntervals: Map<string, NodeJS.Timeout> = new Map()
import dbService from '@/lib/database'

// Function to clear all auto-scrape intervals
export function clearAllAutoScrapeIntervals() {
  console.log(`Clearing all auto-scrape intervals... (${autoScrapeIntervals.size} active)`)
  for (const [id, interval] of Array.from(autoScrapeIntervals.entries())) {
    clearInterval(interval)
    console.log(`Cleared interval for config ${id}`)
  }
  autoScrapeIntervals.clear()
  console.log('All auto-scrape intervals cleared')
}

// Function to get intervals map (for internal use)
export function getAutoScrapeIntervals() {
  return autoScrapeIntervals
}

// Function to set interval (for internal use)
export function setAutoScrapeInterval(id: string, interval: NodeJS.Timeout) {
  autoScrapeIntervals.set(id, interval)
}

// Function to clear specific interval (for internal use)
export function clearAutoScrapeInterval(id: string) {
  if (autoScrapeIntervals.has(id)) {
    clearInterval(autoScrapeIntervals.get(id)!)
    autoScrapeIntervals.delete(id)
  }
}

// Function to schedule auto scrape (for internal use)
export function scheduleAutoScrape(config: any) {
  const intervalMs = config.interval * 60 * 1000 // Convert minutes to milliseconds

  console.log(`Scheduling auto-scrape for config ${config.id}: ${config.type} every ${config.interval} minutes`)

  const interval = setInterval(async () => {
    try {
      console.log(`🔄 Auto-scrape starting: ${config.type} pages ${config.startPage}-${config.endPage}`)
      
      // Call scraper directly instead of HTTP request
      const { startScraping } = await import('./scraper-functions')
      
      await startScraping(
        config.type,
        config.startPage,
        config.endPage,
        config.keyword,
        Boolean(config.updateExisting)
      )

      console.log(`✅ Auto-scrape completed: ${config.type} pages ${config.startPage}-${config.endPage}`)

      // Update lastRun/nextRun in DB for visibility in UI
      try {
        const now = new Date()
        const nextRunTime = new Date(now.getTime() + intervalMs)
        await dbService.updateAutoScrapeConfig(config.id, {
          ...config,
          lastRun: now.toISOString(),
          nextRun: nextRunTime.toISOString()
        })
      } catch (err) {
        console.error('Error updating auto-scrape timestamps:', err)
      }
    } catch (error) {
      console.error('Auto-scrape interval error:', error)
    }
  }, intervalMs)

  setAutoScrapeInterval(config.id, interval)
  console.log(`Auto-scrape scheduled: ${config.type} every ${config.interval} minutes`)
}
