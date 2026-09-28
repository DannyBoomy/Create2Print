import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const zipCode = searchParams.get('zip') || '10001'

    let allProducts: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const res = await axios.get(
        `${PRINTIFY_API}/shops/${SHOP_ID}/products.json?limit=50&page=${page}`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      )
      const products = res.data?.data || []
      allProducts = [...allProducts, ...products]
      hasMore = products.length === 50
      page++
    }

    const results = await Promise.all(allProducts.map(async (product) => {
      // Get enabled variants only
      const enabledVariants = (product.variants || []).filter((v: any) => v.is_enabled)

      // Fetch real per-variant shipping using shipping API
      const variantsWithShipping = await Promise.all(enabledVariants.map(async (v: any) => {
        let shippingCost = null
        let shippingFormatted = 'N/A'

        try {
          const shippingRes = await axios.post(
            `${PRINTIFY_API}/shops/${SHOP_ID}/orders/shipping.json`,
            {
              line_items: [{
                product_id: product.id,
                variant_id: v.id,
                quantity: 1
              }],
              address_to: {
                first_name: 'Test',
                last_name: 'User',
                email: 'test@test.com',
                phone: '555-555-5555',
                country: 'US',
                region: 'NY',
                address1: '123 Main St',
                city: 'New York',
                zip: zipCode
              }
            },
            { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
          )

          const shipping = shippingRes.data?.shipping
          if (shipping) {
            shippingCost = shipping.standard || shipping.express || null
            shippingFormatted = shippingCost ? `$${(shippingCost / 100).toFixed(2)}` : 'N/A'
          }
        } catch (e: any) {
          shippingFormatted = 'Error'
        }

        const totalCents = v.cost && shippingCost ? v.cost + shippingCost : null

        return {
          id: v.id,
          title: v.title,
          cost: v.cost,
          costFormatted: v.cost ? `$${(v.cost / 100).toFixed(2)}` : 'N/A',
          shippingCents: shippingCost,
          shippingFormatted,
          totalCost: totalCents ? `$${(totalCents / 100).toFixed(2)}` : 'N/A',
          totalCents,
        }
      }))

      return {
        title: product.title,
        blueprint_id: product.blueprint_id,
        print_provider_id: product.print_provider_id,
        product_id: product.id,
        variants: variantsWithShipping
      }
    }))

    return NextResponse.json({ total: allProducts.length, zip: zipCode, products: results })

  } catch (err: any) {
    return NextResponse.json({ error: err?.response?.data || err?.message }, { status: 500 })
  }
}