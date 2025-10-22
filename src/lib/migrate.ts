import { videos, categories, models } from './data'
import dbService from './database'

export async function migrateData() {
  console.log('Starting data migration...')
  
  try {
    // Migrate categories
    console.log('Migrating categories...')
    for (const category of categories) {
      await dbService.createCategory(category)
    }
    console.log(`✅ Migrated ${categories.length} categories`)

    // Migrate models
    console.log('Migrating models...')
    for (const model of models) {
      await dbService.createModel(model)
    }
    console.log(`✅ Migrated ${models.length} models`)

    // Migrate videos
    console.log('Migrating videos...')
    for (const video of videos) {
      await dbService.createVideo(video)
    }
    console.log(`✅ Migrated ${videos.length} videos`)

    // Update stats
    console.log('Updating statistics...')
    await dbService.updateStats()
    console.log('✅ Statistics updated')

    console.log('🎉 Data migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
