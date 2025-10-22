import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function POST(_request: NextRequest) {
  try {
    const rows = dbService.db.prepare('SELECT id, category, model FROM videos').all() as Array<{id:number; category:string|null; model:string|null}>

    const delVc = dbService.db.prepare('DELETE FROM video_categories WHERE video_id = ?')
    const insVc = dbService.db.prepare('INSERT INTO video_categories (video_id, category) VALUES (?, ?)')
    const delVm = dbService.db.prepare('DELETE FROM video_models WHERE video_id = ?')
    const insVm = dbService.db.prepare('INSERT INTO video_models (video_id, model) VALUES (?, ?)')

    const tx = dbService.db.transaction(() => {
      for (const row of rows) {
        delVc.run(row.id)
        const cats = String(row.category || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
        for (const c of cats) insVc.run(row.id, c)

        delVm.run(row.id)
        const models = String(row.model || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
        for (const m of models) insVm.run(row.id, m)
      }
    })
    tx()

    return NextResponse.json({ success: true, total: rows.length })
  } catch (error) {
    console.error('Backfill links error:', error)
    return NextResponse.json({ success: false, error: 'Failed to backfill' }, { status: 500 })
  }
}


