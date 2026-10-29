import type { Product } from './types'

export const formatCOP = (value: number) => `$${value.toLocaleString('es-CO')}`

export const isOnSale = (product: Product) =>
  product.compareAtPrice !== null && product.compareAtPrice > product.price

export const discount = (product: Product) =>
  isOnSale(product) ? Math.round((1 - product.price / product.compareAtPrice!) * 100) : 0
