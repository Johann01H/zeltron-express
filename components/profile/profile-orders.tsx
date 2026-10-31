'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, CreditCard, MapPin, PackageCheck, PackageOpen, RotateCcw, ShoppingBag, Truck } from 'lucide-react'
import type { CustomerOrderSummary, OrderStep } from '@/lib/auth'
import { formatCOP } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EmptyState, PanelHeader } from './profile-ui'

const STEP_STYLE: Record<OrderStep, string> = {
  recibido: 'bg-[#FFF7DB] text-[#8A5A00] ring-[#F3DE9A]',
  confirmacion: 'bg-[#FFF7DB] text-[#8A5A00] ring-[#F3DE9A]',
  despachado: 'bg-[#EAF0FF] text-[#2F5BFF] ring-[#C9D6FF]',
  'en-camino': 'bg-[#EAF0FF] text-[#2F5BFF] ring-[#C9D6FF]',
  entregado: 'bg-[#EEFBF3] text-[#167A53] ring-[#B7E4C7]',
  cancelado: 'bg-[#FFF1F0] text-[#B42318] ring-[#F5C2BD]',
}

const FILTERS = [
  { id: 'todos', label: 'Todos', match: () => true },
  { id: 'curso', label: 'En curso', match: (o: CustomerOrderSummary) => !['entregado', 'cancelado'].includes(o.step) },
  { id: 'entregados', label: 'Entregados', match: (o: CustomerOrderSummary) => o.step === 'entregado' },
  { id: 'cancelados', label: 'Cancelados', match: (o: CustomerOrderSummary) => o.step === 'cancelado' },
] as const

export function StatusBadge({ order }: { order: Pick<CustomerOrderSummary, 'step' | 'status'> }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1', STEP_STYLE[order.step] ?? STEP_STYLE.confirmacion)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {order.status}
    </span>
  )
}

export function ProfileOrders({ orders }: { orders: CustomerOrderSummary[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('todos')
  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0]
  const visible = orders.filter(active.match)

  return (
    <section aria-labelledby="orders-title">
      <PanelHeader title="Mis pedidos" description="Sigue el estado de tus compras y vuelve a pedir tus favoritos." />
      <h2 id="orders-title" className="sr-only">Mis pedidos</h2>

      {orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<ShoppingBag className="size-6" />} title="Aún no tienes pedidos" text="Cuando compres, aquí verás cada pedido con su estado y sus productos.">
            <Link href="/productos" className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#2F5BFF] px-5 text-sm font-bold text-white">Explorar productos</Link>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar pedidos">
            {FILTERS.map((f) => {
              const count = orders.filter(f.match).length
              return (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition',
                    filter === f.id ? 'bg-[#0E1A3A] text-white' : 'bg-[#F3F5FA] text-[#5B6478] hover:text-[#0E1A3A]',
                  )}
                >
                  {f.label} <span className={cn('ml-1 tabular-nums', filter === f.id ? 'text-[#FFC92E]' : 'text-[#8A8C95]')}>{count}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {visible.length === 0 && <p className="rounded-2xl bg-[#F3F5FA] px-4 py-8 text-center text-sm text-[#5B6478]">No hay pedidos en esta categoría.</p>}
            {visible.map((order) => <OrderCard key={order.number} order={order} />)}
          </div>
        </>
      )}
    </section>
  )
}

function OrderCard({ order }: { order: CustomerOrderSummary }) {
  const [open, setOpen] = useState(false)
  const preview = open ? order.items : order.items.slice(0, 2)
  const hidden = order.items.length - preview.length
  const subtotal = order.total - order.shipping
  const detailsId = `order-${order.number}`

  return (
    <article className="overflow-hidden rounded-2xl border border-[#DCE1EC] bg-white transition hover:shadow-[0_12px_30px_rgba(14,26,58,.07)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF1F6] bg-[#FAFBFD] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-mono text-sm font-bold text-[#0E1A3A]">#{order.number}</h3>
          <StatusBadge order={order} />
        </div>
        <p className="text-xs text-[#5B6478]">{order.date}</p>
      </div>

      <ul className="divide-y divide-[#EEF1F6] px-4 sm:px-5">
        {preview.map((item, index) => (
          <li key={`${item.slug}-${index}`} className="flex items-center gap-3 py-3">
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F3F5FA]">
              {item.image ? <img src={item.image} alt="" className="size-full object-contain" loading="lazy" /> : <PackageOpen aria-hidden="true" className="size-5 text-[#9AA3B5]" />}
            </span>
            <div className="min-w-0 flex-1">
              {item.slug ? (
                <Link href={`/producto/${item.slug}`} className="line-clamp-1 text-sm font-semibold text-[#0E1A3A] hover:text-[#2F5BFF]">{item.name}</Link>
              ) : (
                <p className="line-clamp-1 text-sm font-semibold text-[#0E1A3A]">{item.name}</p>
              )}
              <p className="mt-0.5 text-xs text-[#5B6478]">{[item.variant, `Cantidad: ${item.quantity}`].filter(Boolean).join(' · ')}</p>
            </div>
            <p className="text-sm font-bold tabular-nums text-[#0E1A3A]">{formatCOP(item.total)}</p>
          </li>
        ))}
        {hidden > 0 && (
          <li className="py-2.5 text-xs font-semibold text-[#5B6478]">+ {hidden} {hidden === 1 ? 'producto más' : 'productos más'}</li>
        )}
      </ul>

      {open && (
        <div id={detailsId} className="grid gap-3 border-t border-[#EEF1F6] bg-[#FAFBFD] px-4 py-4 text-sm sm:grid-cols-3 sm:px-5">
          <Detail icon={<MapPin className="size-4" />} label="Entrega en">
            <p className="font-semibold text-[#0E1A3A]">{order.address || '—'}</p>
            <p className="text-xs text-[#5B6478]">{order.city}</p>
          </Detail>
          <Detail icon={<Truck className="size-4" />} label="Envío">
            <p className="font-semibold text-[#0E1A3A]">{order.carrier || (order.step === 'confirmacion' ? 'Por confirmar' : 'Transportadora asignada')}</p>
            {order.trackingNumber && <p className="font-mono text-xs text-[#5B6478]">Guía {order.trackingNumber}</p>}
          </Detail>
          <Detail icon={<CreditCard className="size-4" />} label="Pago">
            <p className="font-semibold text-[#0E1A3A]">Contra entrega</p>
            <p className="text-xs text-[#5B6478]">Subtotal {formatCOP(subtotal)} · Envío {order.shipping ? formatCOP(order.shipping) : 'gratis'}</p>
          </Detail>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1F6] px-4 py-3 sm:px-5">
        <p className="text-sm text-[#5B6478]">
          Total <span className="ml-1 text-base font-extrabold tabular-nums text-[#0E1A3A]">{formatCOP(order.total)}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {order.step !== 'cancelado' && order.step !== 'entregado' && (
            <Link href={`/rastrear?pedido=${encodeURIComponent(order.number)}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-[#2F5BFF] hover:bg-[#EAF0FF]">
              <PackageCheck aria-hidden="true" className="size-4" /> Rastrear
            </Link>
          )}
          {order.items[0]?.slug && (order.step === 'entregado' || order.step === 'cancelado') && (
            <Link href={`/producto/${order.items[0].slug}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-[#2F5BFF] hover:bg-[#EAF0FF]">
              <RotateCcw aria-hidden="true" className="size-4" /> Volver a comprar
            </Link>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DCE1EC] px-3 text-xs font-bold text-[#0E1A3A] transition hover:border-[#0E1A3A]"
          >
            {open ? 'Ocultar detalles' : 'Ver detalles'}
            <ChevronDown aria-hidden="true" className={cn('size-4 transition', open && 'rotate-180')} />
          </button>
        </div>
      </div>
    </article>
  )
}

function Detail({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 text-[#2F5BFF]">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#8A8C95]">{label}</p>
        {children}
      </div>
    </div>
  )
}
