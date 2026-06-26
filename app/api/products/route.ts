import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const blueprintId = searchParams.get('blueprintId')

  if (!blueprintId) {
    return NextResponse.json({ error: 'Missing blueprintId' }, { status: 400 })
  }

  try {
    const res = await axios.get(
      `${PRINTIFY_API}/catalog/blueprints/${blueprintId}.json`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    )

    const images = res.data?.images || []
    const title = res.data?.title || ''
    const description = res.data?.description || ''

    return NextResponse.json({ images, title, description })
  } catch (error: any) {
    console.error('Printify catalog error:', error?.response?.data || error)
    return NextResponse.json(
      { error: 'Failed to fetch product info', images: [] },
      { status: 500 }
    )
  }
}
