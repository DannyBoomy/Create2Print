import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

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

  // Check if expired
  if (new Date(share.expires_at) < new Date()) return notFound()

  return (
    <div className="min-h-screen bg-[#f8f8fc] flex flex-col items-center justify-center px-4 py-12"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <img src="/logo.png" alt="Create2Print" className="h-16 object-contain mb-8" />

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden">
        <img src={share.image_url} alt="Shared design" className="w-full object-contain" />

        <div className="p-6">
          <h1 className="font-extrabold text-2xl text-[#071633] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Check out this AI-generated print!
          </h1>
          <p className="text-[#747aa2] text-sm mb-1">{share.product_name} · {share.size_name}</p>
          {share.prompt && (
            <p className="text-[#8a89a8] text-xs mb-6 italic">"{share.prompt}"</p>
          )}

          <a href="/"
            className="block w-full text-center rounded-full bg-gradient-to-r from-[#6526f5] via-[#ef48a7] to-[#ff8c18] px-8 py-4 text-[17px] font-extrabold text-white shadow-[0_16px_40px_rgba(239,72,167,0.23)] transition hover:-translate-y-0.5">
            ✦ Create Your Own Print →
          </a>

          <p className="text-center text-xs text-[#b0b5cc] mt-4">
            Create2Print · AI-generated wall art, printed and shipped to your door
          </p>
        </div>
      </div>
    </div>
  )
}
