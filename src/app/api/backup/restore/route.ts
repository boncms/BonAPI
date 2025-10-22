import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Restore database from either an uploaded file (multipart/form-data) or a server-side backup file reference
export async function POST(req: NextRequest) {
  try {
    const projectRoot = process.cwd()
    const dbPath = path.join(projectRoot, 'data', 'database.sqlite')

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as unknown as File | null
      if (!file) {
        return NextResponse.json({ success: false, message: 'Missing file' }, { status: 400 })
      }
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      fs.mkdirSync(path.dirname(dbPath), { recursive: true })
      fs.writeFileSync(dbPath, buffer)
      return NextResponse.json({ success: true, message: 'Database restored from upload' })
    }

    // JSON body expects { file: 'backup_xxx/database.sqlite' }
    const body = await req.json().catch(() => ({}))
    const fileParam = body?.file
    if (!fileParam) {
      return NextResponse.json({ success: false, message: 'Missing file parameter' }, { status: 400 })
    }
    const srcPath = path.join(projectRoot, 'public', fileParam)
    if (!srcPath.startsWith(path.join(projectRoot, 'public'))) {
      return NextResponse.json({ success: false, message: 'Invalid path' }, { status: 400 })
    }
    if (!fs.existsSync(srcPath)) {
      return NextResponse.json({ success: false, message: 'Backup file not found' }, { status: 404 })
    }
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    fs.copyFileSync(srcPath, dbPath)
    return NextResponse.json({ success: true, message: 'Database restored from backup' })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Restore failed' }, { status: 500 })
  }
}



