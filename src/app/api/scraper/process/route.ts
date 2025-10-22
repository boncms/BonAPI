import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'
import { appendLog, ScrapeType } from '../state'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { type, items, updateExisting = true } = await request.json()

    if (!type || !Array.isArray(items)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid request data' 
      })
    }

    let processed = 0
    let errors = 0
    let created = 0
    let updated = 0

    const logs: any[] = []
    for (const item of items) {
      try {
        let result = { created: false, updated: false }
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
        }
        
        const title = item.title || item.name || 'Untitled'
        if (result.created) {
          created++
          logs.push({ type: type as ScrapeType, title, status: 'created' as const, message: 'New' })
          appendLog({ type: type as ScrapeType, title, status: 'created', message: 'New' })
        }
        if (result.updated) {
          updated++
          logs.push({ type: type as ScrapeType, title, status: 'updated' as const, message: 'Update' })
          appendLog({ type: type as ScrapeType, title, status: 'updated', message: 'Update' })
        }
        // Only count as processed if something actually happened
        if (result.created || result.updated) {
          processed++
        } else {
          // Log when item was skipped
          logs.push({ type: type as ScrapeType, title, status: 'info' as const, message: 'Skip' })
          appendLog({ type: type as ScrapeType, title, status: 'info', message: 'Skip' })
        }
      } catch (error) {
        console.error(`Error processing ${type} item:`, error)
        logs.push({ type: type as ScrapeType, title: item.title || item.name || 'Untitled', status: 'error' as const, message: (error as any)?.message || 'Error' })
        appendLog({ type: type as ScrapeType, title: item.title || item.name || 'Untitled', status: 'error', message: (error as any)?.message || 'Error' })
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      errors,
      created,
      updated,
      logs,
      message: `Processed ${processed} items: ${created} created, ${updated} updated, ${errors} errors`
    })

  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to process items' 
    }, { status: 500 })
  }
}

async function processMovie(item: any, updateExisting: boolean): Promise<{created: boolean, updated: boolean}> {
  console.log('Processing movie:', item.title)
  
  // Convert duration from seconds to MM:SS format
  const duration = item.duration ? Math.floor(item.duration / 60) + ':' + (item.duration % 60).toString().padStart(2, '0') : '0:00'
  
  // Get first embedded server URL
  const embedUrl = item.embeddedServers && item.embeddedServers.length > 0 
    ? item.embeddedServers[0].url 
    : ''

  const categoriesArr = Array.isArray(item.categories) ? item.categories : []
  const actorsArr = Array.isArray(item.actors) ? item.actors : []
  const categoryList = categoriesArr.map((c: any) => String(c)).filter(Boolean).join(', ')
  const modelList = actorsArr.map((a: any) => String(a)).filter(Boolean).join(', ')

  // Create video data
  const videoData = {
    title: item.title || 'Untitled',
    description: item.description || '',
    thumbnail: item.thumb || '',
    duration: duration,
    videoUrl: embedUrl, // Database expects videoUrl, not embed
    views: Math.floor(Math.random() * 10000), // Random views for demo
    likes: Math.floor(Math.random() * 1000),
    dislikes: 0, // Add missing field
    featured: Math.random() > 0.9, // 10% chance of being featured
    uploadDate: new Date().toISOString(),
    tags: item.tags || [],
    category: categoryList || 'General',
    model: modelList || 'Unknown',
    slug: item.title ? item.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : ''
  }

  console.log('Video data prepared:', videoData.title)

  // Auto-create category if it doesn't exist
  try {
    // Ensure all categories exist
    for (const categoryName of categoriesArr) {
      const name = String(categoryName)
      const existingCategory = await dbService.getCategoryByName(name)
      if (!existingCategory) {
        console.log(`Creating new category: ${name}`)
        await dbService.createCategory({
          name,
          description: `Content in ${name} category`,
          videoCount: 0
        })
      }
    }
  } catch (error) {
    console.error(`Error creating category ${videoData.category}:`, error)
  }

  // Auto-create model if it doesn't exist
  try {
    for (const actorName of actorsArr) {
      const name = String(actorName)
      const existingModel = await dbService.getModelByName(name)
      if (!existingModel) {
        console.log(`Creating new model: ${name}`)
        await dbService.createModel({
          name,
          description: `Model ${name}`,
          avatar: '',
          videoCount: 0,
          totalViews: 0
        })
      }
    }
  } catch (error) {
    console.error(`Error creating model ${videoData.model}:`, error)
  }

  // Check if video already exists by title (case-insensitive)
  let existingVideo = await dbService.getVideoByTitle(videoData.title)
  let videoResult = { created: false, updated: false }
  
  console.log(`Checking for existing video: "${videoData.title}"`)
  console.log(`Found existing video by title:`, existingVideo ? `ID ${existingVideo.id}` : 'None')
  
  // If not found by title, try to find by slug
  if (!existingVideo && videoData.slug) {
    try {
      const videos = await dbService.getVideos()
      existingVideo = videos.find(v => v.slug === videoData.slug) || null
      console.log(`Found existing video by slug:`, existingVideo ? `ID ${existingVideo.id}` : 'None')
    } catch (error) {
      console.log('Error searching by slug:', error)
    }
  }
  
  if (existingVideo) {
    console.log(`Video "${videoData.title}" already exists, checking if update needed...`)
    
    // Check if video needs updating (compare key fields)
    const needsUpdate = 
      existingVideo.description !== videoData.description ||
      existingVideo.thumbnail !== videoData.thumbnail ||
      existingVideo.duration !== videoData.duration ||
      existingVideo.videoUrl !== videoData.videoUrl ||
      existingVideo.category !== videoData.category ||
      existingVideo.model !== videoData.model
    
    const forceUpdate = Boolean(updateExisting)
    if (needsUpdate || forceUpdate) {
      if (!updateExisting) {
        console.log(`Update skipped by option for "${videoData.title}" - updateExisting is false`)
        return { created: false, updated: false }
      }
      console.log(`Video "${videoData.title}" needs updating...`)
      const updateData = {
        title: videoData.title,
        description: videoData.description,
        thumbnail: videoData.thumbnail,
        duration: videoData.duration,
        videoUrl: videoData.videoUrl,
        // Keep existing views and likes, only update if they're higher
        views: Math.max(existingVideo.views || 0, videoData.views),
        likes: Math.max(existingVideo.likes || 0, videoData.likes),
        dislikes: videoData.dislikes,
        // Do not override featured flag when updateExisting is on
        featured: existingVideo.featured,
        uploadDate: videoData.uploadDate,
        tags: videoData.tags,
        category: videoData.category,
        model: videoData.model,
        slug: videoData.slug
      }
      const updated = await dbService.updateVideo(existingVideo.id, updateData)
      // Update link tables
      try {
        ;(dbService as any).db.prepare('DELETE FROM video_categories WHERE video_id = ?').run(existingVideo.id)
        for (const c of categoriesArr) {
          ;(dbService as any).db.prepare('INSERT INTO video_categories (video_id, category) VALUES (?, ?)').run(existingVideo.id, String(c))
        }
        ;(dbService as any).db.prepare('DELETE FROM video_models WHERE video_id = ?').run(existingVideo.id)
        for (const m of actorsArr) {
          ;(dbService as any).db.prepare('INSERT INTO video_models (video_id, model) VALUES (?, ?)').run(existingVideo.id, String(m))
        }
      } catch (e) {
        console.error('Update link tables failed:', e)
      }
      videoResult = { created: false, updated: true }
      console.log(`Video "${videoData.title}" updated successfully`)
    } else {
      console.log(`Video "${videoData.title}" is up to date, skipping...`)
      videoResult = { created: false, updated: false }
    }
  } else {
    // Create new video
    const created = await dbService.createVideo(videoData)
    // Insert link rows
    try {
      for (const c of categoriesArr) {
        ;(dbService as any).db.prepare('INSERT INTO video_categories (video_id, category) VALUES (?, ?)').run(created.id, String(c))
      }
      for (const m of actorsArr) {
        ;(dbService as any).db.prepare('INSERT INTO video_models (video_id, model) VALUES (?, ?)').run(created.id, String(m))
      }
    } catch (e) {
      console.error('Insert link tables failed:', e)
    }
    videoResult = { created: true, updated: false }
    console.log(`Video "${videoData.title}" created successfully`)
  }

  // Process categories
  if (categoriesArr && Array.isArray(categoriesArr)) {
    for (const categoryName of categoriesArr) {
      await processCategory({ name: categoryName, count: 1 })
    }
  }

  // Process actors (models)
  if (actorsArr && Array.isArray(actorsArr)) {
    for (const actorName of actorsArr) {
      await processActor({ name: actorName, videos: 1 })
    }
  }

  return videoResult
}

