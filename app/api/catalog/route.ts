import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY

const NEW_BLUEPRINTS = [
  { blueprintId: 706,  providerId: 99  },
  { blueprintId: 49,   providerId: 99  },
  { blueprintId: 1626, providerId: 99  },
  { blueprintId: 77,   providerId: 99  },
  { blueprintId: 635,  providerId: 99  },
  { blueprintId: 282,  providerId: 99  },
  { blueprintId: 421,  providerId: 99  },
  { blueprintId: 951,  providerId: 92  },
  { blueprintId: 80,   providerId: 90  },
  { blueprintId: 1313, providerId: 99  },
  { blueprintId: 938,  providerId: 92  },
  { blueprintId: 5,    providerId: 99  },
  { blueprintId: 1389, providerId: 99  },
  { blueprintId: 1447, providerId: 99  },
  { blueprintId: 1273, providerId: 88  },
  { blueprintId: 1743, providerId: 41  },
]

export async function GET(req: NextRequest) {
  const results = []
  const headers = { Authorization: `Bearer ${API_KEY}` }

  for (const { blueprintId, providerId } of NEW_BLUEPRINTS) {
    try {
      // Step 1: Get variants — same endpoint as print-areas route
      const variantsRes = await axios.get(
        `${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
        { headers }
      )

      const allVariants = variantsRes.data?.variants || []

      // Step 2: Get blueprint info for images and title
      const blueprintRes = await axios.get(
        `${PRINTIFY_API}/catalog/blueprints/${blueprintId}.json`,
        { headers }
      )

      // Step 3: Get print areas — same endpoint pattern
      let printAreaMap = new Map()
      try {
        const paRes = await axios.get(
          `${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/print_areas.json`,
          { headers }
        )
        const paVariants = paRes.data?.variants || []
        for (const v of paVariants) {
          printAreaMap.set(v.id, v.placeholders)
        }
      } catch {}

      // Build variant list
      const variants = allVariants.map((v: any) => ({
        id: v.id,
        title: v.title,
        options: v.options,
        cost: v.cost,
        costFormatted: v.cost ? `$${(v.cost / 100).toFixed(2)}` : 'N/A',
        placeholders: printAreaMap.get(v.id) || [],
      }))

      results.push({
        blueprintId,
        providerId,
        title: blueprintRes.data?.title,
        images: (blueprintRes.data?.images || []).slice(0, 2),
        totalVariants: variants.length,
        // Sample first 5 variants to keep response manageable
        sampleVariants: variants.slice(0, 5),
        // All unique colors
        colors: [...new Set(variants.map((v: any) => v.options?.color).filter(Boolean))],
        // All unique sizes
        sizes: [...new Set(variants.map((v: any) => v.options?.size).filter(Boolean))],
        // Print area from first variant
        printArea: variants[0]?.placeholders?.[0] ? {
          width: variants[0].placeholders[0].width,
          height: variants[0].placeholders[0].height,
          position: variants[0].placeholders[0].position,
        } : null,
        // Multiple print areas?
        printAreaCount: variants[0]?.placeholders?.length || 0,
        variants,
      })

      await new Promise(r => setTimeout(r, 200))
    } catch (e: any) {
      results.push({
        blueprintId,
        providerId,
        error: e?.response?.data || e?.message,
        status: e?.response?.status,
      })
    }
  }

  return NextResponse.json(results)
}