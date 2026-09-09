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

    // Step 3: Wait for Printify to generate mockups, then fetch the product again
    // Printify generates mockups asynchronously — we poll until we get multiple images
    let mockupUrls: string[] = []
    let attempts = 0
    const maxAttempts = 6

    while (attempts < maxAttempts) {
      await sleep(2000) // wait 2 seconds between polls

      try {
        const fetchRes = await axios.get(
          `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        )

        const images = fetchRes.data?.images || []
        const urls = images.filter((img: any) => img?.src).map((img: any) => img.src as string)

        if (urls.length > 1) {
          mockupUrls = urls
          break
        } else if (urls.length === 1) {
          mockupUrls = urls // at least have one
        }
      } catch {}

      attempts++
    }

    // Fallback: use images from product creation response if polling yielded nothing
    if (mockupUrls.length === 0) {
      const creationImages = productRes.data?.images || []
      mockupUrls = creationImages.filter((img: any) => img?.src).map((img: any) => img.src as string)
    }

    // Step 4: Clean up temp product
    if (productId) {
      await axios.delete(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      ).catch(() => {})
    }

    return NextResponse.json({
      mockupUrl: mockupUrls[0] || null,
      mockupUrls,
      printifyImageId
    })

  } catch (error: any) {
    // Clean up product if created before error
    if (productId) {
      await axios.delete(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      ).catch(() => {})
    }
    console.error('Mockup error:', error?.response?.data || error)
    return NextResponse.json({ mockupUrl: null, mockupUrls: [], printifyImageId: null })
  }
}