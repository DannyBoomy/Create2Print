import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const API_KEY = process.env.PRINTIFY_API_KEY
const SHOP_ID = process.env.PRINTIFY_SHOP_ID

export async function POST(req: NextRequest) {
  try {
    const { blueprintId, printProviderId, variantId, country, state } = await req.json()

    if (!blueprintId || !printProviderId || !variantId || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const payload = {
      line_items: [
        {
          blueprint_id: Number(blueprintId),
          print_provider_id: Number(printProviderId),
          variant_id: Number(variantId),
          quantity: 1,
        }
      ],
      address_to: {
        country,
        region: state || '',
      }
    }

    const res = await axios.post(
      `${PRINTIFY_API}/shops/${SHOP_ID}/orders/shipping.json`,
      payload,
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    )

    const shipping = res.data
    console.log('Shipping rates:', JSON.stringify(shipping))

    const standardRate = shipping.standard || shipping.express || 0

    return NextResponse.json({
      shipping: standardRate,
      shippingFormatted: `$${(standardRate / 100).toFixed(2)}`,
      rates: shipping,
    })

  } catch (error: any) {
    console.error('Shipping error:', JSON.stringify(error?.response?.data || error?.message))
    return NextResponse.json({
      shipping: country === 'US' ? 599 : 1499,
      shippingFormatted: country === 'US' ? '$5.99' : '$14.99',
      fallback: true,
    })
  }
}