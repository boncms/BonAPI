import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const projectRoot = process.cwd()
    const publicDir = path.join(projectRoot, 'public')
    if (!fs.existsSync(publicDir)) {
      return NextResponse.json({ success: true, backups: [] })
    }

    const entries = fs.readdirSync(publicDir).filter(name => name.startsWith('backup_'))
    const backups = entries.map(folder => {
      const folderPath = path.join(publicDir, folder)
      const dbFile = path.join(folderPath, 'database.sqlite')
      const metaFile = path.join(folderPath, 'metadata.json')
      let meta: any = null
      if (fs.existsSync(metaFile)) {
        try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8')) } catch (_) {}
      }
      return {
        folder,
        hasDb: fs.existsSync(dbFile),
        size: fs.existsSync(dbFile) ? fs.statSync(dbFile).size : 0,
        createdAt: meta?.createdAt || fs.statSync(folderPath).mtime.toISOString(),
        file: `${folder}/database.sqlite`,
        meta,
      }
    }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

    return NextResponse.json({ success: true, backups })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'List failed' }, { status: 500 })
  }
}



