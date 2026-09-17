import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function generateId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

export async function POST(req: NextRequest) {
  try {
    // Log env vars (masked) to confirm they're loaded
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
    console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const body = await req.json()
    const { imageBase64, prompt, productId, productName, sizeName, variantId } = body

    console.log('Share request received for product:', productName)
    console.log('Image type:', imageBase64?.startsWith('data:') ? 'base64' : 'url')
    }

    const shareId = generateId()
    const fileName = `${shareId}.png`
    let imageUrl: string

    if (imageBase64.startsWith('data:')) {
      console.log('Uploading base64 image to Supabase storage...')
      const base64Data = imageBase64.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('designs')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', JSON.stringify(uploadError))
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
      }

      console.log('Upload successful:', uploadData)
      const { data: urlData } = supabase.storage.from('designs').getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
      console.log('Public URL:', imageUrl)
    } else {
      // Already a URL
      imageUrl = imageBase64
      console.log('Using existing URL:', imageUrl.substring(0, 60))
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    console.log('Inserting share record...')
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
      console.error('DB insert error:', JSON.stringify(dbError))
      return NextResponse.json({ error: `DB error: ${dbError.message}` }, { status: 500 })
    }

    const shareUrl = `${process.env.NEXTAUTH_URL}/design/${shareId}`
    console.log('Share created successfully:', shareUrl)

    return NextResponse.json({ shareId, shareUrl, imageUrl })

  } catch (error: any) {
    console.error('Unexpected share error:', error?.message, error?.stack)
    return NextResponse.json({ error: error?.message || 'Share failed' }, { status: 500 })
  }
}