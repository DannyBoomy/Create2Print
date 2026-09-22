export type ProductId = 'rolled-poster' | 'matte-canvas' | 'matte-canvas-framed' | 'wall-tapestry'

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
    colors: [
      {
        label: 'Default',
        hex: '#ffffff',
        finishes: [
          {
            label: 'Matte',
            sizes: [
              { label: '8x10"',  width: 8,  height: 10, variantId: 101878, price: 700,  printAreaWidth: 2400,  printAreaHeight: 3000 },
              { label: '11x14"', width: 11, height: 14, variantId: 101880, price: 500,  printAreaWidth: 3300,  printAreaHeight: 4200 },
              { label: '18x24"', width: 18, height: 24, variantId: 101888, price: 700,  printAreaWidth: 5400,  printAreaHeight: 7200 },
              { label: '24x36"', width: 24, height: 36, variantId: 101893, price: 1400, printAreaWidth: 7200,  printAreaHeight: 10800 },
            ],
          },
          {
            label: 'Semi-Gloss',
            sizes: [
              { label: '8x10"',  width: 8,  height: 10, variantId: 92393, price: 700,  printAreaWidth: 2400,  printAreaHeight: 3000 },
              { label: '11x14"', width: 11, height: 14, variantId: 92395, price: 500,  printAreaWidth: 3300,  printAreaHeight: 4200 },
              { label: '18x24"', width: 18, height: 24, variantId: 92401, price: 700,  printAreaWidth: 5400,  printAreaHeight: 7200 },
              { label: '24x36"', width: 24, height: 36, variantId: 92407, price: 1400, printAreaWidth: 7200,  printAreaHeight: 10800 },
            ],
          },
          {
            label: 'Fine Art',
            sizes: [
              { label: '8x10"',  width: 8,  height: 10, variantId: 92392, price: 1300, printAreaWidth: 2400,  printAreaHeight: 3000 },
              { label: '11x14"', width: 11, height: 14, variantId: 92394, price: 2100, printAreaWidth: 3300,  printAreaHeight: 4200 },
              { label: '18x24"', width: 18, height: 24, variantId: 92400, price: 2500, printAreaWidth: 5400,  printAreaHeight: 7200 },
              { label: '24x36"', width: 24, height: 36, variantId: 92406, price: 4000, printAreaWidth: 7200,  printAreaHeight: 10800 },
            ],
          },
        ],
      },
    ],
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
    colors: [
      {
        label: 'Default',
        hex: '#ffffff',
        finishes: [
          {
            label: 'Matte',
            sizes: [
              { label: '8x10"',  width: 8,  height: 10, variantId: 101413, price: 1700, printAreaWidth: 2400, printAreaHeight: 3000 },
              { label: '12x16"', width: 12, height: 16, variantId: 91643,  price: 2600, printAreaWidth: 3600, printAreaHeight: 4800 },
              { label: '16x20"', width: 16, height: 20, variantId: 91646,  price: 3500, printAreaWidth: 4800, printAreaHeight: 6000 },
              { label: '20x24"', width: 20, height: 24, variantId: 91649,  price: 4800, printAreaWidth: 6000, printAreaHeight: 7200 },
            ],
          },
        ],
      },
    ],
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
    colors: [
      {
        label: 'Black',
        hex: '#1a1a1a',
        finishes: [{
          label: 'Matte',
          sizes: [
            { label: '8x10"',  width: 8,  height: 10, variantId: 111821, price: 3300, printAreaWidth: 2400, printAreaHeight: 3000 },
            { label: '12x16"', width: 12, height: 16, variantId: 88292,  price: 5100, printAreaWidth: 3600, printAreaHeight: 4800 },
            { label: '16x20"', width: 16, height: 20, variantId: 88293,  price: 6400, printAreaWidth: 4800, printAreaHeight: 6000 },
            { label: '18x24"', width: 18, height: 24, variantId: 88294,  price: 7300, printAreaWidth: 5400, printAreaHeight: 7200 },
          ],
        }],
      },
      {
        label: 'White',
        hex: '#f0f0f0',
        finishes: [{
          label: 'Matte',
          sizes: [
            { label: '8x10"',  width: 8,  height: 10, variantId: 111824, price: 3300, printAreaWidth: 2400, printAreaHeight: 3000 },
            { label: '12x16"', width: 12, height: 16, variantId: 107253, price: 5100, printAreaWidth: 3600, printAreaHeight: 4800 },
            { label: '16x20"', width: 16, height: 20, variantId: 107255, price: 6400, printAreaWidth: 4800, printAreaHeight: 6000 },
            { label: '18x24"', width: 18, height: 24, variantId: 107257, price: 7300, printAreaWidth: 5400, printAreaHeight: 7200 },
          ],
        }],
      },
      {
        label: 'Espresso',
        hex: '#3b1f0a',
        finishes: [{
          label: 'Matte',
          sizes: [
            { label: '8x10"',  width: 8,  height: 10, variantId: 111822, price: 3300, printAreaWidth: 2400, printAreaHeight: 3000 },
            { label: '12x16"', width: 12, height: 16, variantId: 107252, price: 5100, printAreaWidth: 3600, printAreaHeight: 4800 },
            { label: '16x20"', width: 16, height: 20, variantId: 107254, price: 6400, printAreaWidth: 4800, printAreaHeight: 6000 },
            { label: '18x24"', width: 18, height: 24, variantId: 107256, price: 7300, printAreaWidth: 5400, printAreaHeight: 7200 },
          ],
        }],
      },
      {
        label: 'Natural',
        hex: '#c8a97e',
        finishes: [{
          label: 'Matte',
          sizes: [
            { label: '8x10"',  width: 8,  height: 10, variantId: 244025, price: 3300, printAreaWidth: 2400, printAreaHeight: 3000 },
            { label: '12x16"', width: 12, height: 16, variantId: 244029, price: 5100, printAreaWidth: 3600, printAreaHeight: 4800 },
            { label: '16x20"', width: 16, height: 20, variantId: 244032, price: 6400, printAreaWidth: 4800, printAreaHeight: 6000 },
            { label: '18x24"', width: 18, height: 24, variantId: 244036, price: 7300, printAreaWidth: 5400, printAreaHeight: 7200 },
          ],
        }],
      },
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
    colors: [
      {
        label: 'Default',
        hex: '#ffffff',
        finishes: [{
          label: 'Standard',
          sizes: [
            { label: '26x36"', width: 26, height: 36, variantId: 41686, price: 2300, printAreaWidth: 4350,  printAreaHeight: 5850 },
            { label: '50x60"', width: 50, height: 60, variantId: 41687, price: 3300, printAreaWidth: 7500,  printAreaHeight: 9000 },
            { label: '68x80"', width: 68, height: 80, variantId: 45130, price: 4900, printAreaWidth: 10200, printAreaHeight: 12000 },
          ],
        }],
      },
    ],
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
  if (ratio < 0.85) return '1024x1536'
  return '1024x1024'
}