'use client'
import Link from 'next/link'
import { Truck } from 'lucide-react'
import type { Product } from '@/lib/types'
import { ProductCard } from '@/components/storefront'
import { CartLine, WhatsApp } from '@/components/storefront'
import { FREE_SHIPPING_FROM, shippingFor } from '@/lib/config'
import { formatCOP } from '@/lib/format'
import { useHydrated } from '@/lib/use-hydrated'
import { cartSubtotal, useCart } from '@/store/cart'

export function CartView({ products }: { products: Product[] }) {
  const hydrated = useHydrated()
  const items = useCart((s) => s.items)
  const subtotal = cartSubtotal(items)
  const shipping = shippingFor(subtotal)
  const missing = Math.max(0, FREE_SHIPPING_FROM - subtotal)
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_FROM) * 100))
  // Complementos: productos económicos que no están en el carrito, para completar el envío gratis.
  const inCart = new Set(items.map((i) => i.id))
  const addOns = products.filter((p) => !inCart.has(p.id) && p.stock > 0).sort((a, b) => a.price - b.price).slice(0, 4)

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        <h1 className="text-5xl">Tu carrito</h1>
        {!hydrated ? (
          <div className="mt-10 h-40 animate-pulse rounded-2xl border border-[#DDE2EE] bg-white" aria-busy="true" />
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-[#DDE2EE] bg-white p-12 text-center">
            <p className="text-[#5B6478]">Tu carrito está esperando productos.</p>
            <Link href="/productos" className="btn-primary mt-5">Explorar productos</Link>
          </div>
        ) : (
          <>
          <div className="mt-8 rounded-2xl border border-[#DCE1EC] bg-white p-5">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#0E1A3A] text-[#FFC92E]"><Truck className="size-4" /></span>
              <p className="text-sm text-[#0E1A3A]">
                {missing > 0 ? <>Te faltan <strong className="tabular-nums">{formatCOP(missing)}</strong> para el <strong>envío gratis</strong></> : <><strong>¡Listo!</strong> Tu pedido tiene envío gratis</>}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E6EAF2]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso hacia el envío gratis">
              <div className="h-full rounded-full bg-gradient-to-r from-[#2F5BFF] to-[#FFC92E] transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.3fr_.7fr]">
            <div className="rounded-2xl border border-[#DDE2EE] bg-white px-5">
              {items.map((i) => <CartLine key={`${i.id}-${i.selectedVariant}`} item={i} />)}
            </div>
            <aside className="h-fit rounded-2xl border border-[#DDE2EE] bg-white p-5">
              <h2 className="text-xl">Resumen</h2>
              <div className="mt-6 flex justify-between text-sm text-[#5B6478]"><span>Subtotal</span><span className="tabular-nums">{formatCOP(subtotal)}</span></div>
              <div className="mt-3 flex justify-between text-sm text-[#5B6478]"><span>Envío</span><span>{shipping === 0 ? 'Gratis' : formatCOP(shipping)}</span></div>
              <div className="my-5 flex justify-between border-t border-[#DDE2EE] pt-5 font-bold"><span>Total</span><span className="tabular-nums">{formatCOP(subtotal + shipping)}</span></div>

              <Link href="/checkout" className="btn-primary w-full">Continuar compra</Link>
              <p className="mt-3 text-center text-xs text-[#5B6478]">Pagas en efectivo al recibir</p>
            </aside>
          </div>
          {addOns.length > 0 && (
            <section className="mt-14" aria-labelledby="addons-title">
              <h2 id="addons-title" className="text-2xl">Completa tu pedido</h2>
              <p className="mt-1 text-sm text-[#5B6478]">Llega en el mismo envío.</p>
              <div className="product-grid mt-6">{addOns.map((p) => <ProductCard key={p.id} product={p} />)}</div>
            </section>
          )}
          </>
        )}
      </main>
      <WhatsApp />
    </>
  )
}
