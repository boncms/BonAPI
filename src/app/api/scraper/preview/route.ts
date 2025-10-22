import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'movies'
    const startPage = parseInt(searchParams.get('startPage') || '1')
    const endPage = parseInt(searchParams.get('endPage') || '10')
    const keyword = (searchParams.get('keyword') || '').trim()

    if (startPage > endPage) {
      return NextResponse.json({ 
        success: false, 
        message: 'Start page cannot be greater than end page' 
      })
    }

    const previewData = []
    const limit = 20 // Get more items per page for better preview
    const validPages = [] // Track which pages actually have data

    // First, check how many pages actually have data
    let maxValidPage = startPage
    for (let page = startPage; page <= endPage; page++) {
      try {
        let apiUrl = ''
        switch (type) {
          case 'movies':
            apiUrl = `https://api.porn-api.com/api/movies?page=${page}&limit=1${keyword ? `&sortBy=createdAt&sortOrder=DESC&keyword=${encodeURIComponent(keyword)}` : ''}`
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
          default:
            return NextResponse.json({ 
              success: false, 
              message: 'Invalid type specified' 
            })
        }

        console.log(`Checking page ${page}: ${apiUrl}`)
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://porn-api.com/'
          }
        })

        if (!response.ok) {
          console.log(`Page ${page} not available (status: ${response.status})`)
          break // Stop if page doesn't exist
        }

        const data = await response.json()
        let hasData = false
        
        if (type === 'movies' && data.success && data.data && data.data.length > 0) {
          hasData = true
        } else if (type !== 'movies' && data) {
          const items = Array.isArray(data) ? data : (data.data || [])
          hasData = items.length > 0
        }

        if (hasData) {
          validPages.push(page)
          maxValidPage = page
        } else {
          console.log(`Page ${page} has no data, stopping`)
          break
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error(`Error checking page ${page}:`, error)
        break
      }
    }

    console.log(`Valid pages found: ${validPages.join(', ')}`)

    // Now fetch actual data from valid pages
    for (const page of validPages) {
      try {
        let apiUrl = ''
        switch (type) {
          case 'movies':
            apiUrl = `https://api.porn-api.com/api/movies?page=${page}&limit=${limit}${keyword ? `&sortBy=createdAt&sortOrder=DESC&keyword=${encodeURIComponent(keyword)}` : ''}`
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

        console.log(`Fetching data from page ${page}: ${apiUrl}`)
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Referer': 'https://porn-api.com/'
          }
        })

        if (!response.ok) {
          console.error(`API request failed for page ${page}:`, response.status)
          continue
        }

        const data = await response.json()
        
        if (type === 'movies' && data.success && data.data) {
          previewData.push(...data.data)
        } else if (type !== 'movies' && data) {
          // For non-movies endpoints, get all data
          const items = Array.isArray(data) ? data : (data.data || [])
          previewData.push(...items)
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      data: previewData,
      validPages: validPages,
      maxValidPage: maxValidPage,
      message: `Preview completed. Found ${previewData.length} items from ${validPages.length} valid pages (${validPages.join(', ')}).`
    })

  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch preview data' 
    }, { status: 500 })
  }
}
