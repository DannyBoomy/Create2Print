'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Share {
  id: string
  image_url: string
  prompt: string
  product_id: string
  product_name: string
  size_name: string
  variant_id: number
  expires_at: string
}

// ── Lightbox ────────────────────────────────────────────────────────────
function Lightbox({ urls, startIdx, onClose }: { urls: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  const [dragOffset, setDragOffset] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + urls.length) % urls.length)
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % urls.length)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose, urls.length])

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    setDragOffset(e.touches[0].clientX - touchStartX.current)
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    setDragOffset(0)
    if (Math.abs(diff) > 50) diff > 0 ? setIdx(i => (i + 1) % urls.length) : setIdx(i => (i - 1 + urls.length) % urls.length)
    touchStartX.current = null
  }

  const containerWidth = containerRef.current?.offsetWidth || window.innerWidth
  const totalOffset = -(idx * 100) + (dragOffset / containerWidth) * 100

  return (
    // z-[99999] ensures it's always above the header
    <div className="fixed inset-0 z-[99999] flex flex-col" style={{ background: 'rgba(0,0,0,0.97)' }}>
      {/* Top bar — X always visible, always above everything */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <span className="text-white/40 text-sm font-medium">{idx + 1} / {urls.length}</span>
        <button onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all active:scale-95">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Image area */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        {urls.length > 1 && (
          <button onClick={() => setIdx(i => (i - 1 + urls.length) % urls.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            style={{ fontSize: 22 }}>‹</button>
        )}
        <div
          className="flex h-full"
          style={{
            transform: `translateX(${totalOffset}%)`,
            transition: dragOffset !== 0 ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {urls.map((url, i) => (
            <div key={i} className="flex-shrink-0 w-full h-full flex items-center justify-center px-14">
              <img src={url} alt={`View ${i + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                draggable={false} />
            </div>
          ))}
        </div>
        {urls.length > 1 && (
          <button onClick={() => setIdx(i => (i + 1) % urls.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            style={{ fontSize: 22 }}>›</button>
        )}
      </div>

      {/* Line indicators */}
      {urls.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-4 flex-shrink-0">
          {urls.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === idx ? 24 : 8, height: 4, background: i === idx ? 'white' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Carousel ───────────────────────────────────────────────────────────
function Carousel({ urls, onExpand }: { urls: string[]; onExpand: (idx: number) => void }) {
  const [idx, setIdx] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const goTo = useCallback((i: number) => setIdx(Math.max(0, Math.min(i, urls.length - 1))), [urls.length])
  const prev = () => goTo((idx - 1 + urls.length) % urls.length)
  const next = () => goTo((idx + 1) % urls.length)

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const diffX = e.touches[0].clientX - touchStartX.current
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current)
    if (Math.abs(diffX) > diffY) { e.preventDefault(); setDragOffset(diffX) }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    setDragOffset(0)
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
    touchStartX.current = null; touchStartY.current = null
  }

  const containerWidth = containerRef.current?.offsetWidth || 300
  const totalOffset = -(idx * 100) + (dragOffset / containerWidth) * 100

  return (
    <div className="flex flex-col items-center w-full select-none">
      <div className="relative w-full overflow-hidden" ref={containerRef}>
        {urls.length > 1 && (
          <button onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 shadow-md border border-gray-200 text-purple-600 hover:bg-purple-50 transition-all"
            style={{ fontSize: 18 }}>‹</button>
        )}
        <div
          className="flex"
          style={{
            transform: `translateX(${totalOffset}%)`,
            transition: dragOffset !== 0 ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {urls.map((url, i) => (
            <div key={i} className="flex-shrink-0 w-full flex items-center justify-center px-10">
              <div className="relative">
                <img src={url} alt={`View ${i + 1}`}
                  className="rounded-xl object-contain mx-auto"
                  style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block' }}
                  draggable={false} />
                {/* Expand button — works on desktop and mobile */}
                <button
                  onClick={() => onExpand(i)}
                  className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/95 shadow-md border border-gray-200 flex items-center justify-center text-purple-600 hover:bg-purple-50 transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        {urls.length > 1 && (
          <button onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 shadow-md border border-gray-200 text-purple-600 hover:bg-purple-50 transition-all"
            style={{ fontSize: 18 }}>›</button>
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex items-center gap-1.5 mt-3">
          {urls.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === idx ? 24 : 8, height: 4, background: i === idx ? 'linear-gradient(90deg,#6d3df3,#ff8c18)' : 'rgba(109,61,243,0.2)' }} />
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">{idx === 0 ? 'Original artwork' : `Product view ${idx} of ${urls.length - 1}`}</p>
    </div>
  )
}

function getBlueprintId(productId: string): number {
  const map: Record<string, number> = {
    'rolled-poster': 1220,
    'matte-canvas': 1159,
    'matte-canvas-framed': 944,
    'wall-tapestry': 241,
  }
  return map[productId] || 1220
}

// Pricing map — same as lib/products.ts
const PRICE_MAP: Record<string, Record<string, number>> = {
  'rolled-poster':       { '8×10"': 1800, '11×14"': 2400, '18×24"': 3500, '24×36"': 4800 },
  'matte-canvas':        { '8×10"': 3500, '12×16"': 4900, '16×20"': 6500, '20×24"': 8500 },
  'matte-canvas-framed': { '8×10"': 5500, '12×16"': 7500, '16×20"': 9500, '18×24"': 11500 },
  'wall-tapestry':       { '26×36"': 3800, '50×60"': 5500, '68×80"': 7500 },
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function SharedDesignClient({ share }: { share: Share }) {
  const [mockupUrls, setMockupUrls] = useState<string[]>([])
  const [loadingMockup, setLoadingMockup] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxStartIdx, setLightboxStartIdx] = useState(0)

  const allUrls = [share.image_url, ...mockupUrls]
  const price = PRICE_MAP[share.product_id]?.[share.size_name] || 0
  const shipping = 599 // $5.99 default
  const total = price + shipping

  useEffect(() => {
    const generateMockup = async () => {
      try {
        const res = await fetch('/api/mockup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: share.image_url,
            blueprintId: getBlueprintId(share.product_id),
            printProviderId: 99,
            variantId: share.variant_id,
          })
        })
        const data = await res.json()
        if (data.mockupUrls?.length) setMockupUrls(data.mockupUrls)
        else if (data.mockupUrl) setMockupUrls([data.mockupUrl])
      } catch (err) {
        console.error('Mockup error:', err)
      }
      setLoadingMockup(false)
    }
    generateMockup()
  }, [share])

  const openLightbox = (idx: number) => {
    setLightboxStartIdx(idx)
    setLightboxOpen(true)
  }

  // Store share data in sessionStorage so main app can pick it up
  const handleOrder = () => {
    sessionStorage.setItem('c2p_share_order', JSON.stringify({
      productId: share.product_id,
      sizeName: share.size_name,
      imageUrl: share.image_url,
      variantId: share.variant_id,
    }))
    window.location.href = '/?from_share=1'
  }

  return (
    <div className="min-h-screen bg-[#f8f8fc] text-[#071633]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {lightboxOpen && allUrls.length > 0 && (
        <Lightbox urls={allUrls} startIdx={lightboxStartIdx} onClose={() => setLightboxOpen(false)} />
      )}

      {/* Header — lower z-index so lightbox always appears above it */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/"><img src="/logo.png" alt="Create2Print" className="h-12 object-contain" /></a>
          <a href="/" className="text-sm font-bold text-[#6d3df3] hover:text-[#5924f5] transition-colors">Create Your Own →</a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="font-extrabold text-2xl sm:text-3xl text-[#071633] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Check out this AI-generated print!
          </h1>
          <p className="text-[#747aa2] text-sm">{share.product_name} · {share.size_name}</p>
          {share.prompt && (
            <p className="text-[#8a89a8] text-xs mt-1 italic max-w-md mx-auto">"{share.prompt}"</p>
          )}
        </div>

        {/* Carousel */}
        <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-4 mb-6">
          {loadingMockup ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <svg className="animate-spin w-10 h-10 text-[#6d3df3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
              <p className="text-[#8a89a8] text-sm animate-pulse">Loading product views...</p>
            </div>
          ) : (
            <Carousel urls={allUrls} onExpand={openLightbox} />
          )}
        </div>

        {/* Order CTA with real price */}
        <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-6 mb-6">
          <h2 className="font-extrabold text-xl text-[#071633] mb-1">Want this print?</h2>
          <p className="text-[#747aa2] text-sm mb-4">Order the exact same design — printed and shipped to your door.</p>

          <div className="rounded-xl bg-[#f9f7ff] border border-[#ddd9f7] p-4 mb-4">
            <div className="flex justify-between text-sm text-[#747aa2] mb-2">
              <span>{share.product_name} · {share.size_name}</span>
              <span>{formatPrice(price)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#747aa2] mb-3 pb-3 border-b border-[#ddd9f7]">
              <span>Shipping (US)</span>
              <span>$5.99</span>
            </div>
            <div className="flex justify-between font-extrabold text-[#071633] text-lg">
              <span>Total</span>
              <span className="bg-gradient-to-r from-[#6d3df3] to-[#ff8c18] bg-clip-text text-transparent">{formatPrice(total)}</span>
            </div>
          </div>

          <button onClick={handleOrder}
            className="block w-full text-center rounded-full bg-gradient-to-r from-[#6526f5] via-[#ef48a7] to-[#ff8c18] px-8 py-4 text-[17px] font-extrabold text-white shadow-[0_16px_40px_rgba(239,72,167,0.23)] transition hover:-translate-y-0.5">
            ✦ Order This Print →
          </button>
          <p className="text-center text-xs text-[#b0b5cc] mt-3">Powered by Printify · Secured by Stripe</p>
        </div>

        {/* Create your own */}
        <div className="text-center">
          <p className="text-[#747aa2] text-sm mb-3">Want to create your own custom AI artwork?</p>
          <a href="/" className="inline-block px-6 py-3 rounded-full border-2 border-[#6d3df3] text-[#6d3df3] font-bold text-sm hover:bg-[#6d3df3] hover:text-white transition-all">
            ✦ Create Your Own Design
          </a>
        </div>

        <p className="text-center text-xs text-[#c0c5d0] mt-8">
          This share link expires {new Date(share.expires_at).toLocaleDateString()}
        </p>
      </main>
    </div>
  )
}
