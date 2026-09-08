'use client'

import { useState, useEffect, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PRODUCTS, Product, Size, formatPrice } from '@/lib/products'

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
  { q: 'What if my order gets lost in the mail?', a: 'Contact us at support@create2print.store. We\'ll investigate with the carrier and either reship your order or issue a full refund.' },
]

const ALL_PROMPTS = [
  'Anime girl in a cherry blossom forest, Studio Ghibli style',
  'Retro synthwave city at night, neon lights, 80s aesthetic',
  'Abstract geometric mandala in gold and deep blue',
  'Cute astronaut floating in a colorful galaxy, cartoon style',
  'Moody forest path in autumn, cinematic lighting',
  'A lone wolf howling at a full moon over snowy mountains',
  'Tropical beach at sunset, warm golden tones, photorealistic',
  'Watercolor painting of a cozy cabin in a snowy forest',
  'Dragon soaring over a fantasy city, epic scale, dramatic sky',
  'Minimalist Japanese landscape, Mount Fuji at dawn, pastel tones',
  'Abstract fluid art in deep purple and gold, luxury feel',
  'Neon-lit Tokyo street at night, rain reflections, cinematic',
  'Cute cat portrait in oil painting style, rich colors',
  'Space nebula with a lone astronaut, vast and dramatic',
  'Vintage travel poster of Paris, art deco style',
  'Underwater scene with bioluminescent creatures, deep ocean blue',
  'Mountain range at golden hour, oil painting, impressionist style',
  'Cyberpunk cityscape from above, neon and rain',
  'Botanical illustration of tropical flowers, detailed and vibrant',
  'Portrait of a lion in royal attire, regal and majestic',
  'Surreal floating islands with waterfalls, fantasy landscape',
  'Cozy coffee shop interior, warm lighting, rainy window',
  'Wolf pack in a moonlit snowy forest, dramatic and cinematic',
  'Colorful koi fish in a zen garden pond, Japanese art style',
  'A futuristic spaceship above an alien planet, epic sci-fi',
]

function getRandomPrompts() {
  return [...ALL_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 5)
}

function getSizeShape(width: number, height: number) {
  const ratio = width / height
  if (ratio > 1.3) return { w: 44, h: 26 }
  if (ratio < 0.77) return { w: 26, h: 40 }
  return { w: 32, h: 32 }
}

