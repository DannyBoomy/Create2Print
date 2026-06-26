export type ProductId = 'rolled-poster' | 'matte-canvas' | 'matte-canvas-framed' | 'wall-tapestry'

export interface Size {
  label: string
  width: number
  height: number
  printifyVariantId: number
  price: number
  aspectRatio: string
}

export interface Product {
  id: ProductId
  name: string
  description: string
  material: string
  emoji: string
  printifyBlueprintId: number
  printifyPrintProviderId: number
  sizes: Size[]
  uploadAspectRatioNote: string
}

export const PRODUCTS: Product[] = [
  {
    id: 'rolled-poster',
    name: 'Rolled Poster',
    description: 'Premium matte poster print, rolled and shipped in a protective tube.',
    material: 'Matte paper, museum quality, vibrant color reproduction.',
    emoji: '🖼️',
    printifyBlueprintId: 1220,
    printifyPrintProviderId: 99,
    uploadAspectRatioNote: 'For best results upload an image matching your selected size ratio. Portrait sizes work best with a 4:5 or 2:3 ratio image.',
    sizes: [
      { label: '8×10"',  width: 8,  height: 10, printifyVariantId: 101878, price: 1800, aspectRatio: '4:5' },
      { label: '11×14"', width: 11, height: 14, printifyVariantId: 101880, price: 2400, aspectRatio: '11:14' },
      { label: '18×24"', width: 18, height: 24, printifyVariantId: 101888, price: 3500, aspectRatio: '3:4' },
      { label: '24×36"', width: 24, height: 36, printifyVariantId: 101893, price: 4800, aspectRatio: '2:3' },
    ],
  },
  {
    id: 'matte-canvas',
    name: 'Matte Canvas',
    description: 'Gallery-quality canvas wrap, ready to hang straight out of the box.',
    material: 'Matte canvas, gallery stretched on pine frame, 1.25" depth.',
    emoji: '🎨',
    printifyBlueprintId: 1159,
    printifyPrintProviderId: 99,
    uploadAspectRatioNote: 'Canvas wraps look best with images that match your selected size ratio. Leave slight padding on edges as they wrap around the frame.',
    sizes: [
      { label: '8×10"',  width: 8,  height: 10, printifyVariantId: 101413, price: 3500, aspectRatio: '4:5' },
      { label: '12×16"', width: 12, height: 16, printifyVariantId: 91643,  price: 4900, aspectRatio: '3:4' },
      { label: '16×20"', width: 16, height: 20, printifyVariantId: 91646,  price: 6500, aspectRatio: '4:5' },
      { label: '20×24"', width: 20, height: 24, printifyVariantId: 91649,  price: 8500, aspectRatio: '5:6' },
    ],
  },
  {
    id: 'matte-canvas-framed',
    name: 'Framed Canvas',
    description: 'Matte canvas in a beautiful black frame — arrives ready to hang.',
    material: 'Matte canvas with solid black wood frame, includes hanging hardware.',
    emoji: '🪞',
    printifyBlueprintId: 944,
    printifyPrintProviderId: 99,
    uploadAspectRatioNote: 'Framed canvas works best with images that match your selected size ratio exactly for a clean, professional look.',
    sizes: [
      { label: '8×10"',  width: 8,  height: 10, printifyVariantId: 111821, price: 5500, aspectRatio: '4:5' },
      { label: '12×16"', width: 12, height: 16, printifyVariantId: 88292,  price: 7500, aspectRatio: '3:4' },
      { label: '16×20"', width: 16, height: 20, printifyVariantId: 88293,  price: 9500, aspectRatio: '4:5' },
      { label: '18×24"', width: 18, height: 24, printifyVariantId: 88294,  price: 11500, aspectRatio: '3:4' },
    ],
  },
  {
    id: 'wall-tapestry',
    name: 'Indoor Wall Tapestry',
    description: 'Soft woven tapestry, perfect for dorm rooms, bedrooms, and living spaces.',
    material: '100% polyester, lightweight woven fabric, rod pocket included.',
    emoji: '🏴',
    printifyBlueprintId: 241,
    printifyPrintProviderId: 99,
    uploadAspectRatioNote: 'Tapestries work best with portrait or square images. Make sure your image fills the frame for the best printed result.',
    sizes: [
      { label: '26×36"', width: 26, height: 36, printifyVariantId: 41686, price: 3800, aspectRatio: '13:18' },
      { label: '50×60"', width: 50, height: 60, printifyVariantId: 41687, price: 5500, aspectRatio: '5:6' },
      { label: '68×80"', width: 68, height: 80, printifyVariantId: 45130, price: 7500, aspectRatio: '17:20' },
    ],
  },
]

export function getProductById(id: ProductId): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}

export function getOpenAIImageSize(width: number, height: number): '1024x1024' | '1792x1024' | '1024x1792' {
  const ratio = width / height
  if (ratio > 1.3) return '1792x1024'
  if (ratio < 0.77) return '1024x1792'
  return '1024x1024'
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}