import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

export async function POST(req: NextRequest) {
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

    // Step 2: Create a temporary product to get mockups
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

    // Get ALL mockup images, not just the first one
    const mockupImages = productRes.data?.images || []
    const mockupUrls = mockupImages
      .filter((img: any) => img?.src)
      .map((img: any) => img.src)

    // Clean up temp product
    if (productRes.data?.id) {
      await axios.delete(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productRes.data.id}.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      ).catch(() => {})
    }

    return NextResponse.json({
      mockupUrl: mockupUrls[0] || null,   // first image for backwards compat
      mockupUrls,                          // all images for carousel
      printifyImageId
    })

  } catch (error: any) {
    console.error('Mockup error:', error?.response?.data || error)
    return NextResponse.json({ mockupUrl: null, mockupUrls: [], printifyImageId: null })
  }
}