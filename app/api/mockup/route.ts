import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

export async function POST(req: NextRequest) {
  let productId: string | null = null

  try {
    const { imageUrl, blueprintId, printProviderId, variantId } = await req.json()

    console.log('MOCKUP REQUEST - blueprintId:', blueprintId, 'variantId:', variantId)
    console.log('Image type:', imageUrl?.startsWith('data:') ? 'base64' : 'https URL')

    // Step 1: Upload image to Printify
    // Printify requires either a real https:// URL or raw base64 via 'contents' field
    // data: URLs are NOT valid — must strip the prefix for base64
    let uploadPayload: any
    if (imageUrl && imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1]
      uploadPayload = {
        file_name: `c2p-${Date.now()}.png`,
        contents: base64Data,
      }
      console.log('Uploading via base64 contents field')
    } else {
      uploadPayload = {
        file_name: `c2p-${Date.now()}.png`,
        url: imageUrl,
      }
      console.log('Uploading via URL field')
    }

    const uploadRes = await axios.post(
      `${PRINTIFY_API}/uploads/images.json`,
      uploadPayload,
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    )

    const printifyImageId = uploadRes.data.id
    console.log('Upload success, image ID:', printifyImageId)
    if (!printifyImageId) throw new Error('Image upload failed')

    // Step 2: Create temporary product to get mockups
    const payload = {
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

    const productRes = await axios.post(
      `${PRINTIFY_API}/shops/${SHOP_ID}/products.json`,
      payload,
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    )

    productId = productRes.data?.id
    const allImages = productRes.data?.images || []
    console.log('Product created! ID:', productId, '| Images returned:', allImages.length)
    allImages.forEach((img: any, i: number) => {
      console.log(`  [${i}] position=${img.position} src=${img.src}`)
    })

    const mockupUrls = allImages
      .filter((img: any) => img?.src)
      .map((img: any) => img.src as string)
      .filter((url: string, i: number, arr: string[]) => arr.indexOf(url) === i)

    // Clean up temp product
    if (productId) {
      await axios.delete(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products/${productId}.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      ).catch(() => {})
    }

    console.log('Final mockup count:', mockupUrls.length)

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
    console.error('MOCKUP ERROR:', JSON.stringify(error?.response?.data || error?.message, null, 2))
    return NextResponse.json({ mockupUrl: null, mockupUrls: [], printifyImageId: null })
  }
}