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

async function uploadImageToPrintify(imageUrl: string, label: string): Promise<string> {
  const uploadPayload = imageUrl.startsWith('data:')
    ? { file_name: `c2p-${label}-${Date.now()}.png`, contents: imageUrl.split(',')[1] }
    : { file_name: `c2p-${label}-${Date.now()}.png`, url: imageUrl }

  const res = await axios.post(
    `${PRINTIFY_API}/uploads/images.json`,
    uploadPayload,
    { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
  )
  if (!res.data?.id) throw new Error(`Upload failed for ${label}`)
  return res.data.id
}

export async function POST(req: NextRequest) {
  let productId: string | null = null

  try {
    const { imageUrl, blueprintId, printProviderId, variantId, tempPath, printAreaPosition, printAreaImages } = await req.json()

    console.log('MOCKUP REQUEST - blueprintId:', blueprintId, 'variantId:', variantId, 'areas:', printAreaImages ? Object.keys(printAreaImages) : ['front'])

    const scale = 1.0
    let placeholders: any[] = []

    if (printAreaImages && Object.keys(printAreaImages).length > 1) {
      // Multi-area: upload each area's image separately
      console.log('Multi-area mockup — uploading', Object.keys(printAreaImages).length, 'images')

      const uploadResults = await Promise.all(
        Object.entries(printAreaImages).map(async ([position, url]: [string, any]) => {
          try {
            const imageId = await uploadImageToPrintify(url, position)
            console.log(`Uploaded ${position}:`, imageId)
            return { position, imageId }
          } catch (e: any) {
            console.error(`Failed to upload ${position}:`, e?.response?.data || e?.message)
            return { position, imageId: null }
          }
        })
      )

      placeholders = uploadResults
        .filter(u => u.imageId)
        .map(u => ({
          position: u.position,
          images: [{ id: u.imageId, x: 0.5, y: 0.5, scale, angle: 0 }]
        }))

      console.log('Placeholders built:', placeholders.map(p => p.position))
    } else {
      // Single area — upload main image
      const printifyImageId = await uploadImageToPrintify(imageUrl, 'front')
      console.log('Single area upload success, image ID:', printifyImageId)
      const position = printAreaPosition || 'front'
      placeholders = [{ position, images: [{ id: printifyImageId, x: 0.5, y: 0.5, scale, angle: 0 }] }]
    }

    const payload = {
      title: 'Create2Print Preview',
      blueprint_id: Number(blueprintId),
      print_provider_id: Number(printProviderId),
      variants: [{ id: Number(variantId), price: 1000, is_enabled: true }],
      print_areas: [{ variant_ids: [Number(variantId)], placeholders }]
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

    console.log('Final mockup count:', mockupUrls.length)

    // Get primary image ID for reference (first area's upload)
    const primaryImageId = placeholders[0]?.images?.[0]?.id || null

    return NextResponse.json({ mockupUrl: mockupUrls[0] || null, mockupUrls, printifyImageId: primaryImageId })

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