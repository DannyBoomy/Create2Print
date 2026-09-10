import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

export async function POST(req: NextRequest) {
  let productId: string | null = null

  try {
    const { imageUrl, blueprintId, printProviderId, variantId } = await req.json()

    console.log('=== MOCKUP REQUEST ===')
    console.log('blueprintId:', blueprintId)
    console.log('printProviderId:', printProviderId)
    console.log('variantId:', variantId)
    console.log('imageUrl:', imageUrl?.substring(0, 80))

    // Step 1: Upload image to Printify
    const uploadRes = await axios.post(
      `${PRINTIFY_API}/uploads/images.json`,
      { file_name: `c2p-${Date.now()}.png`, url: imageUrl },
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    )

    const printifyImageId = uploadRes.data.id
    console.log('Uploaded image ID:', printifyImageId)
    if (!printifyImageId) throw new Error('Image upload failed')

    // Step 2: Create temporary product
    const productPayload = {
      title: 'Create2Print Preview',
      blueprint_id: Number(blueprintId),
      print_provider_id: Number(printProviderId),
      variants: [{ id: Number(variantId), price: 1000, is_enabled: true }],
      print_areas: [{
        variant_ids: [Number(variantId)],
        placeholders: [{
          position: 'front',
          images: [{ id: printifyImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }]
        }]
      }]
    }

    console.log('Product payload:', JSON.stringify(productPayload, null, 2))

    let productRes
    try {
      productRes = await axios.post(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products.json`,
        productPayload,
        { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
      )
    } catch (createErr: any) {
      console.error('Product creation error:', JSON.stringify(createErr?.response?.data, null, 2))
      throw createErr
    }

    productId = productRes.data?.id
    if (!productId) throw new Error('Product creation failed — no ID returned')

    const allImages = productRes.data?.images || []
    console.log('=== PRINTIFY MOCKUP DEBUG ===')
    console.log('Total images returned:', allImages.length)
    allImages.forEach((img: any, i: number) => {
      console.log(`Image ${i + 1}: position=${img.position}, is_default=${img.is_default}, src=${img.src}`)
    })
    console.log('============================')

    const mockupUrls: string[] = allImages
      .filter((img: any) => img?.src)
      .map((img: any) => img.src as string)
      .filter((url: string, idx: number, arr: string[]) => arr.indexOf(url) === idx)

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
    console.error('Mockup error:', JSON.stringify(error?.response?.data || error?.message, null, 2))
    return NextResponse.json({ mockupUrl: null, mockupUrls: [], printifyImageId: null })
  }
}
