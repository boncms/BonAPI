import { NextRequest, NextResponse } from 'next/server'
import dbService from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)
    await dbService.incrementVideoViews(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error incrementing video views:', error)
    return NextResponse.json({ error: 'Failed to increment views' }, { status: 500 })
  }
}
