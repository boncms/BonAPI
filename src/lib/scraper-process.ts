import { dbService } from './database'

export async function processMovie(item: any, updateExisting: boolean): Promise<{created: boolean, updated: boolean}> {
  console.log('Processing movie:', item.title)
  
  // Convert duration from seconds to MM:SS format
  const duration = item.duration ? Math.floor(item.duration / 60) + ':' + (item.duration % 60).toString().padStart(2, '0') : '0:00'
  
  // Create video data
  const videoData = {
    title: item.title || 'Untitled',
    description: item.description || '',
    duration: duration,
    videoUrl: item.videoUrl || item.url || '',
    thumbnail: item.thumbnail || item.poster || '',
    category: item.category || 'Uncategorized',
    model: item.model || item.actor || 'Unknown',
    views: item.views || 0,
    likes: item.likes || 0,
    dislikes: item.dislikes || 0,
    uploadDate: item.uploadDate || item.createdAt || new Date().toISOString(),
    tags: item.tags || [],
    featured: false,
    slug: item.slug || ''
  }

  // Check if video exists
  const existingVideo = await dbService.getVideoByTitle(videoData.title)
  if (existingVideo) {
    if (updateExisting) {
      await dbService.updateVideo(existingVideo.id, videoData)
      console.log('Updated video:', videoData.title)
      return { created: false, updated: true }
    } else {
      console.log('Skipped existing video:', videoData.title)
      return { created: false, updated: false }
    }
  }

  // Create new video
  await dbService.createVideo(videoData)
  console.log('Created video:', videoData.title)
  return { created: true, updated: false }
}

export async function processCategory(item: any): Promise<{created: boolean, updated: boolean}> {
  const categoryName = item.name || item.title || 'Unknown'
  
  // Check if category exists
  const existingCategory = await dbService.getCategoryByName(categoryName)
  if (existingCategory) {
    console.log('Category already exists:', categoryName)
    return { created: false, updated: false }
  }

  // Create new category
  const categoryData = {
    name: categoryName,
    description: item.description || `Content in ${categoryName} category`,
    videoCount: 0
  }

  await dbService.createCategory(categoryData)
  console.log('Created category:', categoryName)
  return { created: true, updated: false }
}

export async function processActor(item: any): Promise<{created: boolean, updated: boolean}> {
  const actorName = item.name || item.title || 'Unknown'
  
  // Check if model exists
  const existingModel = await dbService.getModelByName(actorName)
  if (existingModel) {
    console.log('Model already exists:', actorName)
    return { created: false, updated: false }
  }

  // Create new model
  const modelData = {
    name: actorName,
    description: item.description || `Model: ${actorName}`,
    avatar: item.avatar || item.thumbnail || '',
    videoCount: 0,
    totalViews: 0
  }

  await dbService.createModel(modelData)
  console.log('Created model:', actorName)
  return { created: true, updated: false }
}

export async function processCountry(item: any): Promise<{created: boolean, updated: boolean}> {
  // For now, just log countries - you can implement country-specific logic later
  console.log('Country:', item.name || item.title)
  return { created: false, updated: false }
}
