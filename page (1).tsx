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

// ── Stripe Checkout Form ──────────────────────────────────────────────
function CheckoutForm({ onSuccess, amount }: { onSuccess: () => void; amount: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)
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
          style={{ background: open ? 'linear-gradient(135deg,#7b2ff7,#ff6b00)' : '#f0f0f8', color: open ? 'white' : '#999', transform: open ? 'rotate(45deg)' : 'none' }}>
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
            {i > 0 && (
              <div className="hide-mobile w-6 sm:w-8 h-px" style={{ background: isDone ? 'linear-gradient(90deg,#7b2ff7,#ff6b00)' : '#e0e0e8' }} />
            )}
            <div className={`flex items-center gap-1.5 ${isActive ? 'opacity-100' : isDone ? 'opacity-70' : 'opacity-30'}`}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: isDone || isActive ? 'linear-gradient(135deg,#7b2ff7,#ff6b00)' : '#e8e8f0', color: isDone || isActive ? 'white' : '#999' }}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className="hide-mobile text-xs font-medium" style={{ color: isActive ? '#7b2ff7' : isDone ? '#7b2ff7' : '#999' }}>{s.label}</span>
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
    setOrderId(null); setError(null)
    setShipping({ firstName:'',lastName:'',email:'',address1:'',city:'',state:'',zip:'',country:'US' })
  }

  // ── Shared styles ──
  const backBtn = "flex items-center gap-1 text-gray-400 text-sm hover:text-purple-600 transition-colors mb-8 font-medium"
  const primaryBtn = "gradient-btn w-full py-4 rounded-2xl font-bold text-sm tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed"

  return (
    <div className="min-h-screen" style={{ background: '#f8f8fc', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button onClick={reset} className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="Create2Print" className="h-10 sm:h-12 object-contain" />
          </button>
          <StepBar step={step} />
          <div className="hide-mobile flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,rgba(123,47,247,0.1),rgba(255,107,0,0.1))' }}>
              🌍
            </div>
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
            {/* Hero section */}
            <div className="relative text-center mb-12 overflow-hidden py-6">
              {/* Paint brush blob */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none hide-mobile"
                style={{ background: 'linear-gradient(135deg,rgba(255,150,100,0.4),rgba(200,80,255,0.3),rgba(123,47,247,0.2))', borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%', filter: 'blur(1px)', transform: 'translateY(-50%) rotate(-10deg)' }} />

              {/* Floating artwork preview */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-40 h-48 hide-mobile float"
                style={{ background: 'linear-gradient(135deg,#a78bfa,#f472b6,#fb923c)', borderRadius: '4px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', transform: 'translateY(-50%) rotate(-3deg)', border: '8px solid white' }}>
                <div style={{ width:'100%',height:'100%',background:'linear-gradient(135deg,#1a0a3e,#7b2fb3,#ff6b35)',borderRadius:'2px' }}/>
              </div>

              {/* Sparkles */}
              <div className="absolute hide-mobile" style={{ left: '22%', top: '20%', fontSize: '22px', background: 'linear-gradient(135deg,#7b2ff7,#ff6b00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦</div>
              <div className="absolute hide-mobile" style={{ left: '18%', top: '55%', fontSize: '14px', background: 'linear-gradient(135deg,#f72f8e,#ff6b00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦</div>
              <div className="absolute hide-mobile" style={{ left: '26%', top: '70%', fontSize: '10px', background: 'linear-gradient(135deg,#7b2ff7,#f72f8e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✦</div>

              {/* AI badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase mb-6"
                style={{ background: 'rgba(123,47,247,0.08)', border: '1px solid rgba(123,47,247,0.2)', color: '#7b2ff7' }}>
                ✦ AI-Powered Print Shop
              </div>

              {/* Hero headline — matching design */}
              <div className="relative z-10">
                <h1 className="font-extrabold leading-none mb-2" style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(52px, 8vw, 88px)', color: '#1a1a2e' }}>
                  Create It.
                </h1>
                <h1 className="font-extrabold leading-none mb-2" style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(52px, 8vw, 88px)', background: 'linear-gradient(135deg,#a855f7,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Print It.
                </h1>
                <h1 className="font-extrabold leading-none mb-6" style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(52px, 8vw, 88px)', background: 'linear-gradient(135deg,#f97316,#eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Hang It.
                </h1>
                <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">
                  Describe any artwork. We generate it,<br className="hide-mobile" /> print it, and ship it to your door.
                </p>
              </div>
            </div>

            {/* Product cards — horizontal grid matching design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {PRODUCTS.map(product => (
                <div key={product.id}>
                  <div
                    onClick={() => { setSelectedProduct(product); setSelectedSize(null) }}
                    className={`product-card ${selectedProduct?.id === product.id ? 'selected' : ''} p-0`}
                  >
                    {/* Product image */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-t-2xl bg-gray-50">
                      {productImages[product.id] ? (
                        <img src={productImages[product.id]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">{product.emoji}</div>
                      )}
                      {/* Product type icon top right */}
                      <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-sm shadow-sm">
                        {product.emoji}
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="font-bold text-gray-900 mb-1">{product.name}</div>
                      <div className="text-gray-400 text-xs leading-relaxed mb-4">{product.material}</div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400">from</div>
                          <div className="font-bold text-lg" style={{ color: '#7b2ff7' }}>{formatPrice(product.sizes[0].price)}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ background: selectedProduct?.id === product.id ? 'linear-gradient(135deg,#7b2ff7,#ff6b00)' : '#e8e8f0', color: selectedProduct?.id === product.id ? 'white' : '#999' }}>
                          →
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Size selector appears below selected product on mobile */}
                  {selectedProduct?.id === product.id && (
                    <div className="mt-3 grid grid-cols-2 gap-2 fade-up">
                      {product.sizes.map(size => (
                        <button key={size.label} onClick={() => setSelectedSize(size)}
                          className="py-2.5 px-3 rounded-xl border-2 text-center transition-all text-sm font-medium"
                          style={{ borderColor: selectedSize?.label === size.label ? '#7b2ff7' : '#e8e8f0', background: selectedSize?.label === size.label ? 'rgba(123,47,247,0.06)' : 'white', color: selectedSize?.label === size.label ? '#7b2ff7' : '#666' }}>
                          <div>{size.label}</div>
                          <div className="text-xs opacity-70">{formatPrice(size.price)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* CTA Button — gradient matching design */}
            <div className="max-w-lg mx-auto">
              <button
                onClick={() => { if (selectedProduct && selectedSize) setStep('create') }}
                disabled={!selectedProduct || !selectedSize}
                className="gradient-btn w-full py-5 rounded-2xl font-bold text-base tracking-widest uppercase flex items-center justify-center gap-3"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                ✦ CONTINUE – DESIGN YOUR ART →
              </button>
            </div>

            {/* Trust bar */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10 text-sm text-gray-500">
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

            {/* Product badge */}
            <div className="flex items-center gap-3 p-4 rounded-2xl mb-6 border-2"
              style={{ background: 'rgba(123,47,247,0.04)', borderColor: 'rgba(123,47,247,0.15)' }}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {productImages[selectedProduct?.id || ''] ? (
                  <img src={productImages[selectedProduct?.id || '']} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">{selectedProduct?.emoji}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800">{selectedProduct?.name}</div>
                <div className="text-sm" style={{ color: '#7b2ff7' }}>{selectedSize?.label} · {selectedSize?.aspectRatio} ratio</div>
              </div>
              <div className="font-bold text-lg" style={{ color: '#7b2ff7' }}>{formatPrice(selectedSize?.price || 0)}</div>
            </div>

            {/* Mode toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
              <button onClick={() => setCreateMode('generate')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: createMode === 'generate' ? 'white' : 'transparent', color: createMode === 'generate' ? '#7b2ff7' : '#999', boxShadow: createMode === 'generate' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                ✦ AI Generate
              </button>
              <button onClick={() => setCreateMode('upload')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: createMode === 'upload' ? 'white' : 'transparent', color: createMode === 'upload' ? '#7b2ff7' : '#999', boxShadow: createMode === 'upload' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
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
                        onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#7b2ff7'; (e.target as HTMLElement).style.color = '#7b2ff7' }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#e8e8f0'; (e.target as HTMLElement).style.color = '#888' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generations remaining */}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < generationsLeft ? 'linear-gradient(135deg,#7b2ff7,#ff6b00)' : '#e0e0e8' }} />
                    ))}
                  </div>
                  <span>{generationsLeft} generation{generationsLeft !== 1 ? 's' : ''} remaining</span>
                </div>

                {error && <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 text-red-500 text-sm">{error}</div>}

                <button onClick={handleGenerate} disabled={generating || !prompt.trim() || generationsLeft <= 0}
                  className={`${primaryBtn}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="spinner w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                      Generating your artwork...
                    </span>
                  ) : '✦ Generate Artwork'}
                </button>

                {generating && <p className="text-center text-gray-400 text-xs pulse">Creating high-resolution artwork optimized for {selectedSize?.label} print... (~15 seconds)</p>}
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
                      <div className="text-xs mt-1 font-bold" style={{ color: '#92400e' }}>Recommended: <strong>{selectedSize?.aspectRatio}</strong></div>
                    </div>
                  </div>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-2xl p-12 text-center transition-all group bg-white"
                  style={{ borderColor: '#e0e0f0' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#7b2ff7')}
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
          <div className="fade-up max-w-lg mx-auto">
            <button onClick={() => setStep('create')} className={backBtn}>← Try again</button>

            <div className="text-center mb-6">
              <h2 className="font-extrabold text-3xl mb-1" style={{ fontFamily: "'Syne', sans-serif", color: '#1a1a2e' }}>
                {loadingMockup ? 'Generating preview...' : 'Looking great! 🎉'}
              </h2>
              <p className="text-gray-400 text-sm">Here's how your {selectedProduct?.name} will look</p>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-gray-100 shadow-xl mb-5 bg-gray-50">
              {loadingMockup ? (
                <div className="aspect-square flex flex-col items-center justify-center gap-3">
                  <svg className="spinner w-10 h-10" style={{ color: '#7b2ff7' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  <p className="text-gray-400 text-sm pulse">Placing your design on the product...</p>
                </div>
              ) : (
                <img src={mockupImage || activeImage || ''} alt="Your design" className="w-full object-contain" style={{ maxHeight: '480px', background: '#f9f9f9' }} />
              )}
            </div>

            {mockupImage && activeImage && (
              <div className="mb-5">
                <div className="text-xs text-gray-400 mb-2 text-center font-medium uppercase tracking-wider">Your generated artwork</div>
                <img src={activeImage} alt="Generated art" className="w-full rounded-2xl border-2 border-gray-100 object-cover" style={{ maxHeight: '200px', objectFit: 'cover' }} />
              </div>
            )}

            {/* Order summary */}
            <div className="rounded-2xl p-5 mb-5 border-2" style={{ background: 'rgba(123,47,247,0.03)', borderColor: 'rgba(123,47,247,0.1)' }}>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{selectedProduct?.name} · {selectedSize?.label}</span>
                <span>{formatPrice(selectedSize?.price || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-3 pb-3 border-b border-gray-100">
                <span>Shipping (estimated)</span>
                <span>~$4.99</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-lg">
                <span>Total</span>
                <span style={{ background: 'linear-gradient(135deg,#7b2ff7,#ff6b00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
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

            <h2 className="font-extrabold text-3xl mb-1" style={{ fontFamily: "'Syne', sans-serif", color: '#1a1a2e' }}>Where should we send it?</h2>
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

            <div className="flex items-center justify-between rounded-2xl p-4 mt-5 border-2" style={{ background: 'rgba(123,47,247,0.03)', borderColor: 'rgba(123,47,247,0.1)' }}>
              <span className="text-sm text-gray-500">{selectedProduct?.emoji} {selectedProduct?.name} · {selectedSize?.label}</span>
              <span className="font-bold" style={{ background: 'linear-gradient(135deg,#7b2ff7,#ff6b00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{formatPrice(total)}</span>
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

            <h2 className="font-extrabold text-3xl mb-1" style={{ fontFamily: "'Syne', sans-serif", color: '#1a1a2e' }}>Secure Checkout</h2>
            <p className="text-gray-400 text-sm mb-6">Powered by Stripe. Your card info is never stored.</p>

            <div className="rounded-2xl p-5 mb-6 border-2" style={{ background: 'rgba(123,47,247,0.03)', borderColor: 'rgba(123,47,247,0.1)' }}>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>{selectedProduct?.name} · {selectedSize?.label}</span>
                <span>{formatPrice(selectedSize?.price || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-3 pb-3 border-b border-gray-100">
                <span>Shipping to {shipping.country}</span>
                <span>~$4.99</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-lg">
                <span>Total due today</span>
                <span style={{ background: 'linear-gradient(135deg,#7b2ff7,#ff6b00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{formatPrice(total)}</span>
              </div>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#7b2ff7', borderRadius: '12px' } } }}>
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
            <h2 className="font-extrabold text-4xl mb-2" style={{ fontFamily: "'Syne', sans-serif", color: '#1a1a2e' }}>Order Placed!</h2>
            <p className="text-gray-500 mb-1">Your {selectedProduct?.name} is being printed and will ship soon.</p>
            <p className="text-gray-400 text-sm mb-8">Tracking info will be sent to <strong>{shipping.email}</strong></p>

            {orderId && (
              <div className="inline-block rounded-2xl px-6 py-4 mb-8 border-2" style={{ background: 'rgba(123,47,247,0.04)', borderColor: 'rgba(123,47,247,0.15)' }}>
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Order ID</div>
                <div className="font-mono text-sm font-bold" style={{ background: 'linear-gradient(135deg,#7b2ff7,#ff6b00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{orderId}</div>
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
        <section style={{ background: '#f0f0fa' }} className="border-t border-gray-100 mt-4">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="font-extrabold text-3xl mb-2 text-center" style={{ fontFamily: "'Syne', sans-serif", color: '#1a1a2e' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-center text-gray-400 text-sm mb-8">Everything you need to know about Create2Print</p>
            <div className="bg-white rounded-2xl border-2 border-gray-100 px-6 divide-y divide-gray-50 shadow-sm">
              {FAQ_ITEMS.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img src="/logo.png" alt="Create2Print" className="h-7 object-contain" />
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
