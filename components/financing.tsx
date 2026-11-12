import Link from 'next/link'
import { ArrowRight, Banknote, CreditCard, MessageCircle } from 'lucide-react'
import { whatsappLink } from '@/lib/config'
import { getFinanciers, type Financier } from '@/lib/financiers'
import { formatCOP } from '@/lib/format'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

/** Logo oficial sobre fondo blanco; sin logo, el nombre. */
export function FinancierLogo({ financier, className }: { financier: Financier; className?: string }) {
  return (
    <span className={cn('grid place-items-center rounded-lg bg-white px-2.5', className)} title={financier.name}>
      {financier.logoUrl ? (
        <img src={financier.logoUrl} alt={financier.name} loading="lazy" className="max-h-[70%] max-w-full object-contain" />
      ) : (
        <span className="max-w-full truncate text-[11px] font-extrabold tracking-tight text-[#0E1A3A]">{financier.name}</span>
      )}
    </span>
  )
}

export const creditMessage = (financier?: string, product?: Pick<Product, 'name' | 'price'>) =>
  `Hola, quiero comprar a crédito${financier ? ` con ${financier}` : ''}${product ? `: ${product.name} (${formatCOP(product.price)})` : ''}. ¿Me ayudas con la solicitud?`

/** Franja «Medios de pago» del footer. */
export async function PaymentMethodsStrip() {
  const financiers = await getFinanciers()
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="shrink-0">
          <p className="text-sm font-bold text-white">Medios de pago</p>
          <p className="text-xs text-white/60">Contra entrega o a crédito</p>
        </div>
        <ul className="flex flex-wrap items-center gap-2" aria-label="Medios de pago aceptados">
          <li className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#FFC92E] px-3 text-xs font-extrabold text-[#0E1A3A]">
            <Banknote aria-hidden="true" className="size-4" /> Contra entrega
          </li>
          {financiers.map((f) => (
            <li key={f.id}><FinancierLogo financier={f} className="h-9 w-[5.5rem]" /></li>
          ))}
        </ul>
        {financiers.length > 0 && (
          <Link href="/credito" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#FFC92E] lg:ml-auto">
            Compra a crédito <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

/** Bloque «¿Lo quieres a crédito?» de la página de producto. */
export function ProductFinancing({ product, financiers }: { product: Product; financiers: Financier[] }) {
  if (financiers.length === 0 || product.stock <= 0) return null
  const forReported = financiers.some((f) => f.audience !== 'good')
  return (
    <div className="mt-6 rounded-2xl border border-[#DCE1EC] bg-white p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0E1A3A] text-[#FFC92E]"><CreditCard className="size-5" /></span>
        <div className="min-w-0">
          <p className="font-bold text-[#0E1A3A]">¿Lo quieres a crédito?</p>
          <p className="text-sm text-[#5B6478]">
            Llévalo hoy y págalo a cuotas con nuestras financieras aliadas{forReported ? ', también si estás reportado' : ''}.
          </p>
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Financieras aliadas">
        {financiers.slice(0, 8).map((f) => (
          <li key={f.id}><FinancierLogo financier={f} className="h-8 w-20 border border-[#E8ECF4]" /></li>
        ))}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a href={whatsappLink(creditMessage(undefined, product))} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-3 text-sm font-bold text-white hover:bg-[#12843d]">
          <MessageCircle aria-hidden="true" className="size-4" /> Pedir a crédito
        </a>
        <Link href="/credito" className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#DCE1EC] px-4 py-3 text-sm font-bold text-[#0E1A3A] hover:border-[#2F5BFF] hover:text-[#2F5BFF]">
          Ver opciones de crédito <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </div>
  )
}
