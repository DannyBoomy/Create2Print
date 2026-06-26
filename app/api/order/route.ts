import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PRINTIFY_API = 'https://api.printify.com/v1'
const SHOP_ID = process.env.PRINTIFY_SHOP_ID
const API_KEY = process.env.PRINTIFY_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { printifyImageId, blueprintId, printProviderId, variantId, shipping } = await req.json()

    const orderRes = await axios.post(
      `${PRINTIFY_API}/shops/${SHOP_ID}/orders.json`,
      {
        external_id: `c2p-${Date.now()}`,
        label: 'Create2Print Order',
        line_items: [{
          blueprint_id: blueprintId,
          print_provider_id: printProviderId,
          variant_id: variantId,
          print_areas: {
            front: [{ src: printifyImageId, scale: 1, x: 0.5, y: 0.5, angle: 0 }]
          },
          quantity: 1,
        }],
        shipping_method: 1,
        send_shipping_notification: true,
        address_to: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          email: shipping.email,
          phone: '',
          country: shipping.country,
          region: shipping.state,
          address1: shipping.address1,
          address2: '',
          city: shipping.city,
          zip: shipping.zip,
        },
      },
      { headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' } }
    )

    return NextResponse.json({ success: true, orderId: orderRes.data.id })

  } catch (error: any) {
    console.error('Order error:', error?.response?.data || error)
    return NextResponse.json(
      { error: error?.response?.data?.message || 'Order failed' },
      { status: 500 }
    )
  }
}
