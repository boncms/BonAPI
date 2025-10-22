import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    // Ensure preserveFormat defaults to '0' if not provided
    if (!formData.get('preserveFormat')) {
      formData.set('preserveFormat', '0')
    }

    const upstream = await fetch('https://imgup.space/api/public/upload', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer unlimited00551'
      },
      body: formData
    })

    const text = await upstream.text()
    let json: any
    try { json = JSON.parse(text) } catch (_) { json = { raw: text } }

    return NextResponse.json(json, { status: upstream.status })
  } catch (error: any) {
    console.error('Upload proxy error:', error)
    return NextResponse.json({ error: 'Upload proxy failed' }, { status: 500 })
  }
}


