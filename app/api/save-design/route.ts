import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getToken } from 'next-auth/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.email) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { imageUrl, imageBase64, prompt, productId, productName, sizeLabel, color, finish, variantId, price } = await req.json()

    const id = Math.random().toString(36).slice(2, 10)
    const fileName = `saved/${token.email}/${id}.png`

    let buffer: Buffer

    if (imageBase64) {
      // Legacy base64 path
      buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    } else if (imageUrl) {
      // New path — image is a Supabase URL, fetch it and re-upload permanently
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error('Failed to fetch image from URL')
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      throw new Error('No image provided')
    }

    // Upload to permanent saved/ folder
    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(fileName)

    // Insert record
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