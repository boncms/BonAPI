import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { dbService } from '@/lib/database'
import { safeLog, safeError } from '@/lib/safe-logger'
import { cleanTitleMarkdown, cleanDescriptionMarkdown } from '@/lib/markdown-cleaner'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface RewriteRequest {
  type: 'title' | 'description' | 'both'
  style?: 'seo' | 'engaging' | 'professional' | 'casual'
  language?: 'en' | 'vi' | 'auto'
  customPrompt?: string
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const videoId = parseInt(id)
    if (isNaN(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 })
    }

    const video = await dbService.getVideoById(videoId)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const body: RewriteRequest = await request.json()
    const { type, style = 'seo', language = 'auto', customPrompt } = body

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 })
    }

    // Build prompt based on type and style
    let prompt = buildPrompt(video, type, style, language, customPrompt)
    
    safeLog('🤖 Rewriting video content', { 
      videoId, 
      type, 
      style, 
      language,
      originalTitle: video.title?.substring(0, 50) + '...'
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer specializing in creating highly engaging and click-worthy titles and descriptions for entertainment video platforms. You create compelling content that drives clicks and engagement while being SEO-optimized. You understand audience psychology and create content that maximizes click-through rates.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      return NextResponse.json({ 
        error: 'Failed to generate content' 
      }, { status: 500 })
    }

    // Check if AI refused to generate content
    if (response.toLowerCase().includes("i'm sorry") || 
        response.toLowerCase().includes("i can't assist") ||
        response.toLowerCase().includes("i cannot") ||
        response.toLowerCase().includes("i'm not able")) {
      return NextResponse.json({ 
        error: 'AI content generation was refused. Please try with different settings or custom prompt.' 
      }, { status: 400 })
    }

    // Parse response based on type
    let result: any = {}
    
    if (type === 'title' || type === 'both') {
      const titleMatch = response.match(/TITLE:\s*(.+)/i)
      let title = titleMatch ? titleMatch[1].trim() : response.split('\n')[0].trim()
      result.newTitle = cleanTitleMarkdown(title)
    }
    
    if (type === 'description' || type === 'both') {
      const descMatch = response.match(/DESCRIPTION:\s*([\s\S]+?)(?=TITLE:|$)/i)
      let description = descMatch ? descMatch[1].trim() : response.split('\n').slice(1).join('\n').trim()
      result.newDescription = cleanDescriptionMarkdown(description)
    }

    safeLog('✅ Video content rewritten successfully', { 
      videoId, 
      type,
      newTitle: result.newTitle?.substring(0, 50) + '...',
      newDescription: result.newDescription?.substring(0, 100) + '...'
    })

    return NextResponse.json({ 
      success: true, 
      data: result,
      original: {
        title: video.title,
        description: video.description || ''
      }
    })

  } catch (error) {
    safeError('Error rewriting video content', error)
    return NextResponse.json({ 
      error: 'Failed to rewrite content' 
    }, { status: 500 })
  }
}

function buildPrompt(
  video: any, 
  type: string, 
  style: string, 
  language: string, 
  customPrompt?: string
): string {
  if (customPrompt) {
    return `Original video data:
Title: ${video.title}
Description: ${video.description}
Model: ${video.model}
Category: ${video.category}
Duration: ${video.duration}
Views: ${video.views}

Custom prompt: ${customPrompt}

Please rewrite the content according to the custom prompt.`
  }

  const styleInstructions = {
    seo: 'Focus on SEO optimization with relevant keywords, clear structure, and search-friendly language that ranks well in entertainment content searches.',
    engaging: 'Create highly compelling, attention-grabbing content that drives maximum clicks and engagement. Use powerful language, emotional triggers, and create intense curiosity.',
    professional: 'Write in a sophisticated tone that is elegant and appealing, using refined language that appeals to mature audiences.',
    casual: 'Use direct, bold, and engaging language that feels natural and highly appealing. Be confident, provocative, and attention-grabbing.'
  }

  const languageInstructions = {
    en: 'Write in English.',
    vi: 'Write in Vietnamese.',
    auto: 'Write in the same language as the original content.'
  }

  let prompt = `Please rewrite the following video content to make it more ${style} and ${languageInstructions[language as keyof typeof languageInstructions]}.

Original video data:
Title: ${video.title}
Description: ${video.description}
Model: ${video.model}
Category: ${video.category}
Duration: ${video.duration}
Views: ${video.views}

Style instructions: ${styleInstructions[style as keyof typeof styleInstructions]}

Please provide the rewritten content in the following format:
${type === 'title' || type === 'both' ? 'TITLE: [new title here]' : ''}
${type === 'description' || type === 'both' ? 'DESCRIPTION: [new description here]' : ''}

Make sure the content is:
- Highly engaging and click-worthy
- Uses compelling language and emotional triggers
- SEO-optimized with relevant keywords and terms
- Designed to maximize click-through rates and engagement
- Bold, direct, and attention-grabbing
- Under 80 characters for title, 150–300 characters for description
- Focus on entertainment value, appeal, and viewer interest
- Use power words like "amazing", "incredible", "stunning", "intense", "passionate", "exciting", "thrilling" etc.`

  return prompt
}
