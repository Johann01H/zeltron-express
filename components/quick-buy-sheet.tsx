'use client'

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { LockKeyhole, Minus, Plus, X } from 'lucide-react'
import { DeliveryFields, readDeliveryForm } from '@/components/delivery-fields'
import { shippingFor } from '@/lib/config'
import { formatCOP } from '@/lib/format'
import type { Product } from '@/lib/types'
import { useOrders } from '@/store/orders'
import { placeOrder } from '@/src/app/checkout/actions'

type Props = { product: Product; variant: string; open: boolean; onClose: () => void; initialQuantity: number }

/** Compra en un paso: pide el producto contra entrega sin pasar por el carrito. */
export function QuickBuySheet({ product, variant, open, onClose, initialQuantity }: Props) {
  const router = useRouter()
  const addOrder = useOrders((s) => s.addOrder)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [quantity, setQuantity] = useState(initialQuantity)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const subtotal = product.price * quantity
  const shipping = shippingFor(subtotal)
  const maxQty = Math.max(1, Math.min(product.stock, 10))

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setQuantity(initialQuantity)
      setError('')
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open, initialQuantity])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await placeOrder({
        customer: readDeliveryForm(form),
        items: [{ productId: product.id, variant, quantity }],
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      addOrder(result.order)
      onClose()
      router.push(`/pedido/${result.order.reference}`)
    })
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose() }}
      aria-labelledby="quick-buy-title"
      className="quick-buy"
    >
      <form onSubmit={submit} className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-[#E6EAF2] px-5 py-4">
          <div>
            <h2 id="quick-buy-title" className="text-xl text-[#0E1A3A]">Pedir contra entrega</h2>
            <p className="text-xs text-[#5B6478]">Pagas en efectivo cuando lo recibes.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full text-[#5B6478] transition hover:bg-[#F3F5FA] hover:text-[#0E1A3A]">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-4 rounded-2xl border border-[#DCE1EC] bg-[#F8FAFD] p-3">
            <img src={product.images[0]} alt="" className="size-16 shrink-0 rounded-xl bg-[#EEF2F9] object-contain p-1.5 mix-blend-multiply" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#0E1A3A]">{product.name}</p>
              {variant !== 'Única' && <p className="text-xs text-[#5B6478]">{variant}</p>}
              <p className="mt-0.5 text-sm font-extrabold tabular-nums text-[#0E1A3A]">{formatCOP(product.price)}</p>
            </div>
            <div className="flex items-center rounded-lg border border-[#DCE1EC] bg-white">
              <button type="button" aria-label="Reducir cantidad" className="grid size-8 place-items-center" onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus className="size-3.5" /></button>
              <span className="w-6 text-center text-sm font-bold tabular-nums" aria-live="polite">{quantity}</span>
              <button type="button" aria-label="Aumentar cantidad" className="grid size-8 place-items-center" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}><Plus className="size-3.5" /></button>
            </div>
          </div>

          <h3 className="mb-3 mt-6 text-sm font-bold text-[#0E1A3A]">¿A dónde lo enviamos?</h3>
          <DeliveryFields prefix="qb-" withEmail={false} compact />
        </div>

        <div className="border-t border-[#E6EAF2] bg-white px-5 py-4">
          <dl className="mb-3 flex flex-col gap-1 text-sm">
            <div className="flex justify-between text-[#5B6478]"><dt>Productos</dt><dd className="tabular-nums">{formatCOP(subtotal)}</dd></div>
            <div className="flex justify-between text-[#5B6478]"><dt>Envío</dt><dd>{shipping === 0 ? <span className="font-semibold text-[#12805C]">Gratis</span> : formatCOP(shipping)}</dd></div>
            <div className="flex justify-between text-base font-extrabold text-[#0E1A3A]"><dt>Pagas al recibir</dt><dd className="tabular-nums">{formatCOP(subtotal + shipping)}</dd></div>
          </dl>
          {error && <p role="alert" className="mb-3 rounded-lg bg-[#FFF1F0] px-3 py-2 text-xs font-semibold text-[#B42318]">{error}</p>}
          <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center rounded-xl bg-[#2F5BFF] text-sm font-bold text-white shadow-[0_10px_24px_rgba(47,91,255,.3)] transition hover:bg-[#2449D8] disabled:opacity-70">
            {pending ? 'Enviando pedido…' : 'Confirmar pedido'}
          </button>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#8A91A3]">
            <LockKeyhole aria-hidden="true" className="size-3" /> Te escribimos por WhatsApp para confirmar antes de despachar.
          </p>
        </div>
      </form>
    </dialog>
  )
}
