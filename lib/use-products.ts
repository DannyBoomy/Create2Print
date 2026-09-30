// lib/use-products.ts
// Replaces the static PRODUCTS import from products.ts
// Fetches from Supabase-cached catalog via /api/get-products

import { useState, useEffect } from 'react'

export interface SizeOption {
  label: string
  width: number
  height: number
  variantId: number
  price: number
  printAreaWidth: number
  printAreaHeight: number
  placeholderCount: number
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
  id: string
  blueprintId: number
  providerId: number
  name: string
  description: string
  emoji: string
  category: string
  printifyBlueprintId: number
  printifyPrintProviderId: number
  hasColors: boolean
  hasFinishes: boolean
  recommendTransparent: boolean
  canCoolerConstraint: boolean
  hasMultiplePrintAreas: boolean
  customImage: string | null
  catalogImages: string[]
  productContext: string
  colors: ColorOption[]
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/get-products')
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products)
        else setError(data.error || 'Failed to load products')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { products, loading, error }
}

export function getSizes(product: Product, colorLabel: string, finishLabel: string): SizeOption[] {
  const color = product.colors.find(c => c.label === colorLabel) || product.colors[0]
  if (!color) return []
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