import { ScrapeType } from '../app/api/scraper/state'
import { dbService } from './database'

// Scraping state
export const scrapingState = {
  isRunning: false,
  currentPage: 0,
  totalPages: 0,
  processed: 0,
  total: 0,
  errors: 0,
  created: 0,
  updated: 0,
  keyword: ''
}

// Log function
function appendLog(log: any) {
  console.log(`[${new Date().toISOString()}] ${log.type}: ${log.title} - ${log.message}`)
}

export async function startScraping(type: ScrapeType, startPage: number, endPage: number, keyword?: string, updateExisting: boolean = true, baseUrl?: string) {
  // Reset scraping state
  scrapingState.isRunning = true
  scrapingState.currentPage = startPage - 1
  scrapingState.totalPages = endPage - startPage + 1
  scrapingState.processed = 0
  scrapingState.total = 0
  scrapingState.errors = 0
  scrapingState.created = 0
  scrapingState.updated = 0
  scrapingState.keyword = keyword || ''

  try {
    appendLog({ type, title: `Start scraping`, status: 'info', message: `Pages ${startPage}-${endPage}${scrapingState.keyword ? `, keyword=${scrapingState.keyword}` : ''}` })

    // Set total pages for progress tracking
    scrapingState.totalPages = endPage - startPage + 1

    // Start scraping based on type
    let discovered = 0
    for (let page = startPage; page <= endPage; page++) {
      if (!scrapingState.isRunning) break

      discovered++
      scrapingState.currentPage = discovered
      scrapingState.totalPages = endPage - startPage + 1

      appendLog({ type, title: `Processing page ${page}`, status: 'info', message: `Page ${discovered}` })

      try {
        let apiUrl = ''
        switch (type) {
          case 'movies':
            apiUrl = `https://api.porn-api.com/api/movies?page=${page}&limit=20${scrapingState.keyword ? `&sortBy=createdAt&sortOrder=DESC&keyword=${encodeURIComponent(scrapingState.keyword)}` : ''}`
            break
          case 'categories':
            apiUrl = 'https://api.porn-api.com/api/movies/categories'
            break
          case 'actors':
            apiUrl = 'https://api.porn-api.com/api/actors'
            break
          case 'countries':
            apiUrl = 'https://api.porn-api.com/api/countries'
            break
        }

        const controller = new AbortController()
        const to = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        clearTimeout(to)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        const items = data.data || data || []

        if (items.length === 0) {
          appendLog({ type, title: `No items found on page ${page}`, status: 'info', message: 'Empty page' })
          continue
        }

        // Process items
        for (const item of items) {
          if (!scrapingState.isRunning) break

          try {
            // Import process functions
            const { processMovie, processCategory, processActor, processCountry } = await import('./scraper-process')
            
            let result
            switch (type) {
              case 'movies':
                result = await processMovie(item, updateExisting)
                break
              case 'categories':
                result = await processCategory(item)
                break
              case 'actors':
                result = await processActor(item)
                break
              case 'countries':
                result = await processCountry(item)
                break
              default:
                throw new Error(`Unknown type: ${type}`)
            }
            
            if (result.created) scrapingState.created++
            if (result.updated) scrapingState.updated++
            scrapingState.processed++
          } catch (error) {
            console.error('Error processing item:', error)
            scrapingState.errors++
          }
        }

      } catch (error) {
        console.error(`Error processing page ${page}:`, error)
        scrapingState.errors++
        appendLog({ 
          type, 
          title: `Page ${page} failed`, 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    appendLog({ 
      type, 
      title: `Scraping completed`, 
      status: 'success', 
      message: `Processed ${scrapingState.processed} items, created ${scrapingState.created}, updated ${scrapingState.updated}, errors ${scrapingState.errors}` 
    })

  } catch (error) {
    console.error('Scraping error:', error)
    appendLog({ 
      type, 
      title: `Scraping failed`, 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    })
    throw error
  } finally {
    scrapingState.isRunning = false
  }
}
