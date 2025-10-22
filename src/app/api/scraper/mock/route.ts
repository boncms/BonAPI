import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'movies'
    const limit = parseInt(searchParams.get('limit') || '5')

    let mockData: any[] = []

    if (type === 'movies') {
      mockData = [
        {
          title: "Sample Movie 1",
          description: "This is a sample movie description",
          thumb: "https://via.placeholder.com/320x180/1e293b/ffffff?text=Sample+1",
          duration: 1800, // 30 minutes
          categories: ["Sample Category 1", "Sample Category 2"],
          actors: ["Sample Actor 1", "Sample Actor 2"],
          tags: ["sample", "test", "demo"],
          embeddedServers: [{
            name: "Sample Server",
            url: "https://example.com/embed1"
          }]
        },
        {
          title: "Sample Movie 2", 
          description: "Another sample movie description",
          thumb: "https://via.placeholder.com/320x180/1e293b/ffffff?text=Sample+2",
          duration: 2400, // 40 minutes
          categories: ["Sample Category 3"],
          actors: ["Sample Actor 3"],
          tags: ["sample", "demo"],
          embeddedServers: [{
            name: "Sample Server 2",
            url: "https://example.com/embed2"
          }]
        },
        {
          title: "Sample Movie 3",
          description: "Third sample movie description", 
          thumb: "https://via.placeholder.com/320x180/1e293b/ffffff?text=Sample+3",
          duration: 1200, // 20 minutes
          categories: ["Sample Category 1", "Sample Category 4"],
          actors: ["Sample Actor 1", "Sample Actor 4"],
          tags: ["sample", "test"],
          embeddedServers: [{
            name: "Sample Server 3",
            url: "https://example.com/embed3"
          }]
        }
      ].slice(0, limit)
    } else if (type === 'categories') {
      mockData = [
        { name: "Sample Category 1", count: 10 },
        { name: "Sample Category 2", count: 5 },
        { name: "Sample Category 3", count: 8 }
      ].slice(0, limit)
    } else if (type === 'actors') {
      mockData = [
        { name: "Sample Actor 1", videos: 15 },
        { name: "Sample Actor 2", videos: 8 },
        { name: "Sample Actor 3", videos: 12 }
      ].slice(0, limit)
    } else if (type === 'countries') {
      mockData = [
        { name: "United States", count: 100 },
        { name: "United Kingdom", count: 50 },
        { name: "Canada", count: 30 }
      ].slice(0, limit)
    }

    return NextResponse.json({
      success: true,
      data: mockData,
      message: `Mock ${type} data generated successfully`
    })

  } catch (error) {
    console.error('Mock data error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to generate mock data' 
    }, { status: 500 })
  }
}

