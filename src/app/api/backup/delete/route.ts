import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Delete a backup folder under public by name: { folder: 'backup_xxx' }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const folder = body?.folder as string | undefined
    if (!folder || !folder.startsWith('backup_')) {
      return NextResponse.json({ success: false, message: 'Thiếu hoặc sai tên thư mục backup' }, { status: 400 })
    }

    const projectRoot = process.cwd()
    const target = path.join(projectRoot, 'public', folder)
    const publicRoot = path.join(projectRoot, 'public')
    if (!target.startsWith(publicRoot)) {
      return NextResponse.json({ success: false, message: 'Đường dẫn không hợp lệ' }, { status: 400 })
    }
    if (!fs.existsSync(target)) {
      return NextResponse.json({ success: false, message: 'Thư mục backup không tồn tại' }, { status: 404 })
    }

    fs.rmSync(target, { recursive: true, force: true })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Xoá backup thất bại' }, { status: 500 })
  }
}



