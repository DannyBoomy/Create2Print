import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getToken } from 'next-auth/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchAndUpload(url: string, fileName: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const { error } = await supabase.storage.from('designs').upload(fileName, buffer, { contentType: 'image/png', upsert: false })
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(fileName)
  return publicUrl
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.email) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { imageUrl, imageBase64, prompt, productId, productName, sizeLabel, color, finish, variantId, price, printAreaImages, mockupUrls } = await req.json()

    const id = Math.random().toString(36).slice(2, 10)
    const fileName = `saved/${token.email}/${id}.png`

    // Save front image
    let publicUrl: string
    if (imageBase64) {
      const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      const { error } = await supabase.storage.from('designs').upload(fileName, buffer, { contentType: 'image/png', upsert: false })
      if (error) throw error
      const { data: { publicUrl: url } } = supabase.storage.from('designs').getPublicUrl(fileName)
      publicUrl = url
    } else if (imageUrl) {
      publicUrl = await fetchAndUpload(imageUrl, fileName)
    } else {
      throw new Error('No image provided')
    }

    // Save each non-front print area image to permanent storage
    let savedPrintAreaImages: Record<string, string> | null = null
    if (printAreaImages && Object.keys(printAreaImages).length > 1) {
      savedPrintAreaImages = {}
      for (const [position, url] of Object.entries(printAreaImages as Record<string, string>)) {
        if (position === 'front') {
          savedPrintAreaImages[position] = publicUrl
          continue
        }
        try {
          const areaFileName = `saved/${token.email}/${id}-${position}.png`
          // URL is a Supabase temp URL — fetch and re-upload to permanent storage
          savedPrintAreaImages[position] = await fetchAndUpload(url, areaFileName)
          console.log(`Saved ${position} to permanent storage`)
        } catch (e) {
          console.error(`Failed to save ${position} image:`, e)
        }
      }
    }

    const { data, error: insertError } = await supabase
      .from('saved_designs')
      .insert({
        user_id: token.email,
        image_url: publicUrl,
        prompt,
        product_id: productId,
        product_name: productName,
        size_label: sizeLabel,
        color: color || null,
        finish: finish || null,
        variant_id: variantId,
        price,
        print_area_images: savedPrintAreaImages,
        mockup_urls: mockupUrls || null,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    console.error('Save design error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}