async function processCategory(item: any): Promise<{created: boolean, updated: boolean}> {
  const categoryName = item.name || item.title || 'Unknown'
  
  // Check if category exists
  const existingCategory = await dbService.getCategoryByName(categoryName)
  if (existingCategory) {
    // Update existing category
    await dbService.updateCategory(existingCategory.id, {
      ...existingCategory,
      description: item.description || existingCategory.description,
      videoCount: existingCategory.videoCount + (item.count || 1)
    })
    return { created: false, updated: true }
  }

  // Create new category
  const categoryData = {
    name: categoryName,
    description: item.description || `Content in ${categoryName} category`,
    videoCount: item.count || 1
  }

  await dbService.createCategory(categoryData)
  return { created: true, updated: false }
}

async function processActor(item: any): Promise<{created: boolean, updated: boolean}> {
  const actorName = item.name || item.title || 'Unknown'
  
  // Check if model exists
  const existingModel = await dbService.getModelByName(actorName)
  if (existingModel) {
    // Update existing model
    await dbService.updateModel(existingModel.id, {
      ...existingModel,
      description: item.description || existingModel.description,
      avatar: item.avatar || item.thumb || existingModel.avatar,
      videoCount: existingModel.videoCount + (item.videos || 1),
      totalViews: existingModel.totalViews + Math.floor(Math.random() * 1000) // Add some views
    })
    return { created: false, updated: true }
  }

  // Create new model
  const modelData = {
    name: actorName,
    description: item.description || `Adult performer ${actorName}`,
    avatar: item.avatar || item.thumb || '',
    videoCount: item.videos || 1,
    totalViews: Math.floor(Math.random() * 50000) // Random views for demo
  }

  await dbService.createModel(modelData)
  return { created: true, updated: false }
}

async function processCountry(item: any): Promise<{created: boolean, updated: boolean}> {
  // For now, just log countries - you can implement country-specific logic later
  console.log('Country:', item.name || item.title)
  return { created: false, updated: false }
}
