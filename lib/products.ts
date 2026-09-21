export type ProductId = 'rolled-poster' | 'matte-canvas' | 'matte-canvas-framed' | 'wall-tapestry'

export interface Size {
  label: string
  width: number
  height: number
  printifyVariantId: number
  price: number // retail price in cents (production cost × 1.35, rounded to nearest dollar)
  aspectRatio: string
  printAreaWidth: number
  printAreaHeight: number
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
    uploadAspectRatioNote: 'For best results upload an image matching your selected size ratio.',
    sizes: [
      // Matte / 8×10" Vertical — cost $4.87 → retail $7
      { label: '8×10"',  width: 8,  height: 10, printifyVariantId: 101878, price: 700,  aspectRatio: '4:5',   printAreaWidth: 2400,  printAreaHeight: 3000 },
      // Matte / 11×14" Vertical — cost $4.00 → retail $5
      { label: '11×14"', width: 11, height: 14, printifyVariantId: 101880, price: 500,  aspectRatio: '11:14', printAreaWidth: 3300,  printAreaHeight: 4200 },
      // Matte / 18×24" Vertical — cost $5.22 → retail $7
      { label: '18×24"', width: 18, height: 24, printifyVariantId: 101888, price: 700,  aspectRatio: '3:4',   printAreaWidth: 5400,  printAreaHeight: 7200 },
      // Matte / 24×36" Vertical — cost $10.38 → retail $14
      { label: '24×36"', width: 24, height: 36, printifyVariantId: 101893, price: 1400, aspectRatio: '2:3',   printAreaWidth: 7200,  printAreaHeight: 10800 },
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
    uploadAspectRatioNote: 'Canvas wraps look best with images that match your selected size ratio.',
    sizes: [
      // 8×10" Vertical / 1.25" — cost $12.82 → retail $17
      { label: '8×10"',  width: 8,  height: 10, printifyVariantId: 101413, price: 1700, aspectRatio: '4:5', printAreaWidth: 2400, printAreaHeight: 3000 },
      // 12×16" Vertical / 1.25" — cost $19.21 → retail $26
      { label: '12×16"', width: 12, height: 16, printifyVariantId: 91643,  price: 2600, aspectRatio: '3:4', printAreaWidth: 3600, printAreaHeight: 4800 },
      // 16×20" Vertical / 1.25" — cost $25.61 → retail $35
      { label: '16×20"', width: 16, height: 20, printifyVariantId: 91646,  price: 3500, aspectRatio: '4:5', printAreaWidth: 4800, printAreaHeight: 6000 },
      // 20×24" Vertical / 1.25" — cost $35.19 → retail $48
      { label: '20×24"', width: 20, height: 24, printifyVariantId: 91649,  price: 4800, aspectRatio: '5:6', printAreaWidth: 6000, printAreaHeight: 7200 },
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
    uploadAspectRatioNote: 'Framed canvas works best with images that match your selected size ratio exactly.',
    sizes: [
      // 8×10" Vertical / Black / 1.25" — cost $24.32 → retail $33
      { label: '8×10"',  width: 8,  height: 10, printifyVariantId: 111821, price: 3300,  aspectRatio: '4:5', printAreaWidth: 2400, printAreaHeight: 3000 },
      // 12×16" Vertical / Black / 1.25" — cost $37.77 → retail $51
      { label: '12×16"', width: 12, height: 16, printifyVariantId: 88292,  price: 5100,  aspectRatio: '3:4', printAreaWidth: 3600, printAreaHeight: 4800 },
      // 16×20" Vertical / Black / 1.25" — cost $47.48 → retail $64
      { label: '16×20"', width: 16, height: 20, printifyVariantId: 88293,  price: 6400,  aspectRatio: '4:5', printAreaWidth: 4800, printAreaHeight: 6000 },
      // 18×24" Vertical / Black / 1.25" — cost $54.31 → retail $73
      { label: '18×24"', width: 18, height: 24, printifyVariantId: 88294,  price: 7300,  aspectRatio: '3:4', printAreaWidth: 5400, printAreaHeight: 7200 },
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
    uploadAspectRatioNote: 'Tapestries work best with portrait images that fill the frame completely.',
    sizes: [
      // 26×36" — cost $16.75 → retail $23
      { label: '26×36"', width: 26, height: 36, printifyVariantId: 41686, price: 2300, aspectRatio: '29:39', printAreaWidth: 4350,  printAreaHeight: 5850 },
      // 50×60" — cost $24.59 → retail $33
      { label: '50×60"', width: 50, height: 60, printifyVariantId: 41687, price: 3300, aspectRatio: '5:6',   printAreaWidth: 7500,  printAreaHeight: 9000 },
      // 68×80" — cost $36.05 → retail $49
      { label: '68×80"', width: 68, height: 80, printifyVariantId: 45130, price: 4900, aspectRatio: '17:20', printAreaWidth: 10200, printAreaHeight: 12000 },
    ],
  },
]

export function getProductById(id: ProductId): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}

export function getOpenAIImageSize(
  printAreaWidth: number,
  printAreaHeight: number
): '1024x1024' | '1536x1024' | '1024x1536' {
  const ratio = printAreaWidth / printAreaHeight
  if (ratio > 1.2) return '1536x1024'
  if (ratio < 0.85) return '1024x1536'
  return '1024x1024'
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}