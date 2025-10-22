import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Create a backup folder under public/backup_<random>/ and copy data/database.sqlite
export async function POST() {
  try {
    const projectRoot = process.cwd()
    const dbPath = path.join(projectRoot, 'data', 'database.sqlite')
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ success: false, message: 'Database file not found' }, { status: 404 })
    }

    const random = Math.floor(Math.random() * 1_000_000_000)
    const backupFolderName = `backup_${random}`
    const backupDir = path.join(projectRoot, 'public', backupFolderName)
    fs.mkdirSync(backupDir, { recursive: true })

    const targetDbPath = path.join(backupDir, 'database.sqlite')
    // Copy file synchronously to ensure completion before responding
    fs.copyFileSync(dbPath, targetDbPath)

    // Write simple metadata
    const meta = {
      createdAt: new Date().toISOString(),
      size: fs.statSync(targetDbPath).size,
      source: 'data/database.sqlite',
      folder: backupFolderName,
      file: `${backupFolderName}/database.sqlite`,
    }
    fs.writeFileSync(path.join(backupDir, 'metadata.json'), JSON.stringify(meta, null, 2))

    return NextResponse.json({ success: true, backup: meta })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Backup failed' }, { status: 500 })
  }
}



