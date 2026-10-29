'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/lib/types'

type CartStore = {
  items: CartItem[]
  addItem: (product: Product, variant?: string, quantity?: number) => void
  removeItem: (id: string, variant: string) => void
  updateQuantity: (id: string, variant: string, quantity: number) => void
  clear: () => void
}

const sameLine = (item: CartItem, id: string, variant: string) => item.id === id && item.selectedVariant === variant

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, variant = product.variants[0], quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => sameLine(item, product.id, variant))
          if (existing) {
            return {
              items: state.items.map((item) =>
                item === existing ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock || 99) } : item,
              ),
            }
          }
          const { id, slug, name, price, images } = product
          return { items: [...state.items, { id, slug, name, price, images, selectedVariant: variant, quantity }] }
        }),
      removeItem: (id, variant) => set((state) => ({ items: state.items.filter((item) => !sameLine(item, id, variant)) })),
      updateQuantity: (id, variant, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((item) => !sameLine(item, id, variant))
              : state.items.map((item) => (sameLine(item, id, variant) ? { ...item, quantity } : item)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'zx-cart', version: 1 },
  ),
)

export const cartSubtotal = (items: CartItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0)
export const cartCount = (items: CartItem[]) => items.reduce((sum, item) => sum + item.quantity, 0)
