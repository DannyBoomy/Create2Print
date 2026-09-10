import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

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
    if (!productId) throw new Error('Product creation failed')

    // Log the full images array from creation response
    const allImages = productRes.data?.images || []
    console.log('=== PRINTIFY MOCKUP DEBUG ===')
    console.log('Total images returned:', allImages.length)
    allImages.forEach((img: any, i: number) => {
      console.log(`Image ${i + 1}: position=${img.position}, is_default=${img.is_default}`)
      console.log(`  src: ${img.src}`)
    })

    // Get all unique mockup URLs immediately — no polling needed
    const mockupUrls: string[] = allImages
      .filter((img: any) => img?.src)
      .map((img: any) => img.src as string)
      .filter((url: string, idx: number, arr: string[]) => arr.indexOf(url) === idx)

    console.log('Unique mockup URLs:', mockupUrls.length)
    console.log('============================')

    // Clean up temp product
    await axios.delete(
      `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    ).catch(() => {})

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