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

  for (const bp of blueprints) {
    try {
      const res = await axios.get(
        `${PRINTIFY_API}/catalog/blueprints/${bp.blueprintId}/print_providers/${bp.printProviderId}/variants.json`,
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      )
      const variants = res.data?.variants || []
      results[bp.name] = variants.map((v: any) => ({
        id: v.id,
        title: v.title,
        options: v.options,
      }))
    } catch (err: any) {
      results[bp.name] = { error: err?.response?.data || err?.message }
    }
  }

  return NextResponse.json(results)
}