import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { tempPath } = await req.json()
    if (!tempPath || !tempPath.startsWith('temp/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }
    await supabase.storage.from('designs').remove([tempPath])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}