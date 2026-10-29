import type { Metadata } from 'next'
import { Suspense } from 'react'
import { TrackOrder } from './track-order'

export const metadata: Metadata = {
  title: 'Rastrear pedido | ZELTRON Express',
  description: 'Consulta el estado de tu pedido de ZELTRON Express con tu número de pedido.',
}

export default function Page() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-5xl">Rastrea tu pedido</h1>
      <p className="mt-3 text-[#5B6478]">Escribe el número que te dimos al comprar (empieza por ZX) y el celular del pedido.</p>
      <Suspense>
        <TrackOrder />
      </Suspense>
    </main>
  )
}
