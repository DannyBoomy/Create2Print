import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const generationCounts = new Map<string, number>()

function getOpenAIImageSize(width: number, height: number): '1024x1024' | '1536x1024' | '1024x1536' {
  const ratio = width / height
  if (ratio > 1.3) return '1536x1024'
  if (ratio < 0.77) return '1024x1536'
  return '1024x1024'
}

function sanitizePrompt(prompt: string): string {
  return prompt.trim().slice(0, 800)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, width, height } = body

    if (!prompt || !width || !height) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const count = generationCounts.get(ip) || 0

    if (count >= 3) {
      return NextResponse.json(
        { error: 'You have used all 3 free generations. Please complete a purchase to continue.' },
        { status: 429 }
      )
    }

    generationCounts.set(ip, count + 1)
    setTimeout(() => generationCounts.delete(ip), 24 * 60 * 60 * 1000)

    const size = getOpenAIImageSize(Number(width), Number(height))
    const cleanPrompt = sanitizePrompt(prompt)

    const response = await openai.images.generate({
      model: 'gpt-image-2.5-sunburst',
      prompt: cleanPrompt,
      n: 1,
      size,
      quality: 'high',
    })

    const imageUrl = response.data?.[0]?.url
    const b64 = response.data?.[0]?.b64_json

    if (!imageUrl && !b64) {
      return NextResponse.json({ error: 'No image returned from AI' }, { status: 500 })
    }

    const finalImageUrl = imageUrl || `data:image/png;base64,${b64}`
    console.log('Image type returned:', imageUrl ? 'https URL' : 'base64')

    return NextResponse.json({
      imageUrl: finalImageUrl,
      generationsLeft: 3 - (count + 1),
      size,
    })

  } catch (error: any) {
    console.error('OpenAI error:', error?.message || error)

    if (error?.status === 400 || error?.message?.includes('safety')) {
      return NextResponse.json(
        { error: 'Your prompt was flagged by the AI safety system. Try rephrasing — avoid violent, explicit, or sensitive themes.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error?.message || 'Image generation failed. Please try again.' },
      { status: 500 }
    )
  }
}