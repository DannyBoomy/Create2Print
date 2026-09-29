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

  for (const { blueprintId, providerId } of NEW_BLUEPRINTS) {
    try {
      const [variantsRes, printAreasRes, blueprintRes] = await Promise.all([
        axios.get(`${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }),
        axios.get(`${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/print_areas.json`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }),
        axios.get(`${PRINTIFY_API}/catalog/blueprints/${blueprintId}.json`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }),
      ])

      results.push({
        blueprintId,
        providerId,
        title: blueprintRes.data?.title,
        images: (blueprintRes.data?.images || []).slice(0, 2),
        variants: (variantsRes.data?.variants || []).filter((v: any) => v.is_available).map((v: any) => ({
          id: v.id,
          title: v.title,
          options: v.options,
          cost: v.cost,
        })),
        printAreas: printAreasRes.data?.variants?.slice(0, 3) || [],
      })

      await new Promise(r => setTimeout(r, 300))
    } catch (e: any) {
      results.push({ blueprintId, providerId, error: e?.response?.data || e?.message })
    }
  }

  return NextResponse.json(results)
}