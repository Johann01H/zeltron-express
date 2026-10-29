import type { Metadata } from 'next'
import { Suspense } from 'react'
import { OrderDetails } from './order-details'
import { PanelSkeleton } from '@/components/skeletons'

export const metadata: Metadata = { title: 'Tu pedido | ZELTRON Express', robots: { index: false } }

export default function OrderPage() {
  return (
    <Suspense fallback={<PanelSkeleton label="Cargando tu pedido" />}>
      <OrderDetails />
    </Suspense>
  )
}
