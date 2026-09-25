export type ProductId = 'rolled-poster' | 'matte-canvas' | 'matte-canvas-framed' | 'wall-tapestry' | 'ceramic-mug' | 'desk-mat' | 'gift-wrapping-paper' | 'puzzle' | 'arctic-fleece-blanket' | 'car-magnet' | 'ceramic-coaster' | 'shower-curtain' | 'fleece-sherpa-blanket' | 'tumbler-20oz' | 'area-rug' | 'velveteen-plush-blanket'

export interface SizeOption {
  label: string
  width: number
  height: number
  variantId: number
  price: number
  printAreaWidth: number
  printAreaHeight: number
}

export interface FinishOption {
  label: string
  sizes: SizeOption[]
}

export interface ColorOption {
  label: string
  hex: string
  finishes: FinishOption[]
}

export interface Product {
  id: ProductId
  name: string
  description: string
  emoji: string
  printifyBlueprintId: number
  printifyPrintProviderId: number
  hasColors: boolean
  hasFinishes: boolean
  recommendTransparent: boolean
  productContext: string
  colors: ColorOption[]
}

export const PRODUCTS: Product[] = [
  {
    id: 'rolled-poster',
    name: 'Rolled Poster',
    description: 'Premium poster print, rolled and shipped in a protective tube.',
    emoji: '🖼️',
    printifyBlueprintId: 1220,
    printifyPrintProviderId: 99,
    hasColors: false,
    hasFinishes: true,
    recommendTransparent: false,
    productContext: 'This design will be printed on a rolled poster.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [
        { label: 'Matte', sizes: [
          { label: '8x10"',  width: 8,  height: 10, variantId: 101878, price: 700,  printAreaWidth: 2400,  printAreaHeight: 3000 },
          { label: '11x14"', width: 11, height: 14, variantId: 101880, price: 500,  printAreaWidth: 3300,  printAreaHeight: 4200 },
          { label: '18x24"', width: 18, height: 24, variantId: 101888, price: 700,  printAreaWidth: 5400,  printAreaHeight: 7200 },
          { label: '24x36"', width: 24, height: 36, variantId: 101893, price: 1400, printAreaWidth: 7200,  printAreaHeight: 10800 },
        ]},
        { label: 'Semi-Gloss', sizes: [
          { label: '8x10"',  width: 8,  height: 10, variantId: 92393, price: 700,  printAreaWidth: 2400,  printAreaHeight: 3000 },
          { label: '11x14"', width: 11, height: 14, variantId: 92395, price: 500,  printAreaWidth: 3300,  printAreaHeight: 4200 },
          { label: '18x24"', width: 18, height: 24, variantId: 92401, price: 700,  printAreaWidth: 5400,  printAreaHeight: 7200 },
          { label: '24x36"', width: 24, height: 36, variantId: 92407, price: 1400, printAreaWidth: 7200,  printAreaHeight: 10800 },
        ]},
        { label: 'Fine Art', sizes: [
          { label: '8x10"',  width: 8,  height: 10, variantId: 92392, price: 1300, printAreaWidth: 2400,  printAreaHeight: 3000 },
          { label: '11x14"', width: 11, height: 14, variantId: 92394, price: 2100, printAreaWidth: 3300,  printAreaHeight: 4200 },
          { label: '18x24"', width: 18, height: 24, variantId: 92400, price: 2500, printAreaWidth: 5400,  printAreaHeight: 7200 },
          { label: '24x36"', width: 24, height: 36, variantId: 92406, price: 4000, printAreaWidth: 7200,  printAreaHeight: 10800 },
        ]},
      ],
    }],
  },
  {
    id: 'matte-canvas',
    name: 'Matte Canvas',
    description: 'Gallery-quality canvas wrap, ready to hang.',
    emoji: '🎨',
    printifyBlueprintId: 1159,
    printifyPrintProviderId: 99,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on a matte canvas.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Matte', sizes: [
        { label: '8x10"',  width: 8,  height: 10, variantId: 101413, price: 1700, printAreaWidth: 2400, printAreaHeight: 3000 },
        { label: '12x16"', width: 12, height: 16, variantId: 91643,  price: 2600, printAreaWidth: 3600, printAreaHeight: 4800 },
        { label: '16x20"', width: 16, height: 20, variantId: 91646,  price: 3500, printAreaWidth: 4800, printAreaHeight: 6000 },
        { label: '20x24"', width: 20, height: 24, variantId: 91649,  price: 4800, printAreaWidth: 6000, printAreaHeight: 7200 },
      ]}],
    }],
  },
  {
    id: 'matte-canvas-framed',
    name: 'Framed Canvas',
    description: 'Matte canvas in a solid wood frame, arrives ready to hang.',
    emoji: '🪞',
    printifyBlueprintId: 944,
    printifyPrintProviderId: 99,
    hasColors: true,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on a framed canvas.',
    colors: [
      { label: 'Black', hex: '#1a1a1a', finishes: [{ label: 'Matte', sizes: [
        { label: '8x10"',  width: 8,  height: 10, variantId: 111821, price: 3300, printAreaWidth: 2400, printAreaHeight: 3000 },
        { label: '12x16"', width: 12, height: 16, variantId: 88292,  price: 5100, printAreaWidth: 3600, printAreaHeight: 4800 },
        { label: '16x20"', width: 16, height: 20, variantId: 88293,  price: 6400, printAreaWidth: 4800, printAreaHeight: 6000 },
        { label: '18x24"', width: 18, height: 24, variantId: 88294,  price: 7300, printAreaWidth: 5400, printAreaHeight: 7200 },
      ]}]},
      { label: 'White', hex: '#f0f0f0', finishes: [{ label: 'Matte', sizes: [
        { label: '8x10"',  width: 8,  height: 10, variantId: 111824, price: 3300, printAreaWidth: 2400, printAreaHeight: 3000 },
        { label: '12x16"', width: 12, height: 16, variantId: 107253, price: 5100, printAreaWidth: 3600, printAreaHeight: 4800 },
        { label: '16x20"', width: 16, height: 20, variantId: 107255, price: 6400, printAreaWidth: 4800, printAreaHeight: 6000 },
        { label: '18x24"', width: 18, height: 24, variantId: 107257, price: 7300, printAreaWidth: 5400, printAreaHeight: 7200 },
      ]}]},
      { label: 'Espresso', hex: '#3b1f0a', finishes: [{ label: 'Matte', sizes: [
        { label: '8x10"',  width: 8,  height: 10, variantId: 111822, price: 3300, printAreaWidth: 2400, printAreaHeight: 3000 },
        { label: '12x16"', width: 12, height: 16, variantId: 107252, price: 5100, printAreaWidth: 3600, printAreaHeight: 4800 },
        { label: '16x20"', width: 16, height: 20, variantId: 107254, price: 6400, printAreaWidth: 4800, printAreaHeight: 6000 },
        { label: '18x24"', width: 18, height: 24, variantId: 107256, price: 7300, printAreaWidth: 5400, printAreaHeight: 7200 },
      ]}]},
      { label: 'Natural', hex: '#c8a97e', finishes: [{ label: 'Matte', sizes: [
        { label: '8x10"',  width: 8,  height: 10, variantId: 244025, price: 3300, printAreaWidth: 2400, printAreaHeight: 3000 },
        { label: '12x16"', width: 12, height: 16, variantId: 244029, price: 5100, printAreaWidth: 3600, printAreaHeight: 4800 },
        { label: '16x20"', width: 16, height: 20, variantId: 244032, price: 6400, printAreaWidth: 4800, printAreaHeight: 6000 },
        { label: '18x24"', width: 18, height: 24, variantId: 244036, price: 7300, printAreaWidth: 5400, printAreaHeight: 7200 },
      ]}]},
    ],
  },
  {
    id: 'wall-tapestry',
    name: 'Wall Tapestry',
    description: 'Soft woven tapestry, perfect for any room.',
    emoji: '🏴',
    printifyBlueprintId: 241,
    printifyPrintProviderId: 99,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on a wall tapestry.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '26x36"', width: 26, height: 36, variantId: 41686, price: 2300, printAreaWidth: 4350,  printAreaHeight: 5850 },
        { label: '50x60"', width: 50, height: 60, variantId: 41687, price: 3300, printAreaWidth: 8100,  printAreaHeight: 9525 },
        { label: '68x80"', width: 68, height: 80, variantId: 45130, price: 4900, printAreaWidth: 10650, printAreaHeight: 12525 },
      ]}],
    }],
  },
  {
    id: 'ceramic-mug',
    name: 'Ceramic Mug',
    description: 'Classic ceramic mug, dishwasher safe.',
    emoji: '☕',
    printifyBlueprintId: 478,
    printifyPrintProviderId: 99,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will wrap around a ceramic mug.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '11oz', width: 11, height: 11, variantId: 65216, price: 1800, printAreaWidth: 2475, printAreaHeight: 1155 },
        { label: '15oz', width: 15, height: 15, variantId: 104692, price: 2200, printAreaWidth: 2475, printAreaHeight: 1275 },
      ]}],
    }],
  },
  {
    id: 'tumbler-20oz',
    name: '20oz Tumbler',
    description: 'Insulated 20oz tumbler. Keeps drinks hot or cold for hours.',
    emoji: '🥤',
    printifyBlueprintId: 353,
    printifyPrintProviderId: 1,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: true,
    productContext: 'This design will wrap around a 20oz tumbler. Consider a seamless wrap-around design.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '20oz', width: 20, height: 20, variantId: 44519, price: 2800, printAreaWidth: 2795, printAreaHeight: 2100 },
      ]}],
    }],
  },
  {
    id: 'ceramic-coaster',
    name: 'Ceramic Coaster',
    description: 'Custom printed ceramic coaster with cork backing.',
    emoji: '🫖',
    printifyBlueprintId: 1523,
    printifyPrintProviderId: 23,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on a square ceramic coaster.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: 'One size', width: 4, height: 4, variantId: 109347, price: 800, printAreaWidth: 1260, printAreaHeight: 1260 },
      ]}],
    }],
  },
  {
    id: 'desk-mat',
    name: 'Stitched Edge Desk Mat',
    description: 'Premium stitched edge desk mat to elevate your workspace.',
    emoji: '💻',
    printifyBlueprintId: 10665,
    printifyPrintProviderId: 1,
    hasColors: true,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on a desk mat.',
    colors: [
      { label: 'White', hex: '#f0f0f0', finishes: [{ label: 'Standard', sizes: [
        { label: '24"x14"', width: 24, height: 14, variantId: 399189, price: 1500, printAreaWidth: 7350, printAreaHeight: 4350 },
        { label: '18"x16"', width: 18, height: 16, variantId: 399191, price: 2000, printAreaWidth: 5550, printAreaHeight: 4950 },
        { label: '36"x18"', width: 36, height: 18, variantId: 399192, price: 2500, printAreaWidth: 10950, printAreaHeight: 5550 },
        { label: '48"x24"', width: 48, height: 24, variantId: 399193, price: 3200, printAreaWidth: 14550, printAreaHeight: 7350 },
      ]}]},
      { label: 'Black', hex: '#1a1a1a', finishes: [{ label: 'Standard', sizes: [
        { label: '14.5"x12.2"', width: 15, height: 12, variantId: 399190, price: 1500, printAreaWidth: 4709, printAreaHeight: 3984 },
      ]}]},
    ],
  },
  {
    id: 'car-magnet',
    name: 'Car Magnet',
    description: 'Weather-resistant car magnet. Easy to apply and remove.',
    emoji: '🚗',
    printifyBlueprintId: 1464,
    printifyPrintProviderId: 28,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: true,
    productContext: 'This design will be printed on a car magnet. A clean logo or simple design works best.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '5"x5"',     width: 5,  height: 5,  variantId: 105489, price: 800, printAreaWidth: 1650, printAreaHeight: 1650 },
        { label: '7.5"x4.5"', width: 8,  height: 5,  variantId: 105505, price: 900, printAreaWidth: 2475, printAreaHeight: 1575 },
        { label: '10"x3"',    width: 10, height: 3,  variantId: 105497, price: 800, printAreaWidth: 3150, printAreaHeight: 1050 },
      ]}],
    }],
  },
  {
    id: 'shower-curtain',
    name: 'Shower Curtain',
    description: 'Custom printed shower curtain. Water-resistant and vibrant.',
    emoji: '🚿',
    printifyBlueprintId: 235,
    printifyPrintProviderId: 10,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on a full shower curtain.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '71"x74"', width: 71, height: 74, variantId: 41653, price: 4500, printAreaWidth: 7104, printAreaHeight: 7392 },
      ]}],
    }],
  },
  {
    id: 'puzzle',
    name: 'Custom Puzzle',
    description: 'Custom photo puzzle. Choose your piece count for more or less challenge.',
    emoji: '🧩',
    printifyBlueprintId: 1149,
    printifyPrintProviderId: 28,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on a jigsaw puzzle.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '110 pcs',  width: 8,  height: 10, variantId: 87923, price: 1500, printAreaWidth: 2550, printAreaHeight: 3150 },
        { label: '252 pcs',  width: 10, height: 14, variantId: 87924, price: 2000, printAreaWidth: 3450, printAreaHeight: 4395 },
        { label: '520 pcs',  width: 14, height: 18, variantId: 87925, price: 2800, printAreaWidth: 5100, printAreaHeight: 6300 },
        { label: '1014 pcs', width: 18, height: 24, variantId: 87917, price: 3500, printAreaWidth: 5768, printAreaHeight: 8700 },
      ]}],
    }],
  },
  {
    id: 'gift-wrapping-paper',
    name: 'Gift Wrapping Paper',
    description: 'Custom printed gift wrapping paper. Available in matte and satin.',
    emoji: '🎁',
    printifyBlueprintId: 1100,
    printifyPrintProviderId: 215,
    hasColors: false,
    hasFinishes: true,
    recommendTransparent: false,
    productContext: 'This design will be printed as a repeating pattern on gift wrapping paper.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [
        { label: 'Matte', sizes: [
          { label: '29"x20"',  width: 29, height: 20,  variantId: 147685, price: 1200, printAreaWidth: 5874, printAreaHeight: 4205 },
          { label: '29"x72"',  width: 29, height: 72,  variantId: 147687, price: 2200, printAreaWidth: 5874, printAreaHeight: 14614 },
          { label: '29"x144"', width: 29, height: 144, variantId: 147686, price: 3500, printAreaWidth: 5874, printAreaHeight: 28913 },
        ]},
        { label: 'Satin', sizes: [
          { label: '29"x20"',  width: 29, height: 20,  variantId: 147688, price: 1400, printAreaWidth: 5874, printAreaHeight: 4205 },
          { label: '29"x72"',  width: 29, height: 72,  variantId: 147690, price: 2500, printAreaWidth: 5874, printAreaHeight: 14614 },
          { label: '29"x144"', width: 29, height: 144, variantId: 147689, price: 3800, printAreaWidth: 5874, printAreaHeight: 28913 },
        ]},
      ],
    }],
  },
  {
    id: 'arctic-fleece-blanket',
    name: 'Arctic Fleece Blanket',
    description: 'Warm arctic fleece blanket, perfect for cold nights.',
    emoji: '❄️',
    printifyBlueprintId: 1328,
    printifyPrintProviderId: 99,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on an arctic fleece blanket.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '30"x40"', width: 30, height: 40, variantId: 100925, price: 2200, printAreaWidth: 5025,  printAreaHeight: 6525 },
        { label: '50"x60"', width: 50, height: 60, variantId: 100926, price: 3500, printAreaWidth: 8025,  printAreaHeight: 9525 },
        { label: '60"x80"', width: 60, height: 80, variantId: 100927, price: 4200, printAreaWidth: 9561,  printAreaHeight: 12699 },
      ]}],
    }],
  },
  {
    id: 'fleece-sherpa-blanket',
    name: 'Fleece Sherpa Blanket',
    description: 'Ultra-cozy sherpa fleece blanket. Soft on both sides.',
    emoji: '🧸',
    printifyBlueprintId: 238,
    printifyPrintProviderId: 99,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on a sherpa fleece blanket.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '30"x40"', width: 30, height: 40, variantId: 120658, price: 2800, printAreaWidth: 4875, printAreaHeight: 6375 },
        { label: '50"x60"', width: 50, height: 60, variantId: 41656,  price: 4200, printAreaWidth: 7875, printAreaHeight: 9375 },
        { label: '60"x80"', width: 60, height: 80, variantId: 41659,  price: 5500, printAreaWidth: 9375, printAreaHeight: 12375 },
      ]}],
    }],
  },
  {
    id: 'area-rug',
    name: 'Area Rug',
    description: 'Custom printed area rug. Soft, durable, and machine washable.',
    emoji: '🏠',
    printifyBlueprintId: 438,
    printifyPrintProviderId: 10,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on an area rug.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '24"x36"', width: 24, height: 36, variantId: 62320, price: 3500, printAreaWidth: 3750, printAreaHeight: 5550 },
        { label: '36"x60"', width: 36, height: 60, variantId: 62321, price: 5500, printAreaWidth: 5700, printAreaHeight: 9300 },
        { label: '48"x72"', width: 48, height: 72, variantId: 62322, price: 7500, printAreaWidth: 7494, printAreaHeight: 11100 },
      ]}],
    }],
  },
  {
    id: 'velveteen-plush-blanket',
    name: 'Velveteen Plush Blanket',
    description: 'Super soft velveteen plush blanket. Perfect gift for anyone.',
    emoji: '🛏️',
    printifyBlueprintId: 522,
    printifyPrintProviderId: 99,
    hasColors: false,
    hasFinishes: false,
    recommendTransparent: false,
    productContext: 'This design will be printed on a velveteen plush blanket.',
    colors: [{
      label: 'Default',
      hex: '#ffffff',
      finishes: [{ label: 'Standard', sizes: [
        { label: '30"x40"', width: 30, height: 40, variantId: 68322, price: 2500, printAreaWidth: 4725, printAreaHeight: 6300 },
        { label: '50"x60"', width: 50, height: 60, variantId: 68323, price: 3800, printAreaWidth: 7825, printAreaHeight: 9325 },
        { label: '60"x80"', width: 60, height: 80, variantId: 68324, price: 4500, printAreaWidth: 9300, printAreaHeight: 12300 },
      ]}],
    }],
  },
]

export function getProductById(id: ProductId): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}

export function getSizes(product: Product, colorLabel: string, finishLabel: string): SizeOption[] {
  const color = product.colors.find(c => c.label === colorLabel) || product.colors[0]
  const finish = color.finishes.find(f => f.label === finishLabel) || color.finishes[0]
  return finish?.sizes || []
}

export function getFinishes(product: Product, colorLabel: string): FinishOption[] {
  const color = product.colors.find(c => c.label === colorLabel) || product.colors[0]
  return color?.finishes || []
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function getOpenAIImageSize(
  printAreaWidth: number,
  printAreaHeight: number
): '1024x1024' | '1536x1024' | '1024x1536' {
  const ratio = printAreaWidth / printAreaHeight
  if (ratio > 1.2) return '1536x1024'
  if (ratio < 0.84) return '1024x1536'
  return '1024x1024'
}