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

    // Upload image to Supabase Storage
    const base64Data = imageBase64.startsWith('data:')
      ? imageBase64.split(',')[1]
      : imageBase64
    const buffer = Buffer.from(base64Data, 'base64')

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('designs')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // Save share record to database
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 day auto-delete

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

    if (dbError) throw dbError

    return NextResponse.json({
      shareId,
      shareUrl: `${process.env.NEXTAUTH_URL}/design/${shareId}`,
      imageUrl,
    })

  } catch (error: any) {
    console.error('Share error:', error)
    return NextResponse.json({ error: error.message || 'Share failed' }, { status: 500 })
  }
}