'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Copia local de los pedidos que hizo ESTE navegador, solo para mostrar la
 * página de confirmación. La fuente de verdad es WordPress (zeltron-core).
 */
export type PlacedOrder = {
  reference: string
  orderNumber: string
  registered: boolean
  customer: { name: string; phone: string; city: string; address: string }
  /** Zona de entrega usada para el estimado y la línea de tiempo. */
  zone: 'express' | 'national'
  items: { name: string; price: number; quantity: number; selectedVariant: string }[]
  subtotal: number
  shipping: number
  total: number
  createdAt: string
}

type OrdersStore = { orders: PlacedOrder[]; addOrder: (order: PlacedOrder) => void }

export const useOrders = create<OrdersStore>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders].slice(0, 20) })),
    }),
    {
      name: 'zx-orders',
      version: 2,
      migrate: (state) => {
        const s = state as { orders?: PlacedOrder[] }
        return { orders: (s.orders ?? []).map((o) => ({ ...o, zone: o.zone ?? 'national' })) } as OrdersStore
      },
    },
  ),
)
