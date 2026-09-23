import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const blueprintId = searchParams.get('blueprint') || '944'
    const providerId = searchParams.get('provider') || '99'

    const res = await axios.get(
      `${PRINTIFY_API}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    )

    return NextResponse.json(res.data)

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response?.data || err?.message },
      { status: 500 }
    )
  }
}