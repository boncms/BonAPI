import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get counts from database
    const videosCount = await dbService.getVideosCount()
    const modelsCount = await dbService.getModelsCount()
    const categoriesCount = await dbService.getCategoriesCount()
    const adsCount = await dbService.getAdsCount()
    const totalViews = await dbService.getTotalViews()
    const totalImpressions = await dbService.getTotalImpressions()
    const totalClicks = await dbService.getTotalClicks()

    return NextResponse.json({
      success: true,
      stats: {
        videos: videosCount,
        models: modelsCount,
        categories: categoriesCount,
        ads: adsCount,
        totalViews,
        totalImpressions,
        totalClicks
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch analytics' 
    }, { status: 500 })
  }
}
