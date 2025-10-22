import { NextRequest, NextResponse } from 'next/server'
import { scrapingState, appendLog, ScrapeType } from '../state'

export const dynamic = 'force-dynamic'

// use shared state from state.ts

export async function POST(request: NextRequest) {
  try {
    if (scrapingState.isRunning) {
      return NextResponse.json({ 
        success: false, 
        message: 'Scraping is already running' 
      })
    }

    const { type, startPage, endPage, keyword, updateExisting, pageDelayMs, requestTimeoutMs } = await request.json()

    if (!type || !startPage || !endPage) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters' 
      })
    }

    // Start scraping in background (don't await)
    appendLog({ type, title: `Started scraping`, status: 'info', message: `Type=${type}, pages=${startPage}-${endPage}, updateExisting=${!!updateExisting}${keyword ? `, keyword=${keyword}` : ''}` })
    
    // Start scraping asynchronously
    const baseUrl = request.nextUrl.origin
    ;(scrapingState as any).pageDelayMs = typeof pageDelayMs === 'number' && pageDelayMs >= 0 ? pageDelayMs : 500
    ;(scrapingState as any).requestTimeoutMs = typeof requestTimeoutMs === 'number' && requestTimeoutMs >= 1000 ? requestTimeoutMs : 10000
    setImmediate(() => {
      startScraping(type, startPage, endPage, keyword, updateExisting, baseUrl)
    })

    return NextResponse.json({
      success: true,
      message: 'Scraping started successfully'
    })

  } catch (error) {
    console.error('Start scraping error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to start scraping' 
    }, { status: 500 })
  }
}

async function startScraping(type: ScrapeType, startPage: number, endPage: number, keyword?: string, updateExisting: boolean = true, baseUrl?: string) {
  // Reset scraping state
  scrapingState.isRunning = true
  scrapingState.currentPage = startPage - 1
  scrapingState.totalPages = endPage - startPage + 1
  scrapingState.processed = 0
  scrapingState.total = 0
  scrapingState.errors = 0
  scrapingState.created = 0
  scrapingState.updated = 0
  scrapingState.currentItem = ''
  scrapingState.type = type
  scrapingState.keyword = (keyword || '').trim()
  ;(scrapingState as any).updateExisting = updateExisting
  scrapingState.logs = []

  try {
    // Process pages sequentially; stop at the first empty page
    appendLog({ type, title: `Start scraping`, status: 'info', message: `Pages ${startPage}-${endPage}${scrapingState.keyword ? `, keyword=${scrapingState.keyword}` : ''}` })
    let discovered = 0
    for (let page = startPage; page <= endPage; page++) {
      if (!scrapingState.isRunning) break

      discovered++
      scrapingState.currentPage = discovered
      scrapingState.totalPages = endPage - startPage + 1
      scrapingState.currentItem = `Page ${page} (${discovered}/${scrapingState.totalPages})`

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
        const to = setTimeout(() => controller.abort(), (scrapingState as any).requestTimeoutMs || 10000)
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller.signal
        })
        clearTimeout(to)

        if (!response.ok) {
          scrapingState.errors++
          appendLog({ type, title: `Page ${page}`, status: 'error', message: `Failed to fetch (status: ${response.status})` })
          continue
        }

        const data = await response.json()
        let items = []

        if (type === 'movies' && data.success && data.data) {
          items = data.data
        } else if (type !== 'movies' && data) {
          items = Array.isArray(data) ? data : (data.data || [])
        }

        // Process items in batches
        if (items.length > 0) {
          appendLog({ type, title: `Page ${page} fetched`, status: 'info', message: `${items.length} items found` })
          try {
            const base = process.env.NEXT_PUBLIC_BASE_URL || baseUrl || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
            const processResponse = await fetch(`${base}/api/scraper/process`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, items, updateExisting })
            })
            
            const processData = await processResponse.json()
            if (processData.success) {
              scrapingState.processed += processData.processed
              scrapingState.errors += processData.errors
              scrapingState.created += processData.created || 0
              scrapingState.updated += processData.updated || 0

              // Append per-item logs from process route if provided
              if (Array.isArray(processData.logs)) {
                for (const log of processData.logs) {
                  appendLog(log)
                  console.log(`[${log.status.toUpperCase()}] ${log.title}: ${log.message}`)
                }
              }
              
              // Add summary log for the batch
              if (processData.processed > 0) {
                appendLog({
                  type: type as ScrapeType,
                  title: `Page ${page} completed`,
                  status: 'info',
                  message: `${processData.processed} items: ${processData.created || 0} New, ${processData.updated || 0} Update`
                })
              } else {
                appendLog({
                  type: type as ScrapeType,
                  title: `Page ${page} completed`,
                  status: 'info',
                  message: `All items skipped (updateExisting: ${updateExisting})`
                })
              }
            } else {
              scrapingState.errors += items.length
              appendLog({
                type: type as ScrapeType,
                title: `Page ${page} batch`,
                status: 'error',
                message: 'Failed to process batch'
              })
            }
          } catch (error) {
            console.error('Error processing batch:', error)
            scrapingState.errors += items.length
            appendLog({
              type: type as ScrapeType,
              title: `Page ${page} batch`,
              status: 'error',
              message: `Processing error: ${error}`
            })
          }
        } else {
          appendLog({ type, title: `Page ${page}`, status: 'info', message: `No items found, stopping` })
          break
        }

        scrapingState.total += items.length

        // Delay between pages (configurable)
        await new Promise(resolve => setTimeout(resolve, (scrapingState as any).pageDelayMs || 500))

      } catch (error) {
        console.error(`Error processing page ${page}:`, error)
        scrapingState.errors++
        appendLog({ type, title: `Page ${page}`, status: 'error', message: `Error: ${error}` })
      }
    }

  } catch (error) {
    console.error('Scraping error:', error)
    appendLog({ type, title: `Scraping error`, status: 'error', message: `${error}` })
  } finally {
    scrapingState.isRunning = false
    scrapingState.currentItem = 'Completed'
    appendLog({ type, title: `Scraping completed`, status: 'info', message: `Total: ${scrapingState.processed} processed, ${scrapingState.created} New, ${scrapingState.updated} Update, ${scrapingState.errors} errors` })
  }
}

