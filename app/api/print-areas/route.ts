import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const blueprintParam = searchParams.get('blueprint')

    // Single blueprint mode
    if (blueprintParam) {
      const providerId = searchParams.get('provider')

      if (!providerId) {
        // First find available providers for this blueprint
        const providersRes = await axios.get(
          `${PRINTIFY_API}/catalog/blueprints/${blueprintParam}/print_providers.json`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        )
        const providers = providersRes.data || []
        return NextResponse.json({
          blueprint: blueprintParam,
          availableProviders: providers.map((p: any) => ({ id: p.id, title: p.title, location: p.location })),
          hint: `Use ?blueprint=${blueprintParam}&provider=ID to get variants`
        })
      }

      // Fetch print areas (includes placeholder positions and dimensions per variant)
      const res = await axios.get(
        `${PRINTIFY_API}/catalog/blueprints/${blueprintParam}/print_providers/${providerId}/print_areas.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      )
      return NextResponse.json(res.data)
    }

    // All products mode — get everything in one shot
    // Step 1: Get all shop products
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

    // Step 2: For each unique blueprint+provider combo, get print area dimensions
    const seen = new Set<string>()
    const results: any[] = []

    for (const product of allProducts) {
      const blueprintId = product.blueprint_id
      const providerId = product.print_provider_id
      const key = `${blueprintId}-${providerId}`

      if (seen.has(key)) continue
      seen.add(key)

      try {
        const catalogRes = await axios.get(
          `${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        )

        const catalogVariants = catalogRes.data?.variants || []

        // Match shop variants with catalog variants to get print areas
        const shopVariants = product.variants || []
        const matchedVariants = shopVariants
          .filter((v: any) => v.is_enabled)
          .map((v: any) => {
            const catalogVariant = catalogVariants.find((cv: any) => cv.id === v.id)
            const placeholder = catalogVariant?.placeholders?.[0]
            return {
              id: v.id,
              title: v.title,
              cost: v.cost,
              costFormatted: v.cost ? `$${(v.cost / 100).toFixed(2)}` : 'N/A',
              printAreaWidth: placeholder?.width || null,
              printAreaHeight: placeholder?.height || null,
              options: v.options,
            }
          })

        results.push({
          title: product.title,
          blueprintId,
          providerId,
          variants: matchedVariants,
        })
      } catch (err: any) {
        results.push({
          title: product.title,
          blueprintId,
          providerId,
          error: err?.message,
        })
      }
    }

    return NextResponse.json({
      total: results.length,
      products: results,
    })

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response?.data || err?.message },
      { status: 500 }
    )
  }
}