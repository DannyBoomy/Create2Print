import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY

export async function GET(req: NextRequest) {
  const results: any = {}

  const blueprints = [
    { name: 'Rolled Poster', blueprintId: 1220, printProviderId: 99 },
    { name: 'Matte Canvas', blueprintId: 1159, printProviderId: 99 },
    { name: 'Framed Canvas', blueprintId: 944, printProviderId: 99 },
    { name: 'Wall Tapestry', blueprintId: 241, printProviderId: 99 },
  ]

  // Target variant IDs we care about
  const targetVariants: Record<string, number[]> = {
    'Rolled Poster': [101878, 101880, 101888, 101893],
    'Matte Canvas': [101413, 91643, 91646, 91649],
    'Framed Canvas': [111821, 88292, 88293, 88294],
    'Wall Tapestry': [41686, 41687, 45130],
  }

  for (const bp of blueprints) {
    try {
      const res = await axios.get(
        `${PRINTIFY_API}/catalog/blueprints/${bp.blueprintId}/print_providers/${bp.printProviderId}/variants.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      )
      const variants = res.data?.variants || []
      const targets = targetVariants[bp.name]

      results[bp.name] = variants
        .filter((v: any) => targets.includes(v.id))
        .map((v: any) => ({
          id: v.id,
          title: v.title,
          cost: v.cost, // in cents
          costFormatted: v.cost ? `$${(v.cost / 100).toFixed(2)}` : 'N/A',
          yourPrice: v.cost ? `$${Math.round(v.cost * 1.35 / 100)}` : 'N/A',
          yourPriceCents: v.cost ? Math.round(v.cost * 1.35) : null,
        }))
    } catch (err: any) {
      results[bp.name] = { error: err?.response?.data || err?.message }
    }
  }

  return NextResponse.json(results, { headers: { 'Content-Type': 'application/json' } })
}