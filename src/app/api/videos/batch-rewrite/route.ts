import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { dbService } from '@/lib/database'
import { safeLog, safeError } from '@/lib/safe-logger'
import { cleanTitleMarkdown, cleanDescriptionMarkdown } from '@/lib/markdown-cleaner'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface BatchRewriteRequest {
  videoIds: number[]
  type: 'title' | 'description' | 'both'
  style?: 'seo' | 'engaging' | 'professional' | 'casual'
  language?: 'en' | 'vi' | 'auto'
  customPrompt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchRewriteRequest = await request.json()
    const { videoIds, type, style = 'seo', language = 'auto', customPrompt } = body

    if (!videoIds || videoIds.length === 0) {
      return NextResponse.json({ error: 'No video IDs provided' }, { status: 400 })
    }

    if (videoIds.length > 10) {
      return NextResponse.json({ 
        error: 'Maximum 10 videos can be processed at once' 
      }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured' 
      }, { status: 500 })
    }

    safeLog('🤖 Starting batch rewrite', { 
      videoCount: videoIds.length, 
      type, 
      style, 
      language 
    })

    const results = []
    const errors = []

    // Process videos one by one to avoid rate limits
    for (const videoId of videoIds) {
      try {
        const video = await dbService.getVideoById(videoId)
        if (!video) {
          errors.push({ videoId, error: 'Video not found' })
          continue
        }

        // Build prompt
        const prompt = buildPrompt(video, type, style, language, customPrompt)
        
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
          errors.push({ videoId, error: 'Failed to generate content' })
          continue
        }

        // Check if AI refused to generate content
        if (response.toLowerCase().includes("i'm sorry") || 
            response.toLowerCase().includes("i can't assist") ||
            response.toLowerCase().includes("i cannot") ||
            response.toLowerCase().includes("i'm not able")) {
          errors.push({ videoId, error: 'AI content generation was refused. Please try with different settings or custom prompt.' })
          continue
        }

        // Parse response
        let newTitle = video.title
        let newDescription = video.description
        
        if (type === 'title' || type === 'both') {
          const titleMatch = response.match(/TITLE:\s*(.+)/i)
          let title = titleMatch ? titleMatch[1].trim() : response.split('\n')[0].trim()
          newTitle = cleanTitleMarkdown(title)
        }
        
        if (type === 'description' || type === 'both') {
          const descMatch = response.match(/DESCRIPTION:\s*([\s\S]+?)(?=TITLE:|$)/i)
          let description = descMatch ? descMatch[1].trim() : response.split('\n').slice(1).join('\n').trim()
          newDescription = cleanDescriptionMarkdown(description)
        }

        // Update video in database
        const updateData: any = {}
        if (type === 'title' || type === 'both') updateData.title = newTitle
        if (type === 'description' || type === 'both') updateData.description = newDescription

        await dbService.updateVideo(videoId, updateData)

        results.push({
          videoId,
          success: true,
          newTitle,
          newDescription,
          originalTitle: video.title,
          originalDescription: video.description
        })

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        safeError(`Error processing video ${videoId}`, error)
        errors.push({ 
          videoId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    safeLog('✅ Batch rewrite completed', { 
      successCount: results.length, 
      errorCount: errors.length 
    })

    return NextResponse.json({ 
      success: true, 
      results,
      errors,
      summary: {
        total: videoIds.length,
        successful: results.length,
        failed: errors.length
      }
    })

  } catch (error) {
    safeError('Error in batch rewrite', error)
    return NextResponse.json({ 
      error: 'Failed to process batch rewrite' 
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
- Under 200 characters for title, 500-1000 characters for description
- Focus on entertainment value, appeal, and viewer interest
- Use power words like "amazing", "incredible", "stunning", "intense", "passionate", "exciting", "thrilling" etc.`

  return prompt
}
