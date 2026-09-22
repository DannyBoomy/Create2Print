'use client'
import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { formatPrice } from '@/lib/products'

interface SavedDesign {
  id: string
  image_url: string
  prompt: string
  product_name: string
  size_label: string
  color: string | null
  finish: string | null
  price: number
  created_at: string
}

export default function SavedPage() {
  const { data: session, status } = useSession()
  const [designs, setDesigns] = useState<SavedDesign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.email) fetchDesigns()
    else setLoading(false)
  }, [session])

  const fetchDesigns = async () => {
    try {
      const res = await fetch('/api/saved-designs')
      const data = await res.json()
      setDesigns(data.designs || [])
    } catch { }
    setLoading(false)
  }

  const deleteDesign = async (id: string) => {
    await fetch(`/api/saved-designs?id=${id}`, { method: 'DELETE' })
    setDesigns(d => d.filter(x => x.id !== id))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7ff]">
        <div className="w-8 h-8 border-4 border-[#6d3df3] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f7ff] gap-4 p-6 text-center">
        <div className="text-5xl mb-2">🔖</div>
        <h1 className="text-2xl font-bold text-[#071633]">Sign in to see your saved designs</h1>
        <p className="text-[#747aa2]">Your saved designs will appear here once you sign in.</p>
        <button
          onClick={() => signIn('google')}
          className="mt-2 px-6 py-3 bg-gradient-to-r from-[#6d3df3] to-[#8b5cf6] text-white font-semibold rounded-xl"
        >
          Sign in with Google
        </button>
        <Link href="/" className="text-[#6d3df3] text-sm mt-2">← Back to Create2Print</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#071633]">Saved Designs</h1>
            <p className="text-[#747aa2] text-sm mt-0.5">{designs.length} design{designs.length !== 1 ? 's' : ''} saved</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-gradient-to-r from-[#6d3df3] to-[#8b5cf6] text-white text-sm font-semibold rounded-xl">
            + Create New
          </Link>
        </div>

        {designs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-xl font-bold text-[#071633] mb-2">No saved designs yet</h2>
            <p className="text-[#747aa2] mb-6">Generate something beautiful and save it here.</p>
            <Link href="/" className="px-6 py-3 bg-gradient-to-r from-[#6d3df3] to-[#8b5cf6] text-white font-semibold rounded-xl">
              Start Creating
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {designs.map(design => (
              <div key={design.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#ede9fe] group">
                <div className="relative aspect-square bg-[#f3f0ff]">
                  <img src={design.image_url} alt={design.prompt} className="w-full h-full object-cover" />
                  <button
                    onClick={() => deleteDesign(design.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-[#071633] truncate">{design.product_name}</p>
                  <p className="text-xs text-[#747aa2] truncate">
                    {[design.color, design.finish, design.size_label].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-xs font-bold text-[#6d3df3] mt-1">{formatPrice(design.price)}</p>
                  <p className="text-[10px] text-[#9ca3af] mt-1 line-clamp-2">{design.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
