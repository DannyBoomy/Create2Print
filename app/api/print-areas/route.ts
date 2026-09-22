import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY

// Your 4 products: blueprint_id → print_provider_id
const PRODUCTS_TO_CHECK = [
  { name: 'Rolled Poster',   blueprintId: 1220, providerId: 99 },
  { name: 'Matte Canvas',    blueprintId: 1159, providerId: 99 },
  { name: 'Framed Canvas',   blueprintId: 944,  providerId: 99 },
  { name: 'Wall Tapestry',   blueprintId: 241,  providerId: 99 },
]

// Only these variant IDs — the ones actually on your site
const TARGET_VARIANT_IDS = new Set([
  // Rolled Poster
  101878, 101880, 101888, 101893,
  92393, 92395, 92401, 92407,
  92392, 92394, 92400, 92406,
  // Matte Canvas
  101413, 91643, 91646, 91649,
  // Framed Canvas
  111821, 88292, 88293, 88294,
  111824, 107253, 107255, 107257,
  111822, 107252, 107254, 107256,
  244025, 244029, 244032, 244036,
  // Wall Tapestry
  41686, 41687, 45130,
])

export async function GET(req: NextRequest) {
  try {
    const results: any[] = []

    for (const product of PRODUCTS_TO_CHECK) {
      const res = await axios.get(
        `${PRINTIFY_API}/catalog/blueprints/${product.blueprintId}/print_providers/${product.providerId}/variants.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      )

      const variants = res.data?.variants || []

      for (const variant of variants) {
        if (!TARGET_VARIANT_IDS.has(variant.id)) continue
        results.push({
          product: product.name,
          blueprintId: product.blueprintId,
          variantId: variant.id,
          title: variant.title,
          printAreaWidth: variant.print_area_width,
          printAreaHeight: variant.print_area_height,
          widthPx: variant.print_area_width,
          heightPx: variant.print_area_height,
          aspectRatio: variant.print_area_width && variant.print_area_height
            ? `${(variant.print_area_width / variant.print_area_height).toFixed(3)}`
            : 'unknown',
        })
      }
    }

    return NextResponse.json({ count: results.length, variants: results })

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response?.data || err?.message },
      { status: 500 }
    )
  }
}