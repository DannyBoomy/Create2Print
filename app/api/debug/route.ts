import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

export async function GET(req: NextRequest) {
  try {
    let allProducts: any[] = []
    let page = 1
    let hasMore = true

    // Paginate through all products
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

    // For each product fetch shipping profile
    const results = await Promise.all(allProducts.map(async (product) => {
      // Fetch shipping info for this blueprint + provider
      let shippingInfo: any = null
      try {
        const shippingRes = await axios.get(
          `${PRINTIFY_API}/catalog/blueprints/${product.blueprint_id}/print_providers/${product.print_provider_id}/shipping.json`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        )
        shippingInfo = shippingRes.data
      } catch (e) {
        shippingInfo = null
      }

      // Extract US shipping costs
      const usShipping = shippingInfo?.profiles?.find((p: any) =>
        p.countries?.includes('US') || p.rest_of_the_world
      )

      const firstShipping = usShipping?.first_item?.cost
      const additionalShipping = usShipping?.additional_items?.cost

      return {
        title: product.title,
        blueprint_id: product.blueprint_id,
        print_provider_id: product.print_provider_id,
        shipping: {
          first_item_cents: firstShipping || null,
          first_item_formatted: firstShipping ? `$${(firstShipping / 100).toFixed(2)}` : 'N/A',
          additional_item_cents: additionalShipping || null,
          additional_item_formatted: additionalShipping ? `$${(additionalShipping / 100).toFixed(2)}` : 'N/A',
        },
        variants: (product.variants || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          cost: v.cost,
          costFormatted: v.cost ? `$${(v.cost / 100).toFixed(2)}` : 'N/A',
          shippingFirst: firstShipping ? `$${(firstShipping / 100).toFixed(2)}` : 'N/A',
          shippingAdditional: additionalShipping ? `$${(additionalShipping / 100).toFixed(2)}` : 'N/A',
          totalCost: (v.cost && firstShipping) ? `$${((v.cost + firstShipping) / 100).toFixed(2)}` : 'N/A',
          is_enabled: v.is_enabled,
        }))
      }
    }))

    return NextResponse.json({ total: allProducts.length, products: results })

  } catch (err: any) {
    return NextResponse.json({ error: err?.response?.data || err?.message }, { status: 500 })
  }
}