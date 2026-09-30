import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Join allowlist with catalog to get full product data
    const { data, error } = await supabase
      .from('product_allowlist')
      .select(`
        *,
        product_catalog!inner(
          title,
          description,
          images,
          variants,
          colors,
          sizes,
          finishes,
          print_areas
        )
      `)
      .eq('enabled', true)
      .order('display_order')

    if (error) throw error

    // Transform into the same shape as the old PRODUCTS array
    const products = data.map((row: any) => {
      const catalog = row.product_catalog
      const variants = catalog.variants || []

      // Build colors array with their sizes/finishes
      const colorMap = new Map<string, any[]>()
      const finishMap = new Map<string, any[]>()

      for (const v of variants) {
        const color = v.options?.color || 'Default'
        const finish = v.options?.finish || v.options?.paper || v.options?.surface || 'Standard'
        const size = v.options?.size

        // Group by color → finish → sizes
        if (!colorMap.has(color)) colorMap.set(color, [])
        colorMap.get(color)!.push(v)
      }

      // Build structured colors array matching existing format
      const colors = Array.from(colorMap.entries()).map(([colorLabel, colorVariants]) => {
        // Group by finish within this color
        const finishesMap = new Map<string, any[]>()
        for (const v of colorVariants) {
          const finish = v.options?.finish || v.options?.paper || v.options?.surface || 'Standard'
          if (!finishesMap.has(finish)) finishesMap.set(finish, [])
          finishesMap.get(finish)!.push(v)
        }

        const finishes = Array.from(finishesMap.entries()).map(([finishLabel, finishVariants]) => {
          const sizes = finishVariants.map((v: any) => {
            const printArea = v.placeholders?.[0] || {}
            // Calculate retail price at 30% margin
            const productionCents = v.cost || 0
            const shippingCents = row.shipping_cents || 0
            const prodWithPremium = productionCents * 0.8
            const retailCents = shippingCents > 0
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

        return {
          label: colorLabel,
          hex: getColorHex(colorLabel),
          finishes,
        }
      })

      // Determine product flags
      const hasColors = catalog.colors?.length > 1
      const hasFinishes = catalog.finishes?.length > 1
      const firstVariant = variants[0]
      const printAreaCount = firstVariant?.placeholders?.length || 0

      return {
        id: `bp-${row.blueprint_id}-${row.provider_id}`,
        blueprintId: row.blueprint_id,
        providerId: row.provider_id,
        name: catalog.title,
        description: catalog.description,
        emoji: getProductEmoji(row.category, catalog.title),
        category: row.category,
        printifyBlueprintId: row.blueprint_id,
        printifyPrintProviderId: row.provider_id,
        hasColors,
        hasFinishes,
        recommendTransparent: row.recommend_transparent,
        canCoolerConstraint: row.can_cooler_constraint,
        hasMultiplePrintAreas: printAreaCount > 1,
        customImage: row.custom_image_url,
        catalogImages: catalog.images || [],
        productContext: getProductContext(catalog.title, row.category),
        colors,
      }
    })

    return NextResponse.json({ products })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 })
  }
}

function getColorHex(color: string): string {
  const colorMap: Record<string, string> = {
    'Black': '#1a1a1a', 'White': '#ffffff', 'Navy': '#1f2e5e',
    'Red': '#cc2222', 'Blue': '#1a4fa3', 'Green': '#2a6b2a',
    'Grey': '#888888', 'Gray': '#888888', 'Pink': '#f4a7b9',
    'Purple': '#6b2fa0', 'Orange': '#e87722', 'Yellow': '#f5d000',
    'Brown': '#6b3a2a', 'Maroon': '#6b1a1a', 'Natural': '#c8a97e',
    'Espresso': '#3b1f0a', 'Charcoal': '#444444', 'Ash': '#b8b8b8',
    'Sport Grey': '#999999', 'Dark Heather': '#555555',
    'Forest Green': '#2d5a1b', 'Royal': '#1a3fa3', 'Gold': '#c9a227',
    'Sand': '#c2a67a', 'Ivory': '#f5f0e0', 'Khaki': '#c3a96b',
    'Mint': '#98d4b8', 'Lavender': '#c9b8f0', 'Cream': '#f5f0dc',
  }
  // Check for partial matches
  for (const [key, hex] of Object.entries(colorMap)) {
    if (color.toLowerCase().includes(key.toLowerCase())) return hex
  }
  return '#cccccc'
}

