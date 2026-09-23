import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  let productId: string | null = null

  try {
    const { imageUrl, blueprintId, printProviderId, variantId, tempPath } = await req.json()

    console.log('MOCKUP REQUEST - blueprintId:', blueprintId, 'variantId:', variantId)
    console.log('Image type:', imageUrl?.startsWith('data:') ? 'base64' : 'URL')

    // Upload image to Printify
    let uploadPayload: any
    if (imageUrl && imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1]
      uploadPayload = { file_name: `c2p-${Date.now()}.png`, contents: base64Data }
    } else {
      uploadPayload = { file_name: `c2p-${Date.now()}.png`, url: imageUrl }
    }

    const uploadRes = await axios.post(
      `${PRINTIFY_API}/uploads/images.json`,
      uploadPayload,
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    )

    const printifyImageId = uploadRes.data.id
    if (!printifyImageId) throw new Error('Image upload failed')
    console.log('Upload success, image ID:', printifyImageId)

    const scale = Number(blueprintId) === 944 ? 1.1 : 1.1

    const payload = {
      title: 'Create2Print Preview',
      blueprint_id: Number(blueprintId),
      print_provider_id: Number(printProviderId),
      variants: [{ id: Number(variantId), price: 1000, is_enabled: true }],
      print_areas: [{
        variant_ids: [Number(variantId)],
        placeholders: [{
          position: 'front',
          images: [{ id: printifyImageId, x: 0.5, y: 0.5, scale, angle: 0 }]
        }]
      }]
    }

    const productRes = await axios.post(
      `${PRINTIFY_API}/shops/${SHOP_ID}/products.json`,
      payload,
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    )

    productId = productRes.data?.id
    const allImages = productRes.data?.images || []
    console.log('Product created! ID:', productId, '| Images:', allImages.length)

    const mockupUrls = allImages
      .filter((img: any) => img?.src)
      .map((img: any) => img.src as string)
      .filter((url: string, i: number, arr: string[]) => arr.indexOf(url) === i)

    // Delete temp product from Printify
    if (productId) {
      await axios.delete(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      ).catch(() => {})
    }

    // Note: temp file stays in Supabase so image 1 in carousel keeps working
    // It gets deleted when user resets via /api/delete-temp

    console.log('Final mockup count:', mockupUrls.length)

    return NextResponse.json({ mockupUrl: mockupUrls[0] || null, mockupUrls, printifyImageId })

  } catch (error: any) {
    if (productId) {
      await axios.delete(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      ).catch(() => {})
    }
    console.error('MOCKUP ERROR:', JSON.stringify(error?.response?.data || error?.message, null, 2))
    return NextResponse.json({ mockupUrl: null, mockupUrls: [], printifyImageId: null })
  }
}