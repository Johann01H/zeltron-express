'use client'
import { useState } from 'react'
import { Check, MessageCircle, Minus, Plus, ShoppingCart } from 'lucide-react'
import { QuickBuySheet } from '@/components/quick-buy-sheet'
import { whatsappLink } from '@/lib/config'
import { formatCOP } from '@/lib/format'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useCart } from '@/store/cart'

export function ProductActions({ product }: { product: Product }) {
  const [variant, setVariant] = useState(product.variants[0])
  const [quantity, setQuantity] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const add = useCart((s) => s.addItem)
  const outOfStock = product.stock <= 0
  const hasVariants = product.variants.length > 1 || product.variants[0] !== 'Única'
  const maxQty = Math.max(1, Math.min(product.stock, 10))

  const addToCart = () => {
    add(product, variant, quantity)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div id="comprar" className="mt-7 scroll-mt-40">
      {hasVariants && (
        <fieldset className="mb-5">
          <legend className="mb-3 text-sm font-semibold">Variante</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button key={v} type="button" onClick={() => setVariant(v)} aria-pressed={variant === v}
                className={cn('rounded-lg border px-3 py-2 text-sm', variant === v ? 'border-[#2F5BFF] bg-[#2F5BFF]/10 text-[#2F5BFF]' : 'border-[#DCE1EC] text-[#5B6478]')}>
                {v}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex items-center rounded-xl border border-[#DCE1EC] bg-white" aria-label="Cantidad">
          <button type="button" aria-label="Reducir cantidad" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="grid h-12 w-11 place-items-center"><Minus className="size-4" /></button>
          <span className="w-8 text-center font-bold tabular-nums">{quantity}</span>
          <button type="button" aria-label="Aumentar cantidad" onClick={() => setQuantity(Math.min(maxQty, quantity + 1))} className="grid h-12 w-11 place-items-center"><Plus className="size-4" /></button>
        </div>
        <button type="button" disabled={outOfStock} onClick={() => setSheetOpen(true)}
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-[#2F5BFF] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(47,91,255,.28)] transition hover:bg-[#2449D8] disabled:opacity-50">
          {outOfStock ? 'Agotado' : 'Pedir contra entrega'}
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={outOfStock} onClick={addToCart}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#0E1A3A] bg-white text-sm font-bold text-[#0E1A3A] transition hover:bg-[#0E1A3A] hover:text-white disabled:opacity-50">
          {added ? <><Check className="size-4" /> Agregado al carrito</> : <><ShoppingCart className="size-4" /> Agregar al carrito</>}
        </button>
        <a href={whatsappLink(`Hola, estoy interesado en ${product.name} por ${formatCOP(product.price)}.`)} target="_blank" rel="noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#DCE1EC] bg-white text-sm font-bold text-[#12805C] transition hover:border-[#16A34A]">
          <MessageCircle className="size-4" /> Preguntar por WhatsApp
        </a>
      </div>

      {/* Barra fija en celular */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-white/10 bg-[#0E1A3A]/95 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-xs text-white/70">Pagas al recibir</p>
          <strong className="text-lg tabular-nums text-white">{formatCOP(product.price)}</strong>
        </div>
        <button type="button" disabled={outOfStock} onClick={() => setSheetOpen(true)} className="btn-volt h-11! px-5!">
          {outOfStock ? 'Agotado' : 'Pedir ahora'}
        </button>
      </div>

      <QuickBuySheet product={product} variant={variant} open={sheetOpen} onClose={() => setSheetOpen(false)} initialQuantity={quantity} />
    </div>
  )
}
