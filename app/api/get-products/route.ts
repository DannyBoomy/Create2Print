import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Fetch allowlist and catalog separately
    const [allowlistRes, catalogRes] = await Promise.all([
      supabase.from('product_allowlist').select('*').eq('enabled', true).order('display_order'),
      supabase.from('product_catalog').select('*'),
    ])

    if (allowlistRes.error) throw allowlistRes.error
    if (catalogRes.error) throw catalogRes.error

    const allowlist = allowlistRes.data || []
    const catalog = catalogRes.data || []

    // Map catalog by blueprint_id + provider_id
    const catalogMap = new Map<string, any>()
    for (const item of catalog) {
      catalogMap.set(`${item.blueprint_id}-${item.provider_id}`, item)
    }

    const products = allowlist.map((row: any) => {
      const cat = catalogMap.get(`${row.blueprint_id}-${row.provider_id}`)
      if (!cat) return null

      const variants = cat.variants || []

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
            const printArea = v.placeholders?.[0] || {}
            const productionCents = v.cost || 0
            const shippingCents = row.shipping_cents || 0
            const prodWithPremium = Math.round(productionCents * 0.8)
            const retailCents = (productionCents > 0 && shippingCents > 0)
              ? Math.round(((prodWithPremium + shippingCents + 30) / (1 - 0.30 - 0.029)) / 50) * 50
              : Math.round((prodWithPremium / 0.671) / 50) * 50

            return {
              label: v.options?.size || v.title,
              width: printArea.width ? Math.round(printArea.width / 100) : 10,
              height: printArea.height ? Math.round(printArea.height / 100) : 10,
              variantId: v.id,
              price: retailCents || 2000,
              printAreaWidth: printArea.width || 3000,
              printAreaHeight: printArea.height || 3000,
              placeholderCount: v.placeholders?.length || 1,
            }
          })
          return { label: finishLabel, sizes }
        })
        return { label: colorLabel, hex: getColorHex(colorLabel), finishes }
      })

      const hasColors = colorMap.size > 1
      const firstVariant = variants[0]
      const allFinishes = Array.from(new Set(variants.map((v: any) => v.options?.finish || v.options?.paper || v.options?.surface).filter(Boolean)))
      const hasFinishes = allFinishes.length > 1
      const printAreaCount = firstVariant?.placeholders?.length || 0

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
        hasMultiplePrintAreas: printAreaCount > 1,
        customImage: row.custom_image_url || null,
        catalogImages: cat.images || [],
        productContext: getProductContext(cat.title),
        colors,
      }
    }).filter(Boolean)

    return NextResponse.json({ products })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function shortDescription(title: string, rawDescription: string): string {
  const t = title.toLowerCase()
  if (t.includes('poster') && t.includes('vertical')) return 'Premium matte vertical poster. Vibrant colors, sharp detail, perfect for any wall.'
  if (t.includes('poster')) return 'Premium poster print, rolled and shipped in a protective tube. Sharp detail and vivid color.'
  if (t.includes('canvas') && t.includes('frame')) return 'Gallery-quality canvas in a solid wood frame. Arrives ready to hang.'
  if (t.includes('canvas')) return 'Gallery-quality canvas wrap with vivid color reproduction. Ready to hang straight out of the box.'
  if (t.includes('tapestry')) return 'Soft woven tapestry with vibrant all-over print. Perfect for any room.'
  if (t.includes('black mug') || (t.includes('mug') && t.includes('black'))) return 'Classic black ceramic mug with a bold color interior. Dishwasher safe, 11oz or 15oz.'
  if (t.includes('accent') && t.includes('mug')) return 'Ceramic mug with a colored accent handle and interior. Dishwasher safe, 11oz or 15oz.'
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
  if (t.includes('magnet')) return 'Weather-resistant car magnet. Easy to apply and remove, holds firm at highway speeds.'
  if (t.includes('tote') && t.includes('aop')) return 'All-over print tote bag with full coverage design. Durable and spacious.'
  if (t.includes('tote') || t.includes('canvas bag')) return 'Sturdy cotton canvas tote bag. Great for everyday use.'
  if (t.includes('cutting board')) return 'Tempered glass cutting board with full-color print. Functional and decorative.'
  if (t.includes('can cooler')) return 'Custom printed can cooler. Keeps your drink cold and your hands dry.'
  if (t.includes('tough case')) return 'Dual-layer protective phone case. Hard shell with soft TPU lining, glossy finish.'
  if (t.includes('magnetic') && t.includes('case')) return 'MagSafe-compatible impact-resistant phone case. Available in glossy or matte finish.'
  if (t.includes('dad cap')) return 'Classic unstructured dad cap with adjustable strap. One size fits all.'
  if (t.includes('trucker') || t.includes('snapback')) return 'Snapback trucker cap with mesh back. One size fits all.'
  if (t.includes('hoodie') || t.includes('sweatshirt') && t.includes('hood')) return 'Classic pullover hoodie with kangaroo pocket. Warm, comfortable, true to size.'
  if (t.includes('crewneck') || t.includes('sweatshirt')) return 'Classic crewneck sweatshirt. Heavyweight fleece, warm and comfortable.'
  if (t.includes('long sleeve')) return 'Classic long sleeve tee. Soft cotton, comfortable fit.'
  if (t.includes('shirt') || t.includes('tee')) return 'Classic unisex t-shirt. Soft cotton with a comfortable relaxed fit.'
  if (t.includes('wrap') || t.includes('gift')) return 'Custom printed gift wrapping paper. Available in matte and satin finish.'
  // Fallback: strip HTML and take first sentence
  const clean = stripHtml(rawDescription)
  const firstSentence = clean.split(/[.!?]/)[0]
  return firstSentence.length > 10 ? firstSentence.trim() + '.' : clean.slice(0, 120).trim()
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
  if (t.includes('blanket') || t.includes('throw') || t.includes('sherpa') || t.includes('fleece') || t.includes('woven') || t.includes('velveteen')) return '🛋️'
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
  if (t.includes('poster')) return 'This design will be printed on a poster. Consider bold colors and striking compositions that look great on a wall.'
  if (t.includes('canvas') && t.includes('frame')) return 'This design will be printed on a framed canvas. Gallery-quality artwork with a professional frame.'
  if (t.includes('canvas')) return 'This design will be printed on a stretched canvas.'
  if (t.includes('tapestry')) return 'This design will be printed on a wall tapestry. Full coverage designs with rich colors work best.'
  if (t.includes('mug')) return 'This design will wrap around a ceramic mug. Consider designs that look great in a panoramic wrap-around format.'
  if (t.includes('tumbler')) return 'This design will wrap around a tumbler. A seamless wrap-around pattern works best.'
  if (t.includes('blanket') || t.includes('sherpa') || t.includes('fleece') || t.includes('woven') || t.includes('velveteen')) return 'This design will be printed on a blanket. Bold patterns and artwork that looks great at large scale work well.'
  if (t.includes('rug')) return 'This design will be printed on an area rug. Consider geometric patterns or artwork with strong visual impact.'
  if (t.includes('curtain')) return 'This design will be printed on a shower curtain. Full coverage patterns and bold designs work best.'
  if (t.includes('puzzle')) return 'This design will be printed on a jigsaw puzzle. Detailed and colorful designs make for a great puzzle experience.'
  if (t.includes('tote') || t.includes('bag')) return 'This design will be printed on a tote bag. Bold, simple designs work best.'
  if (t.includes('case')) return 'This design will be printed on a phone case. Consider designs that look great in portrait orientation.'
  if (t.includes('cap') || t.includes('hat')) return 'This design will be printed on a cap. Simple, bold designs work best for headwear.'
  if (t.includes('hoodie') || t.includes('sweatshirt')) return 'This design will be printed on a sweatshirt. Consider designs for the front chest area.'
  if (t.includes('shirt') || t.includes('tee')) return 'This design will be printed on a t-shirt. Bold graphics and artwork that read well on fabric work best.'
  if (t.includes('magnet')) return 'This design will be printed on a car magnet. Clean logos and simple designs with transparent backgrounds work best.'
  if (t.includes('cutting board')) return 'This design will be printed on a glass cutting board.'
  if (t.includes('cooler')) return 'This design will wrap around a can cooler. Focus design elements on the upper and lower thirds.'
  if (t.includes('coaster')) return 'This design will be printed on a ceramic coaster.'
  if (t.includes('wrap') || t.includes('gift')) return 'This design will be printed as a repeating pattern on gift wrapping paper.'
  if (t.includes('mat') || t.includes('desk')) return 'This design will be printed on a desk mat.'
  return `This design will be printed on a ${title.toLowerCase()}.`
}