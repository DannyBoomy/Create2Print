import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

export async function GET(req: NextRequest) {
  try {
    // Get all products in your shop
    const res = await axios.get(
      `${PRINTIFY_API}/shops/${SHOP_ID}/products.json`,
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    )

    const products = res.data?.data || []
    const results: any = []

    for (const product of products) {
      const productInfo: any = {
        title: product.title,
        blueprint_id: product.blueprint_id,
        variants: []
      }

      for (const variant of product.variants || []) {
        productInfo.variants.push({
          id: variant.id,
          title: variant.title,
          cost: variant.cost,
          costFormatted: variant.cost ? `$${(variant.cost / 100).toFixed(2)}` : 'N/A',
          yourPrice: variant.cost ? `$${Math.round(variant.cost * 1.35 / 100)}` : 'N/A',
          yourPriceCents: variant.cost ? Math.round(variant.cost * 1.35) : null,
          is_enabled: variant.is_enabled,
        })
      }

      results.push(productInfo)
    }

    return NextResponse.json(results)
  } catch (err: any) {
    return NextResponse.json({ error: err?.response?.data || err?.message }, { status: 500 })
  }
}
