import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  
  // Basic protection so random people can't hit this
  if (secret !== process.env.POPULATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get all enabled products from allowlist
    const { data: allowlist, error: allowlistError } = await supabase
      .from('product_allowlist')
      .select('*')
      .eq('enabled', true)
      .order('display_order')

    if (allowlistError) throw allowlistError

    const results = []

    for (const product of allowlist) {
      const { blueprint_id, provider_id } = product

      try {
        const headers = { Authorization: `Bearer ${API_KEY}` }

        // Fetch blueprint info, variants, and print areas in parallel
        const [blueprintRes, variantsRes, printAreasRes] = await Promise.allSettled([
          axios.get(`${PRINTIFY_API}/catalog/blueprints/${blueprint_id}.json`, { headers }),
          axios.get(`${PRINTIFY_API}/catalog/blueprints/${blueprint_id}/print_providers/${provider_id}/variants.json`, { headers }),
          axios.get(`${PRINTIFY_API}/catalog/blueprints/${blueprint_id}/print_providers/${provider_id}/print_areas.json`, { headers }),
        ])

        const blueprint = blueprintRes.status === 'fulfilled' ? blueprintRes.value.data : null
        const variantsData = variantsRes.status === 'fulfilled' ? variantsRes.value.data : null
        const printAreasData = printAreasRes.status === 'fulfilled' ? printAreasRes.value.data : null

        // Process variants
        const allVariants = (variantsData?.variants || []).filter((v: any) => v.is_available !== false)

        // Map print areas to variants
        const printAreaMap = new Map()
        if (printAreasData?.variants) {
          for (const v of printAreasData.variants) {
            printAreaMap.set(v.id, v.placeholders || [])
          }
        }

        const variants = allVariants.map((v: any) => ({
          id: v.id,
          title: v.title,
          options: v.options,
          cost: v.cost,
          placeholders: printAreaMap.get(v.id) || [],
        }))

        // Extract unique colors and sizes
        const colors = Array.from(new Set(variants.map((v: any) => v.options?.color).filter(Boolean)))
        const sizes = Array.from(new Set(variants.map((v: any) => v.options?.size || v.options?.size).filter(Boolean)))
        const finishes = Array.from(new Set(variants.map((v: any) => v.options?.finish || v.options?.paper || v.options?.surface).filter(Boolean)))

        // Upsert into product_catalog
        const { error: upsertError } = await supabase
          .from('product_catalog')
          .upsert({
            blueprint_id,
            provider_id,
            title: blueprint?.title || `Blueprint ${blueprint_id}`,
            description: blueprint?.description || '',
            images: blueprint?.images?.slice(0, 2) || [],
            variants,
            colors,
            sizes,
            finishes,
            print_areas: printAreasData || null,
            last_updated: new Date().toISOString(),
          }, { onConflict: 'blueprint_id,provider_id' })

        if (upsertError) {
          results.push({ blueprint_id, provider_id, status: 'error', error: upsertError.message })
        } else {
          results.push({ blueprint_id, provider_id, status: 'ok', title: blueprint?.title, variantCount: variants.length })
        }

        await delay(300) // Avoid rate limiting
      } catch (e: any) {
        results.push({ blueprint_id, provider_id, status: 'error', error: e?.response?.data || e?.message })
      }
    }

    return NextResponse.json({ total: allowlist.length, results })

  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}