import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// GET /api/backup/download?file=backup_xxx/database.sqlite supports Range header for chunked download
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const fileParam = url.searchParams.get('file')
    if (!fileParam) {
      return NextResponse.json({ success: false, message: 'Missing file parameter' }, { status: 400 })
    }
    // Normalize to ensure it points inside public folder
    const projectRoot = process.cwd()
    const absolutePath = path.join(projectRoot, 'public', fileParam)
    if (!absolutePath.startsWith(path.join(projectRoot, 'public'))) {
      return NextResponse.json({ success: false, message: 'Invalid path' }, { status: 400 })
    }
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 })
    }

    const stat = fs.statSync(absolutePath)
    const size = stat.size
    const range = req.headers.get('range')

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1
      const chunkSize = (end - start) + 1
      const fileStream = fs.createReadStream(absolutePath, { start, end })

      const headers = new Headers()
      headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
      headers.set('Accept-Ranges', 'bytes')
      headers.set('Content-Length', String(chunkSize))
      headers.set('Content-Type', 'application/octet-stream')
      headers.set('Content-Disposition', `attachment; filename=${path.basename(absolutePath)}`)

      return new NextResponse(fileStream as unknown as BodyInit, { status: 206, headers })
    }

    // Full download
    const headers = new Headers()
    headers.set('Content-Length', String(size))
    headers.set('Content-Type', 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename=${path.basename(absolutePath)}`)
    const fileStream = fs.createReadStream(absolutePath)
    return new NextResponse(fileStream as unknown as BodyInit, { status: 200, headers })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Download failed' }, { status: 500 })
  }
}



