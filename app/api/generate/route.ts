import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getToken } from 'next-auth/jwt'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  const TARGET_LONG_EDGE = 2048
  const MIN_AREA = 655360
  const MAX_AREA = 8294400
  const MAX_EDGE = 3840
  const MULTIPLE = 16

  let bestWidth = 1024
  let bestHeight = 1024
  let bestDiff = Infinity

  for (let h = 512; h <= MAX_EDGE; h += MULTIPLE) {
    const idealWidth = targetRatio * h
    const w = Math.round(idealWidth / MULTIPLE) * MULTIPLE

    if (w < 512 || w > MAX_EDGE) continue
    const area = w * h
    if (area < MIN_AREA || area > MAX_AREA) continue
    const ratio = w / h
    if (ratio < 1/3 || ratio > 3) continue

    const diff = Math.abs(ratio - targetRatio)
    const edgePenalty = Math.abs(Math.max(w, h) - TARGET_LONG_EDGE) / TARGET_LONG_EDGE * 0.001

    if (diff + edgePenalty < bestDiff) {
      bestDiff = diff + edgePenalty
      bestWidth = w
      bestHeight = h
    }
  }

  console.log(`Print area ${printAreaWidth}x${printAreaHeight} → OpenAI ${bestWidth}x${bestHeight} (diff ${(bestDiff*100).toFixed(3)}%)`)
  return { width: bestWidth, height: bestHeight }
}

function sanitizePrompt(prompt: string): string {
  return prompt.trim().slice(0, 800)
}

export async function POST(req: NextRequest) {
  let tempPath: string | null = null

  try {
    const body = await req.json()
    const { prompt, width, height, transparentBg, productContext } = body

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
    const contextPrefix = productContext ? `${productContext} ` : ''
    const transparentSuffix = transparentBg ? ', transparent background, PNG with alpha channel, no background, isolated subject' : ', full scene, zoomed out, complete composition, nothing cut off at edges'
    const cleanPrompt = contextPrefix + sanitizePrompt(prompt) + transparentSuffix

    let b64: string | undefined
    let imageUrl: string | undefined

    if (body.referenceImage) {
      // Reference image mode — use images.edit() to incorporate user's photo
      console.log('Using reference image mode')
      const matches = body.referenceImage.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!matches) throw new Error('Invalid image format')
      const mimeType = matches[1]
      const base64Data = matches[2]
      const buffer = Buffer.from(base64Data, 'base64')

      // OpenAI requires a proper File object — use toFile helper from openai SDK
      const { toFile } = await import('openai')
      const file = await toFile(buffer, 'reference.png', { type: 'image/png' })

      const response = await openai.images.edit({
        model: 'gpt-image-2.5-sunburst',
        image: file,
        prompt: cleanPrompt,
        n: 1,
        size: `${aiWidth}x${aiHeight}` as any,
      })
      b64 = response.data?.[0]?.b64_json
      imageUrl = response.data?.[0]?.url
    } else {
      // Standard generation mode
      const response = await openai.images.generate({
        model: 'gpt-image-2.5-sunburst',
        prompt: cleanPrompt,
        n: 1,
        size: `${aiWidth}x${aiHeight}` as any,
        quality: 'high',
        ...(transparentBg && { background: 'transparent' }),
      })
      b64 = response.data?.[0]?.b64_json
      imageUrl = response.data?.[0]?.url
    }

    if (!b64 && !imageUrl) {
      return NextResponse.json({ error: 'No image returned from AI' }, { status: 500 })
    }

    // Upload to Supabase temp storage so mockup API can use a URL
    // (avoids FUNCTION_PAYLOAD_TOO_LARGE when passing large base64 to mockup route)
    const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    tempPath = `temp/${id}.png`

    let buffer: Buffer
    if (b64) {
      buffer = Buffer.from(b64, 'base64')
    } else {
      const imgRes = await fetch(imageUrl!)
      buffer = Buffer.from(await imgRes.arrayBuffer())
    }

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(tempPath, buffer, { contentType: 'image/png', upsert: false })

    if (uploadError) {
      console.error('Supabase temp upload error:', uploadError)
      // Fall back to base64 if upload fails
      const fallbackUrl = b64 ? `data:image/png;base64,${b64}` : imageUrl!
      return NextResponse.json({ imageUrl: fallbackUrl, tempPath: null, size: `${aiWidth}x${aiHeight}` })
    }

    const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(tempPath)

    console.log(`Image uploaded to temp: ${tempPath}`)

    // Return Supabase URL for both display and mockup
    // Temp file is deleted on user reset or after session ends
    return NextResponse.json({
      imageUrl: publicUrl,
      mockupImageUrl: publicUrl,
      tempPath,
      size: `${aiWidth}x${aiHeight}`
    })

  } catch (error: any) {
    // Clean up temp file if something went wrong
    if (tempPath) {
      await supabase.storage.from('designs').remove([tempPath]).catch(() => {})
    }

    console.error('Generate error:', error?.message || error)

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