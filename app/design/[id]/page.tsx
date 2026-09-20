import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import SharedDesignClient from './client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DesignPage({ params }: { params: { id: string } }) {
  const { data: share, error } = await supabase
    .from('shares')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !share) return notFound()
  if (new Date(share.expires_at) < new Date()) return notFound()

  return <SharedDesignClient share={share} />
}