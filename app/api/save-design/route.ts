import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { imageBase64, prompt, productId, productName, sizeLabel, color, finish, variantId, price } = await req.json()

    // Upload image to Supabase storage
    const id = Math.random().toString(36).slice(2, 10)
    const fileName = `saved/${session.user.email}/${id}.png`
    const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64')

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: false })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(fileName)

    // Insert record into saved_designs
    const { data, error: insertError } = await supabase
      .from('saved_designs')
      .insert({
        user_id: session.user.email,
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