import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getToken } from 'next-auth/jwt'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const ADMIN_EMAIL = 'dborsykowsky@gmail.com'

const generationCounts = new Map<string, { count: number; timestamp: number }>()

function getOpenAIImageSize(width: number, height: number): '1024x1024' | '1536x1024' | '1024x1536' {
  const ratio = width / height
  const options = [
    { size: '1024x1024' as const, ratio: 1.000 },
    { size: '1536x1024' as const, ratio: 1.500 },
    { size: '1024x1536' as const, ratio: 0.667 },
  ]
  let best = options[0]
  let bestDiff = Infinity
  for (const option of options) {
    const diff = Math.abs(ratio - option.ratio)
    if (diff < bestDiff) { bestDiff = diff; best = option }
  }
  return best.size
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

    // Admin bypass
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const isAdmin = token?.email === ADMIN_EMAIL

    if (!isAdmin) {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'

      const now = Date.now()
      const existing = generationCounts.get(ip)

      if (existing && now - existing.timestamp > 24 * 60 * 60 * 1000) {
        generationCounts.delete(ip)
      }

      const current = generationCounts.get(ip)
      const count = current?.count || 0

      if (count >= 3) {
        return NextResponse.json(
          { error: 'You have used all 3 free generations. Please complete a purchase to continue.' },
          { status: 429 }
        )
      }

      generationCounts.set(ip, { count: count + 1, timestamp: current?.timestamp || now })
    }

    const size = getOpenAIImageSize(Number(width), Number(height))
    const cleanPrompt = sanitizePrompt(prompt) + ', full scene, zoomed out, complete composition, everything fitting in the image'

    console.log(`Generating at ${size} for print area ${width}x${height}`)

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

    return NextResponse.json({ imageUrl: finalImageUrl, size })

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