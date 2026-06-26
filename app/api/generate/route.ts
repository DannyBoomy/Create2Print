
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
 
export async function POST(req: NextRequest) {
  try {
    const { prompt, width, height } = await req.json()
 
    if (!prompt || !width || !height) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
 
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const count = generationCounts.get(ip) || 0
 
    if (count >= 3) {
      return NextResponse.json(
        { error: 'You have used all 3 free generations. Please complete a purchase to continue.' },
        { status: 429 }
      )
    }
 
    generationCounts.set(ip, count + 1)
    setTimeout(() => generationCounts.delete(ip), 24 * 60 * 60 * 1000)
 
    const size = getOpenAIImageSize(width, height)
 
    const enhancedPrompt = `${prompt}. Ultra high resolution, print ready, highly detailed, professional artwork, suitable for large format wall art printing.`
 
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: enhancedPrompt,
      n: 1,
      size,
      quality: 'high',
    })
 
    const imageUrl = response.data?.[0]?.url
    const b64 = response.data?.[0]?.b64_json
 
    if (!imageUrl && !b64) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 })
    }
 
    return NextResponse.json({
      imageUrl: imageUrl || `data:image/png;base64,${b64}`,
      generationsLeft: 3 - (count + 1),
    })
 
  } catch (error: any) {
    console.error('OpenAI error:', error)
    return NextResponse.json(
      { error: error?.message || 'Image generation failed' },
      { status: 500 }
    )
  }
}
 