function ProductMockupFrame({ product, size, imageUrl, onClickImage }: { product: Product; size: Size; imageUrl: string; onClickImage: () => void }) {
  const ratio = size.width / size.height
  const maxH = 400; const maxW = 480
  let imgW, imgH
  if (ratio >= 1) { imgW = maxW; imgH = Math.round(maxW / ratio) }
  else { imgH = maxH; imgW = Math.round(maxH * ratio) }

  const clickHint = (
    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-all flex items-center justify-center cursor-zoom-in group" onClick={onClickImage}>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 shadow-lg">🔍 Click to view full size</div>
    </div>
  )

  if (product.id === 'matte-canvas-framed') {
    const f = 22
    return (
      <div className="flex flex-col items-center">
        <div style={{ position:'relative', width:imgW+f*2, height:imgH+f*2, background:'#1a1a1a', borderRadius:4, padding:f, boxShadow:'0 24px 70px rgba(0,0,0,0.28)' }}>
          <img src={imageUrl} alt="Your design" style={{ width:imgW, height:imgH, objectFit:'cover', display:'block' }} />
          {clickHint}
        </div>
        <div className="mt-3 text-xs text-gray-400 font-medium">Black wood frame · {size.label}</div>
      </div>
    )
  }
  if (product.id === 'matte-canvas') {
    return (
      <div className="flex flex-col items-center">
        <div style={{ position:'relative', width:imgW, height:imgH, boxShadow:'8px 8px 0 #d0cec8, 0 24px 60px rgba(0,0,0,0.18)', borderRadius:2, overflow:'hidden' }}>
          <img src={imageUrl} alt="Your design" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 0 3px rgba(0,0,0,0.08)' }} />
          {clickHint}
        </div>
        <div className="mt-3 text-xs text-gray-400 font-medium">Gallery canvas wrap · {size.label} · 1.25" deep</div>
      </div>
    )
  }
  if (product.id === 'wall-tapestry') {
    return (
      <div className="flex flex-col items-center">
        <div style={{ background:'#8B7355', height:12, width:imgW+24, borderRadius:3, boxShadow:'0 2px 8px rgba(0,0,0,0.2)', marginBottom:2 }} />
        <div style={{ position:'relative', width:imgW, height:imgH, boxShadow:'0 18px 50px rgba(0,0,0,0.18)', overflow:'hidden' }}>
          <img src={imageUrl} alt="Your design" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          {clickHint}
        </div>
        <div className="mt-3 text-xs text-gray-400 font-medium">Woven tapestry · {size.label} · Rod pocket included</div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center">
      <div style={{ position:'relative', width:imgW, height:imgH, boxShadow:'0 24px 70px rgba(0,0,0,0.2)', borderRadius:2, overflow:'hidden', border:'1px solid rgba(0,0,0,0.06)' }}>
        <img src={imageUrl} alt="Your design" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        {clickHint}
      </div>
      <div className="mt-3 text-xs text-gray-400 font-medium">Matte poster print · {size.label}</div>
    </div>
  )
}

function Lightbox({ imageUrl, product, size, onClose }: { imageUrl: string; product: Product | null; size: Size | null; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" style={{ background:'rgba(0,0,0,0.93)' }} onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors">
          ✕ Close <span className="text-white/30 text-xs">(or press Esc)</span>
        </button>
        <img src={imageUrl} alt="Full size" className="w-full h-auto rounded-xl shadow-2xl" style={{ maxHeight:'85vh', objectFit:'contain' }} />
        {product && size && (
          <div className="text-center mt-4 text-white/40 text-xs">{product.name} · {size.label} ({size.width}" × {size.height}")</div>
        )}
      </div>
    </div>
  )
}

function CheckoutForm({ onSuccess, amount }: { onSuccess: () => void; amount: number }) {
  const stripe = useStripe(); const elements = useElements()
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!stripe || !elements) return
    setLoading(true); setError(null)
    const { error: stripeError } = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}?success=true` }, redirect: 'if_required' })
    if (stripeError) { setError(stripeError.message || 'Payment failed'); setLoading(false) } else { onSuccess() }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}
      <button type="submit" disabled={!stripe || loading}
        className="w-full rounded-full bg-gradient-to-r from-[#6526f5] via-[#ef48a7] to-[#ff8c18] px-8 py-[18px] text-[17px] font-extrabold text-white shadow-[0_16px_40px_rgba(239,72,167,0.23)] transition hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            Processing...
          </span>
        ) : `✦ Pay ${formatPrice(amount)}`}
      </button>
    </form>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full text-left py-5 flex items-center justify-between gap-4">
        <span className="font-bold text-[15px] text-[#071633]">{q}</span>
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200"
          style={{ background: open ? 'linear-gradient(135deg,#6d3df3,#ff8c18)' : '#f0f0f8', color: open ? 'white' : '#999', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && <div className="pb-5 text-[#747aa2] text-sm leading-relaxed">{a}</div>}
    </div>
  )
}

function StepBar({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'product', label: 'Product' }, { id: 'create', label: 'Create' },
    { id: 'preview', label: 'Preview' }, { id: 'shipping', label: 'Details' }, { id: 'payment', label: 'Pay' },
  ]
  const allSteps = ['product','create','preview','shipping','payment','confirm']
  const currentIdx = allSteps.indexOf(step)
  return (
    <div className="hidden lg:flex w-full max-w-[520px] items-start justify-between">
      {steps.map(({ id, label }, i) => {
        const thisIdx = allSteps.indexOf(id)
        const isDone = currentIdx > thisIdx; const isActive = currentIdx === thisIdx
        return (
          <div key={id} className="relative flex min-w-[82px] flex-col items-center">
            {i < steps.length - 1 && <div className="absolute left-[54px] top-[16px] h-px w-[72px] bg-[#ddd9f7]" />}
            <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isDone || isActive ? 'bg-[#5f25f5] text-white shadow-[0_8px_24px_rgba(95,37,245,0.28)]' : 'bg-[#efeff8] text-[#8484a6]'}`}>
              {isDone ? '✓' : i + 1}
            </div>
            <span className={`mt-1.5 text-xs font-semibold ${isActive ? 'text-[#5f25f5]' : 'text-[#8a89a8]'}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function Home() {
  const [step, setStep] = useState<Step>('product')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [productImages, setProductImages] = useState<Record<string, string>>({})
  const [createMode, setCreateMode] = useState<'generate' | 'upload'>('generate')
  const [prompt, setPrompt] = useState('')
  const [modifyPrompt, setModifyPrompt] = useState('')
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>(getRandomPrompts)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [mockupImage, setMockupImage] = useState<string | null>(null)
  const [printifyImageId, setPrintifyImageId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [modifying, setModifying] = useState(false)
  const [loadingMockup, setLoadingMockup] = useState(false)
  const [generationsLeft, setGenerationsLeft] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [modifyError, setModifyError] = useState<string | null>(null)
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
      const res = await fetch('/api/mockup', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ imageUrl, blueprintId: selectedProduct.printifyBlueprintId, printProviderId: selectedProduct.printifyPrintProviderId, variantId: selectedSize.printifyVariantId }) })
      const data = await res.json()
      if (data.mockupUrl) setMockupImage(data.mockupUrl)
      if (data.printifyImageId) setPrintifyImageId(data.printifyImageId)
    } catch {}
    setLoadingMockup(false)
  }

  const createPaymentIntent = async () => {
    try {
      const res = await fetch('/api/payment', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amount: total, productName: selectedProduct?.name, size: selectedSize?.label }) })
      const data = await res.json()
      if (data.clientSecret) setClientSecret(data.clientSecret)
    } catch { setError('Failed to initialize payment. Please try again.') }
  }

  const placeOrder = async () => {
    if (!printifyImageId || !selectedProduct || !selectedSize) return
    try {
      const res = await fetch('/api/order', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ printifyImageId, blueprintId: selectedProduct.printifyBlueprintId, printProviderId: selectedProduct.printifyPrintProviderId, variantId: selectedSize.printifyVariantId, shipping }) })
      const data = await res.json()
      if (data.orderId) setOrderId(data.orderId)
    } catch {}
    setStep('confirm')
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedSize || generationsLeft <= 0) return
    setGenerating(true); setError(null); setGeneratedImage(null); setMockupImage(null)
    try {
      const res = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt, width: selectedSize.width, height: selectedSize.height }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedImage(data.imageUrl)
      setGenerationsLeft(data.generationsLeft ?? generationsLeft - 1)
      await generateMockup(data.imageUrl)
      setStep('preview')
    } catch (e: any) { setError(e.message) }
    finally { setGenerating(false) }
  }

  const handleModify = async () => {
    if (!modifyPrompt.trim() || !selectedSize || generationsLeft <= 0) return
    setModifying(true); setModifyError(null); setMockupImage(null)
    try {
      const combinedPrompt = `${prompt}. Modification: ${modifyPrompt}`
      const res = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt: combinedPrompt, width: selectedSize.width, height: selectedSize.height }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGeneratedImage(data.imageUrl)
      setGenerationsLeft(data.generationsLeft ?? generationsLeft - 1)
      setModifyPrompt('')
      await generateMockup(data.imageUrl)
    } catch (e: any) { setModifyError(e.message) }
    finally { setModifying(false) }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string
      setUploadedImage(dataUrl); setGeneratedImage(null); setMockupImage(null)
      await generateMockup(dataUrl); setStep('preview')
    }
    reader.readAsDataURL(file)
  }

  const handleShippingContinue = async () => {
    const { firstName, lastName, email, address1, city, zip, country } = shipping
    if (!firstName || !lastName || !email || !address1 || !city || !zip || !country) { setError('Please fill in all required fields'); return }
    setError(null); await createPaymentIntent(); setStep('payment')
  }

  const reset = () => {
    setStep('product'); setSelectedProduct(null); setSelectedSize(null)
    setPrompt(''); setModifyPrompt(''); setGeneratedImage(null); setUploadedImage(null)
    setMockupImage(null); setPrintifyImageId(null); setClientSecret(null)
    setOrderId(null); setError(null); setModifyError(null); setLightboxOpen(false)
    setShipping({ firstName:'',lastName:'',email:'',address1:'',city:'',state:'',zip:'',country:'US' })
    setPromptSuggestions(getRandomPrompts())
  }

  const inputClass = "w-full border border-[#e0e0ed] rounded-2xl px-4 py-3 text-sm text-[#071633] outline-none focus:border-[#6d3df3] focus:ring-2 focus:ring-[#6d3df3]/10 transition-all bg-white shadow-[0_8px_22px_rgba(16,24,40,0.035)] font-['DM_Sans']"
  const backBtn = "flex items-center gap-1 text-[#8a89a8] text-sm hover:text-[#6d3df3] transition-colors mb-8 font-semibold"
  const primaryBtn = "w-full rounded-full bg-gradient-to-r from-[#6526f5] via-[#ef48a7] to-[#ff8c18] px-8 py-[18px] text-[17px] font-extrabold text-white shadow-[0_16px_40px_rgba(239,72,167,0.23)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(239,72,167,0.30)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"

  return (
    <div className="min-h-screen bg-[#f8f8fc] text-[#071633] overflow-x-hidden" style={{ fontFamily:"'DM Sans', sans-serif" }}>

      {lightboxOpen && (mockupImage || activeImage) && (
        <Lightbox imageUrl={mockupImage || activeImage || ''} product={selectedProduct} size={selectedSize} onClose={() => setLightboxOpen(false)} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 shadow-[0_4px_24px_rgba(35,31,84,0.05)] backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1540px] items-center justify-between px-4 sm:px-8">
          <div className="flex min-w-[120px] sm:min-w-[200px] items-center">
            <button onClick={reset}>
              <img src="/logo.png" alt="Create2Print" className="h-[48px] w-auto object-contain" />
            </button>
          </div>
          <div className="hidden flex-1 justify-center lg:flex">
            <StepBar step={step} />
          </div>
          <div className="flex min-w-[120px] sm:min-w-[200px] justify-end">
            <div className="flex items-center gap-2 rounded-full bg-[#f0ecff] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#4f24d8]">
              <span>🌐</span>
              <span className="hidden sm:inline">Worldwide Shipping</span>
              <span className="sm:hidden">Worldwide</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative overflow-x-hidden w-full">

        {/* ── STEP 1: Product ── */}
        {step === 'product' && (
          <>
            <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[300px] sm:w-[390px] opacity-90 overflow-hidden">
              <div className="absolute -left-24 top-14 h-28 w-[320px] sm:w-[390px] -rotate-12 rounded-full bg-gradient-to-r from-[#6d3df3] via-[#c52fed] to-transparent blur-[1px]" />
              <div className="absolute -left-32 top-32 h-24 w-[350px] sm:w-[420px] -rotate-6 rounded-full bg-gradient-to-r from-[#ef48a7] via-[#ff5f92] to-transparent blur-[1px]" />
              <div className="absolute -left-24 top-48 h-24 w-[320px] sm:w-[390px] rotate-[-13deg] rounded-full bg-gradient-to-r from-[#ff8c18] via-[#ffb12c] to-transparent blur-[1px]" />
            </div>

            <section className="relative mx-auto max-w-[1540px] px-4 sm:px-8 pt-8 sm:pt-10 w-full">
              <div className="relative min-h-[240px] sm:min-h-[300px]">
                <div className="mx-auto max-w-[720px] text-center">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#ede7ff] px-4 py-1.5 text-xs font-bold text-[#5723d9]">
                    <span>✦</span><span>AI-Powered Print Shop</span>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-4 sm:-left-8 top-20 text-2xl sm:text-3xl text-[#5e31ed]">✦</span>
                    <span className="absolute -right-4 sm:-right-8 top-4 text-2xl sm:text-3xl text-[#c43cf1]">✦</span>
                    <span className="absolute left-10 -top-3 text-xl sm:text-3xl text-[#ff9718]">✦</span>
                    <h1 className="font-extrabold leading-[0.94] tracking-[-0.045em]" style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                      <span className="block text-[#071633]" style={{ fontSize:'clamp(36px, 5.5vw, 68px)' }}>Create It.</span>
                      <span className="block bg-gradient-to-r from-[#6d3df3] via-[#ef48a7] to-[#ff8c18] bg-clip-text text-transparent" style={{ fontSize:'clamp(36px, 5.5vw, 68px)' }}>Print It.</span>
                      <span className="block bg-gradient-to-r from-[#ff8c18] via-[#ffb12c] to-[#f97316] bg-clip-text text-transparent" style={{ fontSize:'clamp(36px, 5.5vw, 68px)' }}>Hang It.</span>
                    </h1>
                  </div>
                  <p className="mx-auto mt-4 sm:mt-6 max-w-[580px] text-[15px] sm:text-[18px] leading-7 text-[#48527a]">
                    Describe any artwork. We generate it, print it, and ship it to your door.
                  </p>
                </div>
                <div className="absolute right-8 top-0 hidden xl:block">
                  <div className="rotate-[4deg] rounded-sm border-[10px] border-[#9a633d] bg-white p-3 shadow-[0_24px_50px_rgba(29,22,60,0.20)]">
                    <div className="h-[220px] w-[175px] bg-gradient-to-br from-[#1a0a3e] via-[#7b2fb3] to-[#ff6b35]" />
                  </div>
                </div>
              </div>

              <section className="mt-2 sm:mt-0">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {PRODUCTS.map(product => (
                    <div key={product.id}>
                      <article onClick={() => { setSelectedProduct(product); setSelectedSize(null) }}
                        className={`group relative overflow-hidden rounded-[16px] border bg-white p-2.5 shadow-[0_10px_28px_rgba(30,34,90,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#6d3df3] hover:shadow-[0_16px_38px_rgba(77,44,180,0.14)] cursor-pointer ${selectedProduct?.id === product.id ? 'border-[#6d3df3] ring-2 ring-[#6d3df3]/10' : 'border-white'}`}>
                        <div className="overflow-hidden rounded-[10px] bg-[#efedf3]">
                          {productImages[product.id] ? (
                            <img src={productImages[product.id]} alt={product.name} className="h-[170px] w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
                          ) : (
                            <div className="h-[170px] w-full flex items-center justify-center text-4xl bg-gray-50">{product.emoji}</div>
                          )}
                        </div>
                        <div className="relative px-1.5 pb-1.5 pt-3">
                          <h3 className="text-[17px] font-extrabold tracking-[-0.02em]">{product.name}</h3>
                          <p className="mt-0.5 min-h-[38px] max-w-[90%] text-[13px] leading-[1.4] text-[#747aa2]">{product.material}</p>
                          <div className="mt-3 flex items-center justify-between">
                            <div>
                              <div className="text-[11px] text-[#747aa2]">from</div>
                              <span className="text-[17px] font-extrabold text-[#5924f5]">{formatPrice(product.sizes[0].price)}</span>
                            </div>
                            <button type="button" className={`flex h-9 w-9 items-center justify-center rounded-full border text-xl transition ${selectedProduct?.id === product.id ? 'border-[#5e23f5] bg-[#5e23f5] text-white shadow-[0_8px_20px_rgba(94,35,245,0.30)]' : 'border-[#d8daec] bg-white text-[#071633] group-hover:border-[#6d3df3]'}`}>→</button>
                          </div>
                        </div>
                      </article>

                      {selectedProduct?.id === product.id && (
                        <div className="mt-3">
                          <div className="mb-2 flex items-end justify-between">
                            <h2 className="text-[17px] font-extrabold">Select Size</h2>
                            <p className="hidden text-xs text-[#7a7fa3] md:block">All sizes in inches</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            {product.sizes.map(size => {
                              const shape = getSizeShape(size.width, size.height)
                              const sel = selectedSize?.label === size.label
                              return (
                                <button key={size.label} type="button" onClick={() => setSelectedSize(size)}
                                  className={`group flex flex-col items-center justify-center rounded-[14px] border bg-white shadow-[0_10px_22px_rgba(32,33,77,0.05)] transition hover:-translate-y-0.5 hover:border-[#6d3df3] py-3 ${sel ? 'border-[#6d3df3] bg-[#f7f4ff] ring-2 ring-[#6d3df3]/10' : 'border-[#e7e7f0]'}`}>
                                  <div className="mb-2 border border-[#283476] bg-[#f7f7fb]" style={{ width: shape.w, height: shape.h }} />
                                  <span className="text-[13px] font-extrabold">{size.label}</span>
                                  <span className="mt-0.5 text-[14px] font-extrabold text-[#5f28ef]">{formatPrice(size.price)}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="mx-auto mt-7 max-w-[580px] text-center">
                <button type="button" onClick={() => { if (selectedProduct && selectedSize) setStep('create') }}
                  disabled={!selectedProduct || !selectedSize} className={primaryBtn}>
                  ✦ CONTINUE — DESIGN YOUR ART →
                </button>
                <p className="mt-2 text-sm text-[#878cac]">
                  {!selectedProduct ? 'Select a product to continue' : !selectedSize ? 'Select a size to continue' : 'Ready! Click above to design your art'}
                </p>
              </section>

              <section className="mx-auto mt-7 grid max-w-[1260px] grid-cols-2 gap-y-4 pb-8 pt-2 lg:grid-cols-4">
                {[
                  { icon: '✦', title: 'AI-Generated Art', subtitle: 'Unique to you' },
                  { icon: '🎖', title: 'Premium Quality', subtitle: 'Museum grade prints' },
                  { icon: '🚚', title: 'Worldwide Shipping', subtitle: 'Fast & tracked' },
                  { icon: '🔒', title: 'Secure Checkout', subtitle: 'Safe & protected' },
                ].map((item, index) => (
                  <div key={item.title} className={`flex items-center justify-center gap-3 px-4 ${index > 0 ? 'lg:border-l lg:border-[#dcddea]' : ''}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee9ff] text-lg text-[#5d26ef]">{item.icon}</div>
                    <div>
                      <div className="text-[13px] font-extrabold">{item.title}</div>
                      <div className="mt-0.5 text-[13px] text-[#73799e]">{item.subtitle}</div>
                    </div>
                  </div>
                ))}
              </section>
            </section>

            <section className="bg-[#f4f3ff] border-t border-[#e5e6ef]">
              <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
                <h2 className="font-extrabold text-2xl sm:text-3xl mb-2 text-center text-[#071633]">Frequently Asked Questions</h2>
                <p className="text-center text-[#747aa2] text-sm mb-8">Everything you need to know about Create2Print</p>
                <div className="bg-white rounded-2xl border border-gray-100 px-6 divide-y divide-gray-50 shadow-sm">
                  {FAQ_ITEMS.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── STEP 2: Create ── */}
        {step === 'create' && (
          <div className="mx-auto max-w-lg px-4 sm:px-8 py-10 w-full">
            <button onClick={() => setStep('product')} className={backBtn}>← Back to products</button>

            <div className="flex items-center gap-3 p-4 rounded-2xl mb-6 border-2 border-[#ede7ff] bg-[#f9f7ff]">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                {productImages[selectedProduct?.id || ''] ? (
                  <img src={productImages[selectedProduct?.id || '']} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">{selectedProduct?.emoji}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[#071633] truncate">{selectedProduct?.name}</div>
                <div className="text-sm text-[#6d3df3] font-semibold">{selectedSize?.label} ({selectedSize?.width}" × {selectedSize?.height}") · {selectedSize?.aspectRatio}</div>
              </div>
              <div className="font-extrabold text-lg text-[#5924f5] flex-shrink-0">{formatPrice(selectedSize?.price || 0)}</div>
            </div>

            <div className="flex bg-[#f0eeff] rounded-2xl p-1 mb-6">
              {(['generate','upload'] as const).map(mode => (
                <button key={mode} onClick={() => setCreateMode(mode)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: createMode === mode ? 'white' : 'transparent', color: createMode === mode ? '#6d3df3' : '#8a89a8', boxShadow: createMode === mode ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}>
                  {mode === 'generate' ? '✦ AI Generate' : '↑ Upload Image'}
                </button>
              ))}
            </div>

            {createMode === 'generate' && (
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-[#8a89a8] uppercase tracking-widest mb-2 block">Describe your artwork</label>
                  <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                    placeholder="A majestic snow-capped mountain range at golden hour, oil painting style, dramatic clouds..."
                    rows={5} className={inputClass + " resize-none leading-relaxed"} />
                </div>

                {/* Randomized prompt suggestions with refresh */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-[#8a89a8] font-semibold">Quick ideas →</div>
                    <button onClick={() => setPromptSuggestions(getRandomPrompts())}
                      className="text-xs text-[#6d3df3] font-semibold hover:text-[#5924f5] transition-colors flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M23 4v6h-6M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                      </svg>
                      Refresh
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map(s => (
                      <button key={s} onClick={() => setPrompt(s)}
                        className="text-xs px-3 py-1.5 rounded-full border-2 border-[#e8e8f0] text-[#888] bg-white font-medium transition-all hover:border-[#6d3df3] hover:text-[#6d3df3]">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8a89a8]">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full" style={{ background: i < generationsLeft ? 'linear-gradient(135deg,#6d3df3,#ff8c18)' : '#e0e0e8' }} />
                    ))}
                  </div>
                  <span>{generationsLeft} generation{generationsLeft !== 1 ? 's' : ''} remaining</span>
                </div>

                {error && <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 text-red-500 text-sm">{error}</div>}

                <button onClick={handleGenerate} disabled={generating || !prompt.trim() || generationsLeft <= 0} className={primaryBtn}>
                  {generating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                      Generating your artwork...
                    </span>
                  ) : '✦ Generate Artwork'}
                </button>

                {/* Loading bar with spinner */}
                {generating && (
                  <div className="space-y-3 py-1">
                    <div className="flex items-center gap-3">
                      <svg className="animate-spin w-5 h-5 flex-shrink-0 text-[#6d3df3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                      </svg>
                      <div className="flex-1 bg-[#e8e4ff] rounded-full h-4 overflow-hidden shadow-inner">
                        <div className="h-4 rounded-full bg-gradient-to-r from-[#6526f5] via-[#ef48a7] to-[#ff8c18] shadow-[0_0_12px_rgba(239,72,167,0.5)]"
                          style={{ animation:'progress 28s ease-in-out forwards' }} />
                      </div>
                      <span className="text-xs font-bold text-[#6d3df3] flex-shrink-0">~30s</span>
                    </div>
                    <p className="text-center text-[#8a89a8] text-xs animate-pulse">
                      Creating your artwork for {selectedSize?.label} ({selectedSize?.width}" × {selectedSize?.height}")...
                    </p>
                  </div>
                )}
              </div>
            )}

            {createMode === 'upload' && (
              <div className="space-y-4">
                <div className="rounded-2xl p-4 border-2 border-amber-200 bg-amber-50">
                  <div className="flex gap-3">
                    <span className="text-xl flex-shrink-0">⚠️</span>
                    <div>
                      <div className="font-bold text-sm mb-1 text-amber-900">Aspect Ratio Notice</div>
                      <div className="text-xs leading-relaxed text-amber-800">{selectedProduct?.uploadAspectRatioNote}</div>
                      <div className="text-xs mt-1 font-bold text-amber-900">Recommended for {selectedSize?.label}: <strong>{selectedSize?.aspectRatio}</strong></div>
                    </div>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#ddd9f7] rounded-2xl p-12 text-center transition-all bg-white hover:border-[#6d3df3] hover:bg-[#f9f7ff]">
                  <div className="text-5xl mb-3">📁</div>
                  <div className="font-bold text-[#071633]">Click to upload your image</div>
                  <div className="text-[#8a89a8] text-sm mt-1">PNG, JPG, WEBP supported</div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Preview ── */}
        {step === 'preview' && (
          <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10 w-full">
            <button onClick={() => setStep('create')} className={backBtn}>← Try again</button>
            <div className="text-center mb-6">
              <h2 className="font-extrabold text-2xl sm:text-3xl mb-1 text-[#071633]">
                {loadingMockup || modifying ? 'Generating...' : 'Looking great! 🎉'}
              </h2>
              <p className="text-[#747aa2] text-sm">{selectedProduct?.name} · <strong>{selectedSize?.label}</strong> ({selectedSize?.width}" × {selectedSize?.height}")</p>
            </div>

            {/* Image with shadow for pop effect */}
            <div className="flex justify-center mb-4"
              style={{ filter: (!loadingMockup && !modifying && activeImage) ? 'drop-shadow(0 24px 48px rgba(109,61,243,0.22)) drop-shadow(0 8px 20px rgba(0,0,0,0.15))' : 'none' }}>
              {loadingMockup || modifying ? (
                <div className="flex flex-col items-center justify-center gap-3 py-20">
                  <svg className="animate-spin w-10 h-10 text-[#6d3df3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  <p className="text-[#8a89a8] text-sm animate-pulse">
                    {modifying ? 'Applying your modifications...' : 'Placing your design on the product...'}
                  </p>
                </div>
              ) : activeImage && selectedProduct && selectedSize ? (
                <ProductMockupFrame product={selectedProduct} size={selectedSize} imageUrl={mockupImage || activeImage} onClickImage={() => setLightboxOpen(true)} />
              ) : null}
            </div>

            {!loadingMockup && !modifying && activeImage && (
              <p className="text-center text-xs text-[#8a89a8] mb-4">🔍 Click the image to view full size</p>
            )}

            {!loadingMockup && !modifying && selectedSize && (
              <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#f0ecff] text-[#5924f5] border border-[#ddd9f7]">
                  📐 {selectedSize.width}" wide × {selectedSize.height}" tall
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#f0ecff] text-[#5924f5] border border-[#ddd9f7]">
                  {selectedSize.aspectRatio} ratio
                </div>
              </div>
            )}

            {/* Modification box */}
            {!loadingMockup && !modifying && activeImage && (
              <div className="mb-5 rounded-2xl border-2 border-[#ddd9f7] bg-[#f9f7ff] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✏️</span>
                  <h3 className="font-extrabold text-[#071633] text-sm">Want to modify this image?</h3>
                  {generationsLeft > 0 && (
                    <span className="ml-auto text-xs text-[#8a89a8] font-medium">{generationsLeft} generation{generationsLeft !== 1 ? 's' : ''} left</span>
                  )}
                </div>
                <textarea value={modifyPrompt} onChange={e => setModifyPrompt(e.target.value)}
                  placeholder="e.g. Make the sky more dramatic, add a full moon, change colors to warm tones..."
                  rows={3} className={inputClass + " resize-none leading-relaxed mb-3"} />
                {modifyError && <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-500 text-xs mb-3">{modifyError}</div>}
                <button onClick={handleModify} disabled={modifying || !modifyPrompt.trim() || generationsLeft <= 0}
                  className="w-full rounded-full border-2 border-[#6d3df3] text-[#6d3df3] bg-white px-6 py-3 text-sm font-extrabold transition hover:bg-[#6d3df3] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                  {modifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                      Applying modifications...
                    </span>
                  ) : generationsLeft <= 0 ? 'No generations remaining' : '✦ Apply Modifications'}
                </button>
              </div>
            )}

            {/* Order summary */}
            <div className="rounded-2xl p-5 mb-5 border-2 border-[#ddd9f7] bg-[#f9f7ff]">
              <div className="flex justify-between text-sm text-[#747aa2] mb-2">
                <span>{selectedProduct?.name} · {selectedSize?.label}</span>
                <span>{formatPrice(selectedSize?.price || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#747aa2] mb-3 pb-3 border-b border-[#ddd9f7]">
                <span>Shipping (estimated)</span><span>~$4.99</span>
              </div>
              <div className="flex justify-between font-extrabold text-[#071633] text-lg">
                <span>Total</span>
                <span className="bg-gradient-to-r from-[#6d3df3] to-[#ff8c18] bg-clip-text text-transparent">{formatPrice(total)}</span>
              </div>
            </div>

            <button onClick={() => setStep('shipping')} disabled={loadingMockup || modifying} className={primaryBtn}>✦ Ship This to Me →</button>
            <button onClick={() => setStep('create')} className="w-full text-center text-[#8a89a8] text-sm mt-3 hover:text-[#6d3df3] transition-colors py-2">
              Start over with a different design
            </button>
          </div>
        )}

        {/* ── STEP 4: Shipping ── */}
        {step === 'shipping' && (
          <div className="mx-auto max-w-lg px-4 sm:px-8 py-10 w-full">
            <button onClick={() => setStep('preview')} className={backBtn}>← Back to preview</button>
            <h2 className="font-extrabold text-2xl sm:text-3xl mb-1 text-[#071633]">Where should we send it?</h2>
            <p className="text-[#747aa2] text-sm mb-6">Worldwide shipping available.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} placeholder="First name *" value={shipping.firstName} onChange={e => setShipping(p => ({ ...p, firstName: e.target.value }))} />
                <input className={inputClass} placeholder="Last name *" value={shipping.lastName} onChange={e => setShipping(p => ({ ...p, lastName: e.target.value }))} />
              </div>
              <input className={inputClass} type="email" placeholder="Email address *" value={shipping.email} onChange={e => setShipping(p => ({ ...p, email: e.target.value }))} />
              <input className={inputClass} placeholder="Street address *" value={shipping.address1} onChange={e => setShipping(p => ({ ...p, address1: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} placeholder="City *" value={shipping.city} onChange={e => setShipping(p => ({ ...p, city: e.target.value }))} />
                <input className={inputClass} placeholder="State / Province" value={shipping.state} onChange={e => setShipping(p => ({ ...p, state: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} placeholder="ZIP / Postal code *" value={shipping.zip} onChange={e => setShipping(p => ({ ...p, zip: e.target.value }))} />
                <select className={inputClass} value={shipping.country} onChange={e => setShipping(p => ({ ...p, country: e.target.value }))}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl p-4 mt-5 border-2 border-[#ddd9f7] bg-[#f9f7ff]">
              <span className="text-sm text-[#747aa2]">{selectedProduct?.emoji} {selectedProduct?.name} · {selectedSize?.label}</span>
              <span className="font-extrabold bg-gradient-to-r from-[#6d3df3] to-[#ff8c18] bg-clip-text text-transparent">{formatPrice(total)}</span>
            </div>
            {error && <div className="mt-4 bg-red-50 border-2 border-red-100 rounded-2xl p-4 text-red-500 text-sm">{error}</div>}
            <div className="mt-5">
              <button onClick={handleShippingContinue} className={primaryBtn}>Continue to Payment →</button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Payment ── */}
        {step === 'payment' && clientSecret && (
          <div className="mx-auto max-w-lg px-4 sm:px-8 py-10 w-full">
            <button onClick={() => setStep('shipping')} className={backBtn}>← Back</button>
            <h2 className="font-extrabold text-2xl sm:text-3xl mb-1 text-[#071633]">Secure Checkout</h2>
            <p className="text-[#747aa2] text-sm mb-6">Powered by Stripe. Your card info is never stored.</p>
            <div className="rounded-2xl p-5 mb-6 border-2 border-[#ddd9f7] bg-[#f9f7ff]">
              <div className="flex justify-between text-sm text-[#747aa2] mb-2">
                <span>{selectedProduct?.name} · {selectedSize?.label}</span>
                <span>{formatPrice(selectedSize?.price || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#747aa2] mb-3 pb-3 border-b border-[#ddd9f7]">
                <span>Shipping to {shipping.country}</span><span>~$4.99</span>
              </div>
              <div className="flex justify-between font-extrabold text-[#071633] text-lg">
                <span>Total due today</span>
                <span className="bg-gradient-to-r from-[#6d3df3] to-[#ff8c18] bg-clip-text text-transparent">{formatPrice(total)}</span>
              </div>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme:'stripe', variables:{ colorPrimary:'#6d3df3', borderRadius:'12px' } } }}>
              <CheckoutForm onSuccess={async () => { await placeOrder() }} amount={total} />
            </Elements>
            <div className="flex items-center justify-center gap-5 mt-5 text-xs text-[#b0b5cc]">
              <span>🔒 SSL encrypted</span>
              <span>💳 Powered by Stripe</span>
              <span>🖨️ Fulfilled by Printify</span>
            </div>
          </div>
        )}

        {/* ── STEP 6: Confirmation ── */}
        {step === 'confirm' && (
          <div className="text-center py-16 max-w-lg mx-auto px-4 w-full">
            <div className="text-7xl mb-6">🎉</div>
            <h2 className="font-extrabold text-3xl sm:text-4xl mb-2 text-[#071633]">Order Placed!</h2>
            <p className="text-[#747aa2] mb-1">Your {selectedProduct?.name} ({selectedSize?.label}) is being printed and will ship soon.</p>
            <p className="text-[#8a89a8] text-sm mb-8">Tracking info will be sent to <strong>{shipping.email}</strong></p>
            {orderId && (
              <div className="inline-block rounded-2xl px-6 py-4 mb-8 border-2 border-[#ddd9f7] bg-[#f9f7ff]">
                <div className="text-xs text-[#8a89a8] mb-1 uppercase tracking-wider">Order ID</div>
                <div className="font-mono text-sm font-bold bg-gradient-to-r from-[#6d3df3] to-[#ff8c18] bg-clip-text text-transparent">{orderId}</div>
              </div>
            )}
            <button onClick={reset} className={primaryBtn + " max-w-xs mx-auto"}>✦ Create Another Print</button>
            <p className="text-[#b0b5cc] text-xs mt-8">
              Questions? <a href="mailto:support@create2print.store" className="underline hover:text-[#6d3df3]">support@create2print.store</a>
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e6ef] bg-white/40">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between px-4 sm:px-8 py-5 text-sm text-[#757b9f]">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Create2Print" className="h-7 object-contain" />
            <span className="hidden sm:inline">Art for a brighter world.</span>
          </div>
          <div className="flex gap-5">
            <a href="mailto:support@create2print.store" className="transition hover:text-[#5d26ef]">Contact</a>
            <span>© 2025 Create2Print</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