function getProductEmoji(category: string, title: string): string {
  const t = title.toLowerCase()
  if (t.includes('poster') || t.includes('print')) return '🖼️'
  if (t.includes('canvas') && t.includes('frame')) return '🪞'
  if (t.includes('canvas')) return '🎨'
  if (t.includes('tapestry')) return '🏴'
  if (t.includes('mug') || t.includes('cup')) return '☕'
  if (t.includes('tumbler')) return '🥤'
  if (t.includes('blanket') || t.includes('throw')) return '🛋️'
  if (t.includes('rug')) return '🏠'
  if (t.includes('curtain')) return '🚿'
  if (t.includes('puzzle')) return '🧩'
  if (t.includes('coaster')) return '🫖'
  if (t.includes('tote') || t.includes('bag')) return '👜'
  if (t.includes('case') || t.includes('phone')) return '📱'
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

function getProductContext(title: string, category: string): string {
  const t = title.toLowerCase()
  if (t.includes('poster')) return 'This design will be printed on a poster. Consider bold colors and striking compositions that look great on a wall.'
  if (t.includes('canvas') && t.includes('frame')) return 'This design will be printed on a framed canvas. Gallery-quality artwork with a professional frame.'
  if (t.includes('canvas')) return 'This design will be printed on a stretched canvas. Consider artwork that looks great as wall decor.'
  if (t.includes('tapestry')) return 'This design will be printed on a wall tapestry. Full coverage designs with rich colors work best.'
  if (t.includes('mug')) return 'This design will wrap around a ceramic mug. Consider designs that look great in a panoramic wrap-around format.'
  if (t.includes('tumbler')) return 'This design will wrap around a tumbler. A seamless wrap-around pattern works best.'
  if (t.includes('blanket') || t.includes('throw')) return 'This design will be printed on a blanket. Bold patterns and artwork that looks great at large scale work well.'
  if (t.includes('rug')) return 'This design will be printed on an area rug. Consider geometric patterns or artwork with strong visual impact.'
  if (t.includes('curtain')) return 'This design will be printed on a shower curtain. Full coverage patterns and bold designs work best.'
  if (t.includes('puzzle')) return 'This design will be printed on a jigsaw puzzle. Detailed and colorful designs make for a great puzzle experience.'
  if (t.includes('tote') || t.includes('bag')) return 'This design will be printed on a tote bag. Bold, simple designs that read well at the bag scale work best.'
  if (t.includes('case')) return 'This design will be printed on a phone case. Consider designs that look great in portrait orientation.'
  if (t.includes('cap') || t.includes('hat')) return 'This design will be embroidered or printed on a cap. Simple, bold designs work best for headwear.'
  if (t.includes('hoodie') || t.includes('sweatshirt')) return 'This design will be printed on a sweatshirt. Consider designs for the front chest area and optionally the back.'
  if (t.includes('shirt') || t.includes('tee')) return 'This design will be printed on a t-shirt. Bold graphics and artwork that read well on fabric work best.'
  if (t.includes('magnet')) return 'This design will be printed on a car magnet. Clean logos and simple designs with transparent backgrounds work best.'
  if (t.includes('cutting board')) return 'This design will be printed on a glass cutting board. Decorative patterns and kitchen-themed artwork work well.'
  if (t.includes('cooler')) return 'This design will wrap around a can cooler. Focus design elements on the upper and lower thirds.'
  if (t.includes('coaster')) return 'This design will be printed on a ceramic coaster. Square or circular designs that fill the space work best.'
  return `This design will be printed on a ${title.toLowerCase()}.`
}