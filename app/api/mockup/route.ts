import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  let productId: string | null = null

  try {
    const { imageUrl, blueprintId, printProviderId, variantId } = await req.json()

    // Step 1: Upload image to Printify
    const uploadRes = await axios.post(
      `${PRINTIFY_API}/uploads/images.json`,
      { file_name: `c2p-${Date.now()}.png`, url: imageUrl },
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    )

    const printifyImageId = uploadRes.data.id
    if (!printifyImageId) throw new Error('Image upload failed')

    // Step 2: Create temporary product
    const productRes = await axios.post(
      `${PRINTIFY_API}/shops/${SHOP_ID}/products.json`,
      {
        title: 'Create2Print Preview',
        blueprint_id: blueprintId,
        print_provider_id: printProviderId,
        variants: [{ id: variantId, price: 1000, is_enabled: true }],
        print_areas: [{
          variant_ids: [variantId],
          placeholders: [{
            position: 'front',
            images: [{ id: printifyImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }]
          }]
        }]
      },
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    )

    productId = productRes.data?.id

    // Log what Printify returned immediately
    const immediateImages = productRes.data?.images || []
    console.log(`Printify immediate images count: ${immediateImages.length}`)
    console.log('Image positions:', immediateImages.map((img: any) => img.position))

    // Step 3: Poll for mockups — wait up to 20 seconds
    let mockupUrls: string[] = []
    
    // First try immediate images
    if (immediateImages.length > 0) {
      mockupUrls = immediateImages
        .filter((img: any) => img?.src)
        .map((img: any) => img.src as string)
    }

    // If only 1, poll for more
    if (mockupUrls.length <= 1 && productId) {
      for (let attempt = 0; attempt < 8; attempt++) {
        await sleep(2500)
        try {
          const fetchRes = await axios.get(
            `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
            { headers: { Authorization: `Bearer ${API_KEY}` } }
          )
          const images = fetchRes.data?.images || []
          console.log(`Poll ${attempt + 1}: ${images.length} images`)
          
          if (images.length > mockupUrls.length) {
            mockupUrls = images
              .filter((img: any) => img?.src)
              .map((img: any) => img.src as string)
          }
          
          if (mockupUrls.length > 1) break
        } catch (pollErr) {
          console.log('Poll error:', pollErr)
        }
      }
    }

    // Step 4: Clean up temp product
    if (productId) {
      await axios.delete(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      ).catch(() => {})
    }

    console.log(`Final mockup count: ${mockupUrls.length}`)

    return NextResponse.json({
      mockupUrl: mockupUrls[0] || null,
      mockupUrls,
      printifyImageId
    })

  } catch (error: any) {
    if (productId) {
      await axios.delete(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      ).catch(() => {})
    }
    console.error('Mockup error:', error?.response?.data || error?.message)
    return NextResponse.json({ mockupUrl: null, mockupUrls: [], printifyImageId: null })
  }
}