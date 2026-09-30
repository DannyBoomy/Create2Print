import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In-memory cache — persists across requests on same Vercel instance
let cachedProducts: any[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bust = searchParams.get('bust') === '1'

  // Return cached products if fresh
  if (!bust && cachedProducts && Date.now() - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json({ products: cachedProducts, cached: true })
  }
  try {
    const [allowlistRes, catalogRes] = await Promise.all([
      supabase.from('product_allowlist').select('*').eq('enabled', true).order('display_order'),
      supabase.from('product_catalog').select('*'),
    ])

    if (allowlistRes.error) throw allowlistRes.error
    if (catalogRes.error) throw catalogRes.error

    const allowlist = allowlistRes.data || []
    const catalog = catalogRes.data || []

    const catalogMap = new Map<string, any>()
    for (const item of catalog) {
      catalogMap.set(`${item.blueprint_id}-${item.provider_id}`, item)
    }

    // Fetch print areas for all products in parallel
    const printAreaResults = await Promise.allSettled(
      allowlist.map(row =>
        axios.get(
          `${PRINTIFY_API}/catalog/blueprints/${row.blueprint_id}/print_providers/${row.provider_id}/print_areas.json`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        ).then(res => ({ key: `${row.blueprint_id}-${row.provider_id}`, data: res.data }))
      )
    )

    // Build print area map keyed by blueprint-provider, then by variant ID
    const printAreaMap = new Map<string, Map<number, any[]>>()
    for (const result of printAreaResults) {
      if (result.status === 'fulfilled') {
        const { key, data } = result.value
        const variantMap = new Map<number, any[]>()
        for (const v of data?.variants || []) {
          variantMap.set(v.id, v.placeholders || [])
        }
        printAreaMap.set(key, variantMap)
      }
    }

    const products = allowlist.map((row: any) => {
      const cat = catalogMap.get(`${row.blueprint_id}-${row.provider_id}`)
      if (!cat) return null

      const variants = cat.variants || []
      const variantPlaceholders = printAreaMap.get(`${row.blueprint_id}-${row.provider_id}`)

      // Group by color → finish → sizes
      const colorMap = new Map<string, Map<string, any[]>>()
      for (const v of variants) {
        const color = v.options?.color || 'Default'
        const finish = v.options?.finish || v.options?.paper || v.options?.surface || 'Standard'
        if (!colorMap.has(color)) colorMap.set(color, new Map())
        const finishMap = colorMap.get(color)!
        if (!finishMap.has(finish)) finishMap.set(finish, [])
        finishMap.get(finish)!.push(v)
      }

      const colors = Array.from(colorMap.entries()).map(([colorLabel, finishMapInner]) => {
        const finishes = Array.from(finishMapInner.entries()).map(([finishLabel, finishVariants]) => {
          const sizes = finishVariants.map((v: any) => {
            // Get real placeholder data from Printify API
            const placeholders = variantPlaceholders?.get(v.id) || []
            const frontPlaceholder = placeholders.find((p: any) => p.position === 'front') || placeholders[0] || null

            const pw = frontPlaceholder?.width || 3000
            const ph = frontPlaceholder?.height || 3000

            const productionCents = v.cost || 0
            const shippingCents = row.shipping_cents || 0
            const prodWithPremium = Math.round(productionCents * 0.8)
            const retailCents = (productionCents > 0 && shippingCents > 0)
              ? Math.round(((prodWithPremium + shippingCents + 30) / (1 - 0.30 - 0.029)) / 50) * 50
              : Math.round((prodWithPremium / 0.671) / 50) * 50

            return {
              label: v.options?.size || v.title,
              width: Math.round(pw / 100),
              height: Math.round(ph / 100),
              variantId: v.id,
              price: retailCents || 2000,
              printAreaWidth: pw,
              printAreaHeight: ph,
              printAreaPosition: frontPlaceholder?.position || 'front',
              placeholderCount: placeholders.length,
            }
          })
          return { label: finishLabel, sizes }
        })
        return { label: colorLabel, hex: getColorHex(colorLabel), finishes }
      })

      const hasColors = colorMap.size > 1
      const allFinishes = Array.from(new Set(variants.map((v: any) =>
        v.options?.finish || v.options?.paper || v.options?.surface).filter(Boolean)))
      const hasFinishes = allFinishes.length > 1
      const firstVariantId = variants[0]?.id
      const firstPlaceholders = variantPlaceholders?.get(firstVariantId) || []

      return {
        id: `bp-${row.blueprint_id}-${row.provider_id}`,
        blueprintId: row.blueprint_id,
        providerId: row.provider_id,
        name: cat.title,
        description: shortDescription(cat.title, cat.description || ''),
        emoji: getProductEmoji(cat.title),
        category: row.category,
        printifyBlueprintId: row.blueprint_id,
        printifyPrintProviderId: row.provider_id,
        hasColors,
        hasFinishes,
        recommendTransparent: row.recommend_transparent || false,
        canCoolerConstraint: row.can_cooler_constraint || false,
        hasMultiplePrintAreas: firstPlaceholders.length > 1,
        customImage: row.custom_image_url || null,
        catalogImages: cat.images || [],
        productContext: getProductContext(cat.title),
        colors,
      }
    }).filter(Boolean)

    // Store in cache
    cachedProducts = products
    cacheTimestamp = Date.now()

    return NextResponse.json({ products, cached: false })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

function shortDescription(title: string, rawDescription: string): string {
  const t = title.toLowerCase()
  if (t.includes('poster') && t.includes('vertical')) return 'Premium matte vertical poster. Vibrant colors, sharp detail, perfect for any wall.'
  if (t.includes('poster')) return 'Premium poster print, rolled and shipped in a protective tube.'
  if (t.includes('canvas') && t.includes('frame')) return 'Gallery-quality canvas in a solid wood frame. Arrives ready to hang.'
  if (t.includes('canvas')) return 'Gallery-quality canvas wrap with vivid color reproduction. Ready to hang.'
  if (t.includes('tapestry')) return 'Soft woven tapestry with vibrant all-over print. Perfect for any room.'
  if (t.includes('black mug') || (t.includes('mug') && t.includes('black'))) return 'Classic black ceramic mug with bold color interior. Dishwasher safe, 11oz or 15oz.'
  if (t.includes('accent') && t.includes('mug')) return 'Ceramic mug with colored accent handle and interior. Dishwasher safe, 11oz or 15oz.'
  if (t.includes('mug')) return 'Classic ceramic mug. Dishwasher safe, available in 11oz and 15oz.'
  if (t.includes('tumbler')) return 'Insulated 20oz tumbler. Keeps drinks hot or cold for hours.'
  if (t.includes('woven blanket')) return 'Premium woven blanket with photo-quality print. Soft, warm, and built to last.'
  if (t.includes('sherpa') || t.includes('fleece')) return 'Ultra-cozy sherpa fleece blanket. Soft on both sides with vibrant print.'
  if (t.includes('arctic')) return 'Warm arctic fleece blanket with vivid all-over print. Perfect for cold nights.'
  if (t.includes('velveteen') || t.includes('plush')) return 'Super soft velveteen plush blanket. Perfect gift for anyone.'
  if (t.includes('rug')) return 'Custom printed area rug. Soft, durable, and machine washable.'
  if (t.includes('curtain')) return 'Custom printed shower curtain. Water-resistant with vibrant full-coverage print.'
  if (t.includes('puzzle')) return 'Custom jigsaw puzzle. Choose your piece count for more or less challenge.'
  if (t.includes('coaster')) return 'Custom ceramic coaster with cork backing. Protects your surfaces in style.'
  if (t.includes('mat') || t.includes('desk')) return 'Premium stitched edge desk mat. Elevate your workspace with a custom design.'
  if (t.includes('magnet')) return 'Weather-resistant car magnet. Easy to apply and remove.'
  if (t.includes('tote') && t.includes('aop')) return 'All-over print tote bag with full coverage design. Durable and spacious.'
  if (t.includes('tote') || t.includes('canvas bag')) return 'Sturdy cotton canvas tote bag. Great for everyday use.'
  if (t.includes('cutting board')) return 'Tempered glass cutting board with full-color print. Functional and decorative.'
  if (t.includes('can cooler')) return 'Custom printed can cooler. Keeps your drink cold and your hands dry.'
  if (t.includes('tough case')) return 'Dual-layer protective phone case. Hard shell with soft TPU lining.'
  if (t.includes('magnetic') && t.includes('case')) return 'MagSafe-compatible impact-resistant phone case. Glossy or matte finish.'
  if (t.includes('dad cap')) return 'Classic unstructured dad cap with adjustable strap. One size fits all.'
  if (t.includes('trucker') || t.includes('snapback')) return 'Snapback trucker cap with mesh back. One size fits all.'
  if (t.includes('hoodie') || (t.includes('sweatshirt') && t.includes('hood'))) return 'Classic pullover hoodie with kangaroo pocket. Warm, comfortable, true to size.'
  if (t.includes('crewneck') || t.includes('sweatshirt')) return 'Classic crewneck sweatshirt. Heavyweight fleece, warm and comfortable.'
  if (t.includes('shirt') || t.includes('tee')) return 'Classic unisex t-shirt. Soft cotton with a comfortable relaxed fit.'
  if (t.includes('wrap') || t.includes('gift')) return 'Custom printed gift wrapping paper. Available in matte and satin finish.'
  const clean = rawDescription.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
  return clean.slice(0, 120).trim()
}

function getColorHex(color: string): string {
  const map: Record<string, string> = {
    'Black': '#1a1a1a', 'White': '#ffffff', 'Navy': '#1f2e5e', 'Red': '#cc2222',
    'Blue': '#1a4fa3', 'Green': '#2a6b2a', 'Grey': '#888888', 'Gray': '#888888',
    'Pink': '#f4a7b9', 'Purple': '#6b2fa0', 'Orange': '#e87722', 'Yellow': '#f5d000',
    'Brown': '#6b3a2a', 'Maroon': '#6b1a1a', 'Natural': '#c8a97e', 'Espresso': '#3b1f0a',
    'Charcoal': '#444444', 'Ash': '#b8b8b8', 'Sport Grey': '#999999', 'Dark Heather': '#555555',
    'Forest Green': '#2d5a1b', 'Royal': '#1a3fa3', 'Gold': '#c9a227', 'Sand': '#c2a67a',
    'Ivory': '#f5f0e0', 'Khaki': '#c3a96b', 'Cream': '#f5f0dc', 'Indigo': '#3d3580',
    'Heather Grey': '#aaaaaa', 'Dark Chocolate': '#3b1f0a', 'Light Blue': '#a8c8e8',
    'Light Pink': '#f9c8d8', 'Cardinal Red': '#9b1a2a', 'Military Green': '#4a5a2a',
  }
  for (const [key, hex] of Object.entries(map)) {
    if (color.toLowerCase().includes(key.toLowerCase())) return hex
  }
  return '#cccccc'
}

function getProductEmoji(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('poster')) return '🖼️'
  if (t.includes('canvas') && t.includes('frame')) return '🪞'
  if (t.includes('canvas')) return '🎨'
  if (t.includes('tapestry')) return '🏴'
  if (t.includes('mug') || t.includes('cup')) return '☕'
  if (t.includes('tumbler')) return '🥤'
  if (t.includes('blanket') || t.includes('sherpa') || t.includes('fleece') || t.includes('woven') || t.includes('velveteen')) return '🛋️'
  if (t.includes('rug')) return '🏠'
  if (t.includes('curtain')) return '🚿'
  if (t.includes('puzzle')) return '🧩'
  if (t.includes('coaster')) return '🫖'
  if (t.includes('tote') || t.includes('bag')) return '👜'
  if (t.includes('case')) return '📱'
  if (t.includes('cap') || t.includes('hat')) return '🧢'
  if (t.includes('hoodie') || t.includes('sweatshirt')) return '🧥'
  if (t.includes('shirt') || t.includes('tee')) return '👕'
  if (t.includes('magnet')) return '🚗'
  if (t.includes('cutting board')) return '🍳'
  if (t.includes('cooler') || t.includes('can')) return '🥤'
  if (t.includes('wrap') || t.includes('gift')) return '🎁'
  if (t.includes('mat') || t.includes('desk')) return '💻'
  return '✨'
}

function getProductContext(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('poster')) return 'This design will be printed on a poster. Consider bold colors and striking compositions.'
  if (t.includes('canvas') && t.includes('frame')) return 'This design will be printed on a framed canvas. Gallery-quality artwork.'
  if (t.includes('canvas')) return 'This design will be printed on a stretched canvas.'
  if (t.includes('tapestry')) return 'This design will be printed on a wall tapestry. Full coverage designs with rich colors work best.'
  if (t.includes('mug')) return 'This design will wrap around a ceramic mug. Consider panoramic wrap-around designs.'
  if (t.includes('tumbler')) return 'This design will wrap around a tumbler. A seamless wrap-around pattern works best.'
  if (t.includes('blanket') || t.includes('sherpa') || t.includes('fleece') || t.includes('woven') || t.includes('velveteen')) return 'This design will be printed on a blanket. Bold patterns at large scale work well.'
  if (t.includes('rug')) return 'This design will be printed on an area rug. Consider geometric patterns.'
  if (t.includes('curtain')) return 'This design will be printed on a shower curtain. Full coverage patterns work best.'
  if (t.includes('puzzle')) return 'This design will be printed on a jigsaw puzzle. Detailed and colorful designs work best.'
  if (t.includes('tote') || t.includes('bag')) return 'This design will be printed on a tote bag. Bold, simple designs work best.'
  if (t.includes('case')) return 'This design will be printed on a phone case. Portrait orientation designs work best.'
  if (t.includes('cap') || t.includes('hat')) return 'This design will be printed on a cap. Simple, bold designs work best.'
  if (t.includes('hoodie') || t.includes('sweatshirt')) return 'This design will be printed on a sweatshirt. Consider designs for the front chest area.'
  if (t.includes('shirt') || t.includes('tee')) return 'This design will be printed on a t-shirt. Bold graphics work best.'
  if (t.includes('magnet')) return 'This design will be printed on a car magnet. Clean logos with transparent backgrounds work best.'
  if (t.includes('cutting board')) return 'This design will be printed on a glass cutting board.'
  if (t.includes('cooler')) return 'This design will wrap around a can cooler. Focus design elements on the upper and lower thirds.'
  if (t.includes('coaster')) return 'This design will be printed on a ceramic coaster.'
  if (t.includes('wrap') || t.includes('gift')) return 'This design will be printed as a repeating pattern on gift wrapping paper.'
  if (t.includes('mat') || t.includes('desk')) return 'This design will be printed on a desk mat.'
  return `This design will be printed on a ${title.toLowerCase()}.`
}