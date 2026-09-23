import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getToken } from 'next-auth/jwt'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const ADMIN_EMAIL = 'dborsykowsky@gmail.com'

const generationCounts = new Map<string, { count: number; timestamp: number }>()

/**
 * Find the optimal OpenAI image dimensions for a given print area ratio.
 * Rules:
 * - Width and height must be multiples of 16
 * - Aspect ratio between 1:3 and 3:1
 * - Longest edge up to 3840px
 * - Total area between 655,360 and 8,294,400 pixels
 */
function getOptimalOpenAISize(printAreaWidth: number, printAreaHeight: number): { width: number; height: number } {
  const targetRatio = printAreaWidth / printAreaHeight

  // Target a good quality size — aim for ~2048px on the longer edge
  const TARGET_LONG_EDGE = 2048
  const MIN_AREA = 655360
  const MAX_AREA = 8294400
  const MAX_EDGE = 3840
  const MULTIPLE = 16

  let bestWidth = 1024
  let bestHeight = 1024
  let bestDiff = Infinity

  // Try heights from 512 to 3840 in multiples of 16
  for (let h = 512; h <= MAX_EDGE; h += MULTIPLE) {
    // Calculate ideal width for this height
    const idealWidth = targetRatio * h
    // Round to nearest multiple of 16
    const w = Math.round(idealWidth / MULTIPLE) * MULTIPLE

    if (w < 512 || w > MAX_EDGE) continue

    const area = w * h
    if (area < MIN_AREA || area > MAX_AREA) continue

    const ratio = w / h
    if (ratio < 1/3 || ratio > 3) continue

    const diff = Math.abs(ratio - targetRatio)

    // Prefer solutions closer to our target long edge for quality
    const longEdge = Math.max(w, h)
    const edgePenalty = Math.abs(longEdge - TARGET_LONG_EDGE) / TARGET_LONG_EDGE * 0.001

    if (diff + edgePenalty < bestDiff) {
      bestDiff = diff + edgePenalty
      bestWidth = w
      bestHeight = h
    }
  }

  console.log(`Print area ${printAreaWidth}x${printAreaHeight} (ratio ${targetRatio.toFixed(4)}) → OpenAI ${bestWidth}x${bestHeight} (ratio ${(bestWidth/bestHeight).toFixed(4)}, diff ${(bestDiff*100).toFixed(3)}%)`)

  return { width: bestWidth, height: bestHeight }
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

    // Get optimal dimensions for this print area
    const { width: aiWidth, height: aiHeight } = getOptimalOpenAISize(Number(width), Number(height))
    const cleanPrompt = sanitizePrompt(prompt) + ', full scene, zoomed out, complete composition, nothing cut off at edges'

    const response = await openai.images.generate({
      model: 'gpt-image-2.5-sunburst',
      prompt: cleanPrompt,
      n: 1,
      size: `${aiWidth}x${aiHeight}` as any,
      quality: 'high',
    })

    const imageUrl = response.data?.[0]?.url
    const b64 = response.data?.[0]?.b64_json

    if (!imageUrl && !b64) {
      return NextResponse.json({ error: 'No image returned from AI' }, { status: 500 })
    }

    const finalImageUrl = imageUrl || `data:image/png;base64,${b64}`

    return NextResponse.json({ imageUrl: finalImageUrl, size: `${aiWidth}x${aiHeight}` })

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