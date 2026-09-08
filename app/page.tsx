'use client'

import { useState, useEffect, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PRODUCTS, Product, Size, formatPrice, ProductId } from '@/lib/products'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type Step = 'product' | 'create' | 'preview' | 'shipping' | 'payment' | 'confirm'

interface ShippingInfo {
  firstName: string; lastName: string; email: string
  address1: string; city: string; state: string; zip: string; country: string
}

const COUNTRIES = ['US','GB','CA','AU','DE','FR','NL','SE','NO','DK','FI','IT','ES','PT','BE','CH','AT','NZ','JP','SG','IE','MX','BR','AR','ZA','IN','PH','MY','TH','ID']

const FAQ_ITEMS = [
  { q: 'How does Create2Print work?', a: 'Simply describe your idea, choose your product and size, and we generate a unique piece of AI artwork. Once you love it, check out and we handle the rest — printing and shipping directly to your door. The whole process takes under 5 minutes.' },
  { q: 'How long does shipping take?', a: 'Most orders are printed and shipped within 3–5 business days. Delivery typically takes an additional 3–7 business days depending on your location. You\'ll receive a tracking number via email as soon as your order ships.' },
  { q: 'Is my payment secure?', a: 'Yes. All payments are processed through Stripe, one of the world\'s most trusted payment processors. We never see or store your credit card information. Your transaction is fully encrypted end to end.' },
  { q: 'Can I upload my own image?', a: 'Yes — you can upload your own AI-generated or original artwork instead of generating one. We\'ll show you the recommended aspect ratio for your selected product so your image fits perfectly.' },
  { q: 'How many images can I generate?', a: 'Every visitor gets 3 free generations per session. Each generation produces one high-quality image using the latest AI model.' },
  { q: 'Will my image look good printed at large sizes?', a: 'Yes. Every image is automatically generated at the highest available resolution and optimized for your selected product size before your order is placed.' },
  { q: 'Who prints and ships my order?', a: 'Create2Print is proudly partnered with Printify, a globally trusted print-on-demand network with production facilities worldwide. Your order is printed on professional-grade equipment and shipped directly to you.' },
  { q: 'Can I order from outside the US?', a: 'Yes — we ship worldwide to most countries through our Printify print partners. Simply select your country during checkout.' },
  { q: 'What if my order gets lost in the mail?', a: 'Contact us at support@create2print.ai. We\'ll investigate with the carrier and either reship your order or issue a full refund.' },
]

// ── Size Preview Rectangle ─────────────────────────────────────────────
function SizePreview({ size, selected }: { size: Size; selected: boolean }) {
  const maxW = 52
  const maxH = 52
  const ratio = size.width / size.height
  let w, h
  if (ratio >= 1) { w = maxW; h = Math.round(maxW / ratio) }
  else { h = maxH; w = Math.round(maxH * ratio) }
  const orientation = ratio > 1.1 ? 'Landscape' : ratio < 0.9 ? 'Portrait' : 'Square'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ width: maxW, height: maxH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: w, height: h, background: selected ? 'linear-gradient(135deg,rgba(109,61,243,0.15),rgba(255,140,24,0.1))' : 'rgba(0,0,0,0.05)', border: selected ? '2px solid #6d3df3' : '2px solid #d0d0e0', borderRadius: 3, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 8, color: selected ? '#6d3df3' : '#aaa', fontWeight: 600, opacity: 0.7 }}>{size.width}×{size.height}</span>
        </div>
      </div>
      <div style={{ fontSize: 9, color: selected ? '#6d3df3' : '#aaa', fontWeight: 500 }}>{orientation}</div>
    </div>
  )
}

// ── Product Frame Mockup ───────────────────────────────────────────────
function ProductMockupFrame({ product, size, imageUrl, onClickImage }: { product: Product; size: Size; imageUrl: string; onClickImage: () => void }) {
  const ratio = size.width / size.height
  const maxH = 420
  const maxW = 520
  let imgW, imgH
  if (ratio >= 1) { imgW = maxW; imgH = Math.round(maxW / ratio) }
  else { imgH = maxH; imgW = Math.round(maxH * ratio) }

  const clickHint = (
    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all flex items-center justify-center cursor-zoom-in group"
      onClick={onClickImage}>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 shadow-lg">
        🔍 Click to view full size
      </div>
    </div>
  )

  if (product.id === 'matte-canvas-framed') {
    const frameSize = 22
    return (
      <div className="flex flex-col items-center">
        <div style={{ position: 'relative', width: imgW + frameSize * 2, height: imgH + frameSize * 2, background: '#1a1a1a', borderRadius: 4, padding: frameSize, boxShadow: '0 24px 70px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
          <img src={imageUrl} alt="Your design" style={{ width: imgW, height: imgH, objectFit: 'cover', display: 'block' }} />
          {clickHint}
        </div>
        <div className="mt-3 text-xs text-gray-400 font-medium">Black wood frame · {size.label}</div>
      </div>
    )
  }

  if (product.id === 'matte-canvas') {
    return (
      <div className="flex flex-col items-center">
        <div style={{ position: 'relative', width: imgW, height: imgH, boxShadow: '8px 8px 0 #d0cec8, 0 24px 60px rgba(0,0,0,0.18)', borderRadius: 2, overflow: 'hidden' }}>
          <img src={imageUrl} alt="Your design" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 3px rgba(0,0,0,0.08), inset 4px 4px 12px rgba(0,0,0,0.06)' }} />
          {clickHint}
        </div>
        <div className="mt-3 text-xs text-gray-400 font-medium">Gallery canvas wrap · {size.label} · 1.25" deep</div>
      </div>
    )
  }

  if (product.id === 'wall-tapestry') {
    return (
      <div className="flex flex-col items-center">
        <div style={{ background: '#8B7355', height: 12, width: imgW + 24, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', marginBottom: 2 }} />
        <div style={{ position: 'relative', width: imgW, height: imgH, boxShadow: '0 18px 50px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
          <img src={imageUrl} alt="Your design" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.03) 3px, rgba(255,255,255,0.03) 4px)', pointerEvents: 'none' }} />
          {clickHint}
        </div>
        <div className="mt-3 text-xs text-gray-400 font-medium">Woven tapestry · {size.label} · Rod pocket included</div>
      </div>
    )
  }

  // Poster
  return (
    <div className="flex flex-col items-center">
      <div style={{ position: 'relative', width: imgW, height: imgH, boxShadow: '0 24px 70px rgba(0,0,0,0.2)', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
        <img src={imageUrl} alt="Your design" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {clickHint}
      </div>
      <div className="mt-3 text-xs text-gray-400 font-medium">Matte poster print · {size.label}</div>
    </div>
  )
}

// ── Lightbox ───────────────────────────────────────────────────────────
function Lightbox({ imageUrl, product, size, onClose }: { imageUrl: string; product: Product | null; size: Size | null; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" style={{ background: 'rgba(0,0,0,0.93)' }} onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors">
          ✕ Close &nbsp;<span className="text-white/30 text-xs">(or press Esc)</span>
        </button>
        <img src={imageUrl} alt="Full size artwork" className="w-full h-auto rounded-xl shadow-2xl" style={{ maxHeight: '85vh', objectFit: 'contain' }} />
        {product && size && (
          <div className="text-center mt-4 text-white/40 text-xs">
            {product.name} · {size.label} ({size.width}" × {size.height}")
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stripe Checkout Form ──────────────────────────────────────────────
function CheckoutForm({ onSuccess, amount }: { onSuccess: () => void; amount: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true); setError(null)
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}?success=true` },
      redirect: 'if_required',
    })
    if (stripeError) { setError(stripeError.message || 'Payment failed'); setLoading(false) }
    else { onSuccess() }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}
      <button type="submit" disabled={!stripe || loading} className="gradient-btn w-full py-4 rounded-2xl font-bold text-sm tracking-widest uppercase" style={{ fontFamily: "'Syne', sans-serif" }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="spinner w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            Processing...
          </span>
        ) : `✦ Pay ${formatPrice(amount)}`}
      </button>
    </form>
  )
}

// ── FAQ Accordion ─────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full text-left py-5 flex items-center justify-between gap-4">
        <span className="font-semibold text-[15px] text-gray-800">{q}</span>
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200"
          style={{ background: open ? 'linear-gradient(135deg,#6d3df3,#ff8c18)' : '#f0f0f8', color: open ? 'white' : '#999', transform: open ? 'rotate(45deg)' : 'none' }}>
          +
        </span>
      </button>
      {open && <div className="pb-5 text-gray-500 text-sm leading-relaxed fade-up">{a}</div>}
    </div>
  )
}

// ── Step Indicator ────────────────────────────────────────────────────
function StepBar({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'product', label: 'Product' },
    { id: 'create', label: 'Create' },
    { id: 'preview', label: 'Preview' },
    { id: 'shipping', label: 'Details' },
    { id: 'payment', label: 'Pay' },
  ]
  const allSteps = ['product','create','preview','shipping','payment','confirm']
  const currentIdx = allSteps.indexOf(step)
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {steps.map((s, i) => {
        const thisIdx = allSteps.indexOf(s.id)
        const isDone = currentIdx > thisIdx
        const isActive = currentIdx === thisIdx
        return (
          <div key={s.id} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && <div className="hide-mobile w-6 sm:w-8 h-px" style={{ background: isDone ? 'linear-gradient(90deg,#6d3df3,#ff8c18)' : '#e0e0e8' }} />}
            <div className={`flex items-center gap-1.5 ${isActive ? 'opacity-100' : isDone ? 'opacity-70' : 'opacity-30'}`}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: isDone || isActive ? 'linear-gradient(135deg,#6d3df3,#ff8c18)' : '#e8e8f0', color: isDone || isActive ? 'white' : '#999' }}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className="hide-mobile text-xs font-medium" style={{ color: isActive ? '#6d3df3' : isDone ? '#6d3df3' : '#999' }}>{s.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────
export default function Home() {
  const [step, setStep] = useState<Step>('product')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [productImages, setProductImages] = useState<Record<string, string>>({})
  const [createMode, setCreateMode] = useState<'generate' | 'upload'>('generate')
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [mockupImage, setMockupImage] = useState<string | null>(null)
  const [printifyImageId, setPrintifyImageId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingMockup, setLoadingMockup] = useState(false)
  const [generationsLeft, setGenerationsLeft] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [shipping, setShipping] = useState<ShippingInfo>({ firstName:'',lastName:'',email:'',address1:'',city:'',state:'',zip:'',country:'US' })
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeImage = generatedImage || uploadedImage
  const total = (selectedSize?.price || 0) + 499

  useEffect(() => {
    PRODUCTS.forEach(async (product) => {
      try {
        const res = await fetch(`/api/products?blueprintId=${product.printifyBlueprintId}`)
        const data = await res.json()
        if (data.images?.[0]) setProductImages(prev => ({ ...prev, [product.id]: data.images[0] }))
      } catch {}
    })
  }, [])

  const generateMockup = async (imageUrl: string) => {
    if (!selectedProduct || !selectedSize) return
    setLoadingMockup(true)
    try {
      const res = await fetch('/api/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, blueprintId: selectedProduct.printifyBlueprintId, printProviderId: selectedProduct.printifyPrintProviderId, variantId: selectedSize.printifyVariantId }),
      })
      const data = await res.json()
      if (data.mockupUrl) setMockupImage(data.mockupUrl)
      if (data.printifyImageId) setPrintifyImageId(data.printifyImageId)
    } catch {}
    setLoadingMockup(false)
  }

  const createPaymentIntent = async () => {
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total, productName: selectedProduct?.name, size: selectedSize?.label }),
      })
      const data = await res.json()
      if (data.clientSecret) setClientSecret(data.clientSecret)
    } catch { setError('Failed to initialize payment. Please try again.') }
  }

  const placeOrder = async () => {
    if (!printifyImageId || !selectedProduct || !selectedSize) return
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printifyImageId, blueprintId: selectedProduct.printifyBlueprintId, printProviderId: selectedProduct.printifyPrintProviderId, variantId: selectedSize.printifyVariantId, shipping }),
      })
      const data = await res.json()
      if (data.orderId) setOrderId(data.orderId)
    } catch {}
    setStep('confirm')
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedSize || generationsLeft <= 0) return
    setGenerating(true); setError(null); setGeneratedImage(null); setMockupImage(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, width: selectedSize.width, height: selectedSize.height }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedImage(data.imageUrl)
      setGenerationsLeft(data.generationsLeft ?? generationsLeft - 1)
      await generateMockup(data.imageUrl)
      setStep('preview')
    } catch (e: any) { setError(e.message) }
    finally { setGenerating(false) }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setUploadedImage(dataUrl); setGeneratedImage(null); setMockupImage(null)
      await generateMockup(dataUrl)
      setStep('preview')
    }
    reader.readAsDataURL(file)
  }

  const handleShippingContinue = async () => {
    const { firstName, lastName, email, address1, city, zip, country } = shipping
    if (!firstName || !lastName || !email || !address1 || !city || !zip || !country) { setError('Please fill in all required fields'); return }
    setError(null)
    await createPaymentIntent()
    setStep('payment')
  }

  const reset = () => {
    setStep('product'); setSelectedProduct(null); setSelectedSize(null)
    setPrompt(''); setGeneratedImage(null); setUploadedImage(null)
    setMockupImage(null); setPrintifyImageId(null); setClientSecret(null)
    setOrderId(null); setError(null); setLightboxOpen(false)
    setShipping({ firstName:'',lastName:'',email:'',address1:'',city:'',state:'',zip:'',country:'US' })
  }

  const backBtn = "flex items-center gap-1 text-gray-400 text-sm hover:text-purple-600 transition-colors mb-8 font-medium"
  const primaryBtn = "gradient-btn w-full py-4 rounded-2xl font-bold text-sm tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed"

  return (
    <div className="c2p-shell min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Lightbox ── */}
      {lightboxOpen && (mockupImage || activeImage) && (
        <Lightbox
          imageUrl={mockupImage || activeImage || ''}
          product={selectedProduct}
          size={selectedSize}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* ── Header ── */}
      <header className="c2p-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button onClick={reset} className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="Create2Print" className="h-14 sm:h-16 object-contain" />
          </button>
          <StepBar step={step} />
          <div className="hide-mobile flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
            <div className="trust-icon">🌍</div>
            <div>
              <div className="font-semibold text-gray-700">Worldwide Shipping</div>
              <div className="text-gray-400">Fast, reliable, tracked delivery</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* ── STEP 1: Product Selection ── */}
        {step === 'product' && (
          <div className="fade-up">
            <div className="c2p-product-hero relative text-center mb-12 overflow-hidden py-6">
              <div className="paint-stroke-left hide-mobile" />
              <div className="hero-frame-art hide-mobile float">
                <div className="hero-frame-inner">
                  <div className="hero-frame-print" />
                </div>
              </div>
              <div className="hero-leaves hide-mobile" />
              <span className="hero-sparkle hero-sparkle-a hide-mobile">✦</span>
              <span className="hero-sparkle hero-sparkle-b hide-mobile">✦</span>
              <span className="hero-sparkle hero-sparkle-c hide-mobile">✦</span>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-6 ai-pill">
                ✦ AI-Powered Print Shop
              </div>
              <div className="relative z-10">
                <h1 className="hero-title font-extrabold leading-none mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Create It.</h1>
                <h1 className="hero-title hero-title-gradient-1 font-extrabold leading-none mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Print It.</h1>
                <h1 className="hero-title hero-title-gradient-2 font-extrabold leading-none mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>Hang It.</h1>
                <p className="hero-subtitle max-w-md mx-auto leading-relaxed">
                  Describe any artwork. We generate it, print it, and ship it to your door.
                </p>
              </div>
            </div>

            <div className="product-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {PRODUCTS.map(product => (
                <div key={product.id}>
                  <div onClick={() => { setSelectedProduct(product); setSelectedSize(null) }}
                    className={`product-card ${selectedProduct?.id === product.id ? 'selected' : ''} p-0`}>
                    <div className="product-image-wrap relative w-full aspect-[4/3] overflow-hidden bg-gray-50" style={{ borderRadius: 10 }}>
                      {productImages[product.id] ? (
                        <img src={productImages[product.id]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">{product.emoji}</div>
                      )}
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-sm shadow-sm">
                        {product.emoji}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="font-bold text-gray-900 mb-0.5">{product.name}</div>
                      <div className="text-gray-400 text-xs leading-relaxed mb-3">{product.material}</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400">from</div>
                          <div className="font-bold text-lg" style={{ color: '#6d3df3' }}>{formatPrice(product.sizes[0].price)}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ background: selectedProduct?.id === product.id ? 'linear-gradient(135deg,#6d3df3,#ff8c18)' : '#e8e8f0', color: selectedProduct?.id === product.id ? 'white' : '#999' }}>
                          →
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedProduct?.id === product.id && (
                    <div className="mt-3 fade-up">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Select Size</div>
                      <div className="grid grid-cols-2 gap-2">
                        {product.sizes.map(size => (
                          <button key={size.label} onClick={() => setSelectedSize(size)}
                            className="py-3 px-3 rounded-xl border-2 text-center transition-all"
                            style={{ borderColor: selectedSize?.label === size.label ? '#6d3df3' : '#e8e8f0', background: selectedSize?.label === size.label ? 'rgba(109,61,243,0.05)' : 'white' }}>
                            <div className="flex justify-center mb-2">
                              <SizePreview size={size} selected={selectedSize?.label === size.label} />
                            </div>
                            <div className="font-bold text-sm" style={{ color: selectedSize?.label === size.label ? '#6d3df3' : '#444' }}>{size.label}</div>
                            <div className="text-xs mt-0.5" style={{ color: selectedSize?.label === size.label ? '#6d3df3' : '#aaa' }}>{formatPrice(size.price)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="max-w-lg mx-auto">
              <button onClick={() => { if (selectedProduct && selectedSize) setStep('create') }}
                disabled={!selectedProduct || !selectedSize}
                className="gradient-btn c2p-main-cta w-full rounded-2xl font-bold text-base tracking-widest uppercase flex items-center justify-center gap-3"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                ✦ CONTINUE – DESIGN YOUR ART →
              </button>
            </div>

            <div className="trust-row flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10 text-sm">
              {[
                { icon: '✦', label: 'AI-Generated Art', sub: 'Unique to you' },
                { icon: '🎖️', label: 'Premium Quality', sub: 'Museum grade prints' },
                { icon: '🚚', label: 'Worldwide Shipping', sub: 'Fast & tracked' },
                { icon: '🔒', label: 'Secure Checkout', sub: 'Safe & protected' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="trust-icon">{item.icon}</div>
                  <div>
                    <div className="font-semibold text-gray-700 text-xs">{item.label}</div>
                    <div className="text-gray-400 text-xs">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Create ── */}
        {step === 'create' && (
          <div className="fade-up max-w-lg mx-auto">
            <button onClick={() => setStep('product')} className={backBtn}>← Back to products</button>
            <div className="flex items-center gap-3 p-4 rounded-2xl mb-6 border-2"
              style={{ background: 'rgba(109,61,243,0.04)', borderColor: 'rgba(109,61,243,0.15)' }}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {productImages[selectedProduct?.id || ''] ? (
                  <img src={productImages[selectedProduct?.id || '']} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">{selectedProduct?.emoji}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800">{selectedProduct?.name}</div>
                <div className="text-sm" style={{ color: '#6d3df3' }}>{selectedSize?.label} ({selectedSize?.width}" × {selectedSize?.height}") · {selectedSize?.aspectRatio}</div>
              </div>
              <div className="font-bold text-lg" style={{ color: '#6d3df3' }}>{formatPrice(selectedSize?.price || 0)}</div>
            </div>

            <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
              <button onClick={() => setCreateMode('generate')} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: createMode === 'generate' ? 'white' : 'transparent', color: createMode === 'generate' ? '#6d3df3' : '#999', boxShadow: createMode === 'generate' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                ✦ AI Generate
              </button>
              <button onClick={() => setCreateMode('upload')} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: createMode === 'upload' ? 'white' : 'transparent', color: createMode === 'upload' ? '#6d3df3' : '#999', boxShadow: createMode === 'upload' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                ↑ Upload Image
              </button>
            </div>

            {createMode === 'generate' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Describe your artwork</label>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                    placeholder="A majestic snow-capped mountain range at golden hour, oil painting style, dramatic clouds..."
                    rows={5} className="c2p-input resize-none leading-relaxed" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-2 font-medium">Quick ideas →</div>
                  <div className="flex flex-wrap gap-2">
                    {['Anime girl in a cherry blossom forest, Studio Ghibli style','Retro synthwave city at night, neon lights','Abstract geometric mandala in gold and deep blue','Cute astronaut floating in colorful galaxy','Moody forest path in autumn, cinematic lighting'].map(s => (
                      <button key={s} onClick={() => setPrompt(s)}
                        className="text-xs px-3 py-1.5 rounded-full border-2 transition-all font-medium"
                        style={{ borderColor: '#e8e8f0', color: '#888', background: 'white' }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#6d3df3'; (e.target as HTMLElement).style.color = '#6d3df3' }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#e8e8f0'; (e.target as HTMLElement).style.color = '#888' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < generationsLeft ? 'linear-gradient(135deg,#6d3df3,#ff8c18)' : '#e0e0e8' }} />
                    ))}
                  </div>
                  <span>{generationsLeft} generation{generationsLeft !== 1 ? 's' : ''} remaining</span>
                </div>
                {error && <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 text-red-500 text-sm">{error}</div>}
                <button onClick={handleGenerate} disabled={generating || !prompt.trim() || generationsLeft <= 0}
                  className={primaryBtn} style={{ fontFamily: "'Syne', sans-serif" }}>
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="spinner w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                      Generating your artwork...
                    </span>
                  ) : '✦ Generate Artwork'}
                </button>
                {generating && <p className="text-center text-gray-400 text-xs pulse">Creating high-resolution artwork optimized for {selectedSize?.label} ({selectedSize?.width}" × {selectedSize?.height}") print... (~15 seconds)</p>}
              </div>
            )}

            {createMode === 'upload' && (
              <div className="space-y-4">
                <div className="rounded-2xl p-4 border-2" style={{ background: 'rgba(251,191,36,0.05)', borderColor: 'rgba(251,191,36,0.3)' }}>
                  <div className="flex gap-3">
                    <span className="text-xl flex-shrink-0">⚠️</span>
                    <div>
                      <div className="font-bold text-sm mb-1" style={{ color: '#92400e' }}>Aspect Ratio Notice</div>
                      <div className="text-xs leading-relaxed" style={{ color: '#78350f' }}>{selectedProduct?.uploadAspectRatioNote}</div>
                      <div className="text-xs mt-1 font-bold" style={{ color: '#92400e' }}>Recommended ratio for {selectedSize?.label} ({selectedSize?.width}" × {selectedSize?.height}"): <strong>{selectedSize?.aspectRatio}</strong></div>
                    </div>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-2xl p-12 text-center transition-all bg-white"
                  style={{ borderColor: '#e0e0f0' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#6d3df3')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e0f0')}>
                  <div className="text-5xl mb-3">📁</div>
                  <div className="font-bold text-gray-700">Click to upload your image</div>
                  <div className="text-gray-400 text-sm mt-1">PNG, JPG, WEBP supported</div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === 'preview' && (
          <div className="fade-up max-w-3xl mx-auto">
            <button onClick={() => setStep('create')} className={backBtn}>← Try again</button>

            <div className="text-center mb-6">
              <h2 className="font-extrabold text-3xl mb-1" style={{ fontFamily: "'Syne', sans-serif", color: '#071633' }}>
                {loadingMockup ? 'Generating preview...' : 'Looking great! 🎉'}
              </h2>
              <p className="text-gray-400 text-sm">
                {selectedProduct?.name} · <strong>{selectedSize?.label}</strong> ({selectedSize?.width}" wide × {selectedSize?.height}" tall)
              </p>
            </div>

            {/* Product frame mockup — bigger, clickable */}
            <div className="flex justify-center mb-4">
              {loadingMockup ? (
                <div className="flex flex-col items-center justify-center gap-3 py-24">
                  <svg className="spinner w-10 h-10" style={{ color: '#6d3df3' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  <p className="text-gray-400 text-sm pulse">Placing your design on the product...</p>
                </div>
              ) : activeImage && selectedProduct && selectedSize ? (
                <ProductMockupFrame
                  product={selectedProduct}
                  size={selectedSize}
                  imageUrl={mockupImage || activeImage}
                  onClickImage={() => setLightboxOpen(true)}
                />
              ) : null}
            </div>

            {/* Click to zoom hint */}
            {!loadingMockup && activeImage && (
              <p className="text-center text-xs text-gray-400 mb-4">
                🔍 Click the image to view full size
              </p>
            )}

            {/* Dimensions */}
            {!loadingMockup && selectedSize && (
              <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(109,61,243,0.07)', color: '#6d3df3', border: '1px solid rgba(109,61,243,0.15)' }}>
                  📐 {selectedSize.width}" wide × {selectedSize.height}" tall
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(109,61,243,0.07)', color: '#6d3df3', border: '1px solid rgba(109,61,243,0.15)' }}>
                  {selectedSize.aspectRatio} ratio
                </div>
              </div>
            )}

            {/* Order summary */}
            <div className="rounded-2xl p-5 mb-5 border-2" style={{ background: 'rgba(109,61,243,0.03)', borderColor: 'rgba(109,61,243,0.1)' }}>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{selectedProduct?.name} · {selectedSize?.label} ({selectedSize?.width}" × {selectedSize?.height}")</span>
                <span>{formatPrice(selectedSize?.price || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-3 pb-3 border-b border-gray-100">
                <span>Shipping (estimated)</span>
                <span>~$4.99</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-lg">
                <span>Total</span>
                <span style={{ background: 'linear-gradient(135deg,#6d3df3,#ff8c18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <button onClick={() => setStep('shipping')} disabled={loadingMockup} className={primaryBtn} style={{ fontFamily: "'Syne', sans-serif" }}>
              ✦ Ship This to Me →
            </button>
            <button onClick={() => setStep('create')} className="w-full text-center text-gray-400 text-sm mt-3 hover:text-gray-600 transition-colors py-2">
              Start over with a different design
            </button>
          </div>
        )}

        {/* ── STEP 4: Shipping ── */}
        {step === 'shipping' && (
          <div className="fade-up max-w-lg mx-auto">
            <button onClick={() => setStep('preview')} className={backBtn}>← Back to preview</button>
            <h2 className="font-extrabold text-3xl mb-1" style={{ fontFamily: "'Syne', sans-serif", color: '#071633' }}>Where should we send it?</h2>
            <p className="text-gray-400 text-sm mb-6">Worldwide shipping available.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="c2p-input" placeholder="First name *" value={shipping.firstName} onChange={e => setShipping(p => ({ ...p, firstName: e.target.value }))} />
                <input className="c2p-input" placeholder="Last name *" value={shipping.lastName} onChange={e => setShipping(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <input className="c2p-input" type="email" placeholder="Email address *" value={shipping.email} onChange={e => setShipping(p => ({ ...p, email: e.target.value }))} />
              <input className="c2p-input" placeholder="Street address *" value={shipping.address1} onChange={e => setShipping(p => ({ ...p, address1: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className="c2p-input" placeholder="City *" value={shipping.city} onChange={e => setShipping(p => ({ ...p, city: e.target.value }))} />
                <input className="c2p-input" placeholder="State / Province" value={shipping.state} onChange={e => setShipping(p => ({ ...p, state: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="c2p-input" placeholder="ZIP / Postal code *" value={shipping.zip} onChange={e => setShipping(p => ({ ...p, zip: e.target.value }))} />
                <select className="c2p-input" value={shipping.country} onChange={e => setShipping(p => ({ ...p, country: e.target.value }))}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl p-4 mt-5 border-2" style={{ background: 'rgba(109,61,243,0.03)', borderColor: 'rgba(109,61,243,0.1)' }}>
              <span className="text-sm text-gray-500">{selectedProduct?.emoji} {selectedProduct?.name} · {selectedSize?.label}</span>
              <span className="font-bold" style={{ background: 'linear-gradient(135deg,#6d3df3,#ff8c18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{formatPrice(total)}</span>
            </div>
            {error && <div className="mt-4 bg-red-50 border-2 border-red-100 rounded-2xl p-4 text-red-500 text-sm">{error}</div>}
            <div className="mt-5">
              <button onClick={handleShippingContinue} className={primaryBtn} style={{ fontFamily: "'Syne', sans-serif" }}>
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Payment ── */}
        {step === 'payment' && clientSecret && (
          <div className="fade-up max-w-lg mx-auto">
            <button onClick={() => setStep('shipping')} className={backBtn}>← Back</button>
            <h2 className="font-extrabold text-3xl mb-1" style={{ fontFamily: "'Syne', sans-serif", color: '#071633' }}>Secure Checkout</h2>
            <p className="text-gray-400 text-sm mb-6">Powered by Stripe. Your card info is never stored.</p>
            <div className="rounded-2xl p-5 mb-6 border-2" style={{ background: 'rgba(109,61,243,0.03)', borderColor: 'rgba(109,61,243,0.1)' }}>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{selectedProduct?.name} · {selectedSize?.label} ({selectedSize?.width}" × {selectedSize?.height}")</span>
                <span>{formatPrice(selectedSize?.price || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-3 pb-3 border-b border-gray-100">
                <span>Shipping to {shipping.country}</span>
                <span>~$4.99</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-lg">
                <span>Total due today</span>
                <span style={{ background: 'linear-gradient(135deg,#6d3df3,#ff8c18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{formatPrice(total)}</span>
              </div>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#6d3df3', borderRadius: '12px' } } }}>
              <CheckoutForm onSuccess={async () => { await placeOrder() }} amount={total} />
            </Elements>
            <div className="flex items-center justify-center gap-5 mt-5 text-xs text-gray-300">
              <span>🔒 SSL encrypted</span>
              <span>💳 Powered by Stripe</span>
              <span>🖨️ Fulfilled by Printify</span>
            </div>
          </div>
        )}

        {/* ── STEP 6: Confirmation ── */}
        {step === 'confirm' && (
          <div className="fade-up text-center py-12 max-w-lg mx-auto">
            <div className="text-7xl mb-6">🎉</div>
            <h2 className="font-extrabold text-4xl mb-2" style={{ fontFamily: "'Syne', sans-serif", color: '#071633' }}>Order Placed!</h2>
            <p className="text-gray-500 mb-1">Your {selectedProduct?.name} ({selectedSize?.label}) is being printed and will ship soon.</p>
            <p className="text-gray-400 text-sm mb-8">Tracking info will be sent to <strong>{shipping.email}</strong></p>
            {orderId && (
              <div className="inline-block rounded-2xl px-6 py-4 mb-8 border-2" style={{ background: 'rgba(109,61,243,0.04)', borderColor: 'rgba(109,61,243,0.15)' }}>
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Order ID</div>
                <div className="font-mono text-sm font-bold" style={{ background: 'linear-gradient(135deg,#6d3df3,#ff8c18)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{orderId}</div>
              </div>
            )}
            <button onClick={reset} className={`${primaryBtn} max-w-xs mx-auto`} style={{ fontFamily: "'Syne', sans-serif" }}>
              ✦ Create Another Print
            </button>
            <p className="text-gray-300 text-xs mt-8">
              Questions? <a href="mailto:support@create2print.ai" className="underline hover:text-gray-500">support@create2print.ai</a>
            </p>
          </div>
        )}
      </main>

      {/* ── FAQ ── */}
      {(step === 'product' || step === 'confirm') && (
        <section style={{ background: '#f4f3ff' }} className="border-t border-gray-100 mt-4">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="font-extrabold text-3xl mb-2 text-center" style={{ fontFamily: "'Syne', sans-serif", color: '#071633' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-center text-gray-400 text-sm mb-8">Everything you need to know about Create2Print</p>
            <div className="bg-white rounded-2xl border border-gray-100 px-6 divide-y divide-gray-50 shadow-sm">
              {FAQ_ITEMS.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/logo.png" alt="Create2Print" className="h-10 object-contain" />
        </div>
        <div className="mb-2 text-gray-300">Powered by Printify & Stripe</div>
        <div className="flex items-center justify-center gap-4">
          <a href="mailto:support@create2print.ai" className="hover:text-gray-600 transition-colors">support@create2print.ai</a>
          <span>·</span>
          <span>© 2025 Create2Print. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
