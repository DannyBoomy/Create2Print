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

    const results = allProducts.map(product => ({
      title: product.title,
      blueprint_id: product.blueprint_id,
      print_provider_id: product.print_provider_id,
      variants: (product.variants || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        cost: v.cost,
        costFormatted: v.cost ? `$${(v.cost / 100).toFixed(2)}` : 'N/A',
        yourPrice: v.cost ? `$${Math.round(v.cost * 1.35 / 100)}` : 'N/A',
        yourPriceCents: v.cost ? Math.round(v.cost * 1.35) : null,
        is_enabled: v.is_enabled,
      }))
    }))

    return NextResponse.json({ total: allProducts.length, products: results })

  } catch (err: any) {
    return NextResponse.json({ error: err?.response?.data || err?.message }, { status: 500 })
  }
}