'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { WhatsApp } from '@/components/storefront'
import { OrderTimeline } from '@/components/order-timeline'
import { PanelSkeleton } from '@/components/skeletons'
import { whatsappLink } from '@/lib/config'
import { formatCOP } from '@/lib/format'
import { useHydrated } from '@/lib/use-hydrated'
import { useOrders } from '@/store/orders'

export function OrderDetails() {
  const { id } = useParams<{ id: string }>()
  const hydrated = useHydrated()
  const order = useOrders((s) => s.orders.find((o) => o.reference === id))

  if (!hydrated) return <PanelSkeleton label="Cargando tu pedido" />

  if (!order) {
    return (
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-4xl">No encontramos este pedido en este dispositivo</h1>
        <p className="mt-4 text-[#5B6478]">Si lo hiciste desde otro celular o computador, consúltalo con tu número de pedido.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/rastrear?pedido=${encodeURIComponent(id)}`} className="btn-primary">Rastrear pedido</Link>
          <a href={whatsappLink(`Hola, quiero consultar mi pedido ${id}.`)} target="_blank" rel="noreferrer" className="btn-secondary">Consultar por WhatsApp</a>
        </div>
      </main>
    )
  }

  const lines = order.items.map((i) => `• ${i.quantity} x ${i.name}${i.selectedVariant !== 'Única' ? ` (${i.selectedVariant})` : ''}`).join('\n')
  const message = `Hola, confirmo mi pedido ${order.orderNumber}:\n${lines}\nTotal: ${formatCOP(order.total)} (contra entrega)\nEntrega: ${order.customer.address}, ${order.customer.city}\nA nombre de: ${order.customer.name} · ${order.customer.phone}`

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#0E1A3A] p-6 text-white sm:p-10">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(30rem_20rem_at_0%_0%,rgba(47,91,255,.45),transparent_65%)]" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-[#FFC92E]">¡Pedido recibido!</p>
              <h1 className="mt-2 text-4xl text-white sm:text-5xl">Gracias, {order.customer.name.split(' ')[0]}</h1>
              <p className="mt-3 text-white/70">Número de pedido <strong className="font-mono text-white">{order.orderNumber}</strong></p>
            </div>
            <a href={whatsappLink(message)} target="_blank" rel="noreferrer" className="btn-volt">
              <MessageCircle aria-hidden="true" className="size-4" /> Confirmar por WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-2xl border border-[#DCE1EC] bg-white p-6" aria-labelledby="estado">
            <h2 id="estado" className="mb-5 text-xl">Estado de tu pedido</h2>
            <OrderTimeline current="confirmacion" createdAt={order.createdAt} zone={order.zone} />
          </section>

          <section className="h-fit rounded-2xl border border-[#DCE1EC] bg-white p-6" aria-labelledby="resumen">
            <h2 id="resumen" className="text-xl">Resumen</h2>
            <ul className="mt-5 flex flex-col gap-2 text-sm">
              {order.items.map((item) => (
                <li key={`${item.name}-${item.selectedVariant}`} className="flex justify-between gap-3">
                  <span>{item.quantity} × {item.name}</span>
                  <span className="tabular-nums">{formatCOP(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 flex flex-col gap-2 border-t border-[#E6EAF2] pt-4 text-sm text-[#5B6478]">
              <div className="flex justify-between"><dt>Envío</dt><dd>{order.shipping === 0 ? 'Gratis' : formatCOP(order.shipping)}</dd></div>
              <div className="flex justify-between text-base font-extrabold text-[#0E1A3A]"><dt>Pagas al recibir</dt><dd className="tabular-nums">{formatCOP(order.total)}</dd></div>
            </dl>
            <div className="mt-5 rounded-xl bg-[#F3F5FA] p-4 text-sm text-[#5B6478]">
              <p className="font-semibold text-[#0E1A3A]">{order.customer.name}</p>
              <p>{order.customer.address}</p>
              <p>{order.customer.city}</p>
              <p>{order.customer.phone}</p>
            </div>
            <Link href="/productos" className="mt-5 block text-center text-sm font-semibold text-[#2F5BFF]">Seguir comprando</Link>
          </section>
        </div>
      </main>
      <WhatsApp />
    </>
  )
}
