'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { PackageSearch } from 'lucide-react'
import { fieldClass, Field } from '@/components/delivery-fields'
import { whatsappLink } from '@/lib/config'
import { useOrders } from '@/store/orders'

export function TrackOrder() {
  const router = useRouter()
  const params = useSearchParams()
  const orders = useOrders((s) => s.orders)
  const [notFound, setNotFound] = useState<{ number: string; phone: string } | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const number = String(form.get('number') ?? '').trim().toUpperCase()
    const phone = String(form.get('phone') ?? '').replace(/\D/g, '')
    // TODO(zeltron-core): consultar el estado real en WordPress.
    const local = orders.find((o) => (o.orderNumber.toUpperCase() === number || o.reference.toUpperCase() === number) && o.customer.phone.replace(/\D/g, '').endsWith(phone.slice(-7)))
    if (local) router.push(`/pedido/${local.reference}`)
    else setNotFound({ number, phone })
  }

  return (
    <>
      <form onSubmit={submit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#DCE1EC] bg-white p-6">
        <Field label="Número de pedido" htmlFor="number">
          <input id="number" name="number" defaultValue={params.get('pedido') ?? ''} placeholder="ZX-20261029-AB12CD" required className={`${fieldClass} font-mono uppercase`} />
        </Field>
        <Field label="Celular del pedido" htmlFor="phone">
          <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="300 000 0000" required className={fieldClass} />
        </Field>
        <button type="submit" className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#2F5BFF] text-sm font-bold text-white transition hover:bg-[#2449D8]">
          <PackageSearch aria-hidden="true" className="size-4" /> Buscar pedido
        </button>
      </form>
      {notFound && (
        <div role="status" className="mt-4 rounded-2xl border border-[#F3DE9A] bg-[#FFF9E6] p-5 text-sm text-[#6B4E00]">
          <p className="font-semibold">No encontramos ese pedido en este dispositivo.</p>
          <p className="mt-1">Escríbenos y te contamos en qué va. Ten a mano tu número de pedido.</p>
          <a href={whatsappLink(`Hola, quiero saber el estado de mi pedido ${notFound.number} (celular ${notFound.phone}).`)} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 items-center rounded-lg bg-[#16A34A] px-4 font-bold text-white">
            Consultar por WhatsApp
          </a>
        </div>
      )}
    </>
  )
}
