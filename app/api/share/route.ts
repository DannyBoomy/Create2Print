import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, prompt, productId, productName, sizeName, variantId } = await req.json()

    const shareId = generateId()
    const fileName = `${shareId}.png`

    // Handle both base64 data URLs and regular URLs
    let imageUrl: string

    if (imageBase64.startsWith('data:')) {
      // Upload base64 image to Supabase
      const base64Data = imageBase64.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')

      const { error: uploadError } = await supabase.storage
        .from('designs')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('designs')
        .getPublicUrl(fileName)

      imageUrl = urlData.publicUrl
    } else {
      // It's already a URL (from OpenAI) — store it directly
      imageUrl = imageBase64
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: dbError } = await supabase
      .from('shares')
      .insert({
        id: shareId,
        image_url: imageUrl,
        file_name: fileName,
        prompt,
        product_id: productId,
        product_name: productName,
        size_name: sizeName,
        variant_id: variantId,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('DB error:', dbError)
      throw dbError
    }

    const shareUrl = `${process.env.NEXTAUTH_URL}/design/${shareId}`
    console.log('Share created:', shareId, shareUrl)

    return NextResponse.json({ shareId, shareUrl, imageUrl })

  } catch (error: any) {
    console.error('Share error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message || 'Share failed' }, { status: 500 })
  }
}