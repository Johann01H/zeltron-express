'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react'
import { discount, formatCOP, isOnSale } from '@/lib/format'
import type { Product } from '@/lib/types'
import { useCart } from '@/store/cart'

function RailCard({ product }: { product: Product }) {
  const add = useCart((s) => s.addItem)
  const [added, setAdded] = useState(false)
  const outOfStock = product.stock <= 0

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 1600)
    return () => clearTimeout(t)
  }, [added])

  return (
    <article className="group relative flex w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#DCE1EC] bg-white transition hover:border-[#2F5BFF]/50 hover:shadow-[0_12px_30px_rgba(14,26,58,.10)] sm:w-[calc(50%-.375rem)] lg:w-[calc(33.333%-.5rem)]">
      <Link href={`/producto/${product.slug}`} className="grid w-[38%] shrink-0 place-items-center bg-[#F4F6FB] p-3" tabIndex={-1} aria-hidden="true">
        <img src={product.images[0]} alt="" loading="lazy" className="aspect-square w-full object-contain transition duration-300 group-hover:scale-105" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[10px] font-bold uppercase tracking-[.12em] text-[#2F5BFF]">{product.brand ?? product.subcategory}</p>
          {isOnSale(product) && (
            <span className="shrink-0 rounded-full bg-[#FFC92E] px-2 py-0.5 text-[11px] font-extrabold text-[#0E1A3A]">-{discount(product)}%</span>
          )}
        </div>
        <Link href={`/producto/${product.slug}`} className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-[#0E1A3A] after:absolute after:inset-0 after:content-['']">
          {product.name}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            {isOnSale(product) && <del className="block text-xs tabular-nums text-[#5B6478]">{formatCOP(product.compareAtPrice!)}</del>}
            <strong className="block text-lg font-extrabold tabular-nums text-[#0E1A3A]">{formatCOP(product.price)}</strong>
          </div>
          <button
            type="button"
            onClick={() => { add(product); setAdded(true) }}
            disabled={outOfStock}
            aria-label={outOfStock ? `${product.name} agotado` : `Agregar ${product.name} al carrito`}
            className="relative z-10 grid size-11 shrink-0 place-items-center rounded-xl bg-[#2F5BFF] text-white shadow-[0_8px_20px_rgba(47,91,255,.25)] transition hover:bg-[#244be0] disabled:bg-[#C9CFDD] disabled:shadow-none"
          >
            {added ? <Check className="size-5" /> : <ShoppingCart className="size-5" />}
          </button>
        </div>
        <span aria-live="polite" className="sr-only">{added ? 'Agregado al carrito' : ''}</span>
      </div>
    </article>
  )
}

/** Fila deslizable de productos debajo del mosaico de banners. */
export function PromoProductRail({ products, label }: { products: Product[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: products.length <= 3 })

  function update() {
    const el = ref.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }

  function scroll(dir: 1 | -1) {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="relative mt-4">
      <div
        ref={ref}
        onScroll={update}
        role="region"
        aria-label={`Productos de ${label}`}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => <RailCard key={p.id} product={p} />)}
      </div>
      {!edges.start && (
        <button type="button" onClick={() => scroll(-1)} aria-label="Ver productos anteriores" className="absolute -left-4 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-[#DCE1EC] bg-white text-[#0E1A3A] shadow-lg hover:text-[#2F5BFF] lg:grid">
          <ChevronLeft className="size-5" />
        </button>
      )}
      {!edges.end && (
        <button type="button" onClick={() => scroll(1)} aria-label="Ver más productos" className="absolute -right-4 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-[#DCE1EC] bg-white text-[#0E1A3A] shadow-lg hover:text-[#2F5BFF] lg:grid">
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  )
}
