import Link from 'next/link'
import { ArrowRight, BadgeCheck, CircleCheck, Clock, Headset, MessageCircle, PackageCheck, ShoppingBag, TriangleAlert } from 'lucide-react'
import { getCategories } from '@/lib/catalog'
import { whatsappLink } from '@/lib/config'
import { getFinanciers, type Financier } from '@/lib/financiers'
import { creditMessage, FinancierLogo } from '@/components/financing'

export const metadata = {
  title: 'Compra a crédito | ZELTRON Express',
  description: 'Llévate tu tecnología hoy y págala a cuotas con nuestras financieras aliadas, también si estás reportado.',
}

function FinancierCard({ financier }: { financier: Financier }) {
  const online = Boolean(financier.applyUrl)
  return (
    <li className="flex flex-col rounded-2xl border border-[#DCE1EC] bg-white p-4 transition hover:border-[#2F5BFF]/50 hover:shadow-[0_12px_30px_rgba(14,26,58,.08)]">
      <FinancierLogo financier={financier} className="h-16 w-full border border-[#E8ECF4]" />
      <p className="mt-3 font-bold text-[#0E1A3A]">{financier.name}</p>
      {financier.description && <p className="mt-1 text-sm leading-5 text-[#5B6478]">{financier.description}</p>}
      <a
        href={financier.applyUrl ?? whatsappLink(creditMessage(financier.name))}
        target="_blank"
        rel="noreferrer"
        className={online
          ? 'mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2F5BFF] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#244be0]'
          : 'mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#16A34A] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#12843d]'}
      >
        {online ? <>Solicitar en línea <ArrowRight aria-hidden="true" className="size-4" /></> : <><MessageCircle aria-hidden="true" className="size-4" /> Solicitar con asesor</>}
      </a>
    </li>
  )
}

function Group({ id, icon, title, highlight, text, financiers }: { id: string; icon: React.ReactNode; title: string; highlight: string; text: string; financiers: Financier[] }) {
  if (financiers.length === 0) return null
  return (
    <section aria-labelledby={id} className="rounded-3xl border border-[#DCE1EC] bg-[#F7F8FC] p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#0E1A3A] text-[#FFC92E]">{icon}</span>
        <div>
          <h2 id={id} className="text-2xl sm:text-3xl">{title} <span className="text-[#2F5BFF]">{highlight}</span></h2>
          <p className="mt-1 text-sm text-[#5B6478]">{text}</p>
        </div>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {financiers.map((f) => <FinancierCard key={f.id} financier={f} />)}
      </ul>
    </section>
  )
}

export default async function CreditPage() {
  const [financiers, categories] = await Promise.all([getFinanciers(), getCategories()])
  const good = financiers.filter((f) => f.audience !== 'reported')
  const reported = financiers.filter((f) => f.audience !== 'good')

  return (
    <main>
      <section className="bg-[#0E1A3A] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.2fr_.8fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="hero-pill"><span aria-hidden="true" className="hero-pill-dot" />Compra a crédito</p>
            <h1 className="hero-title mt-4">Llévalo hoy, <span className="text-[#FFC92E]">págalo a cuotas.</span></h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              Financia tu celular, televisor, portátil o consola con nuestras financieras aliadas. Opciones para buen historial crediticio y también para personas reportadas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={whatsappLink(creditMessage())} target="_blank" rel="noreferrer" className="btn-volt"><MessageCircle aria-hidden="true" className="size-4" /> Hablar con un asesor</a>
              <Link href="/productos" className="btn-ghost-light">Elegir producto</Link>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {([[Clock, 'Aprobación rápida', 'Respuesta el mismo día en la mayoría de casos'], [BadgeCheck, 'Proceso sencillo', 'Solo tu cédula y tu celular'], [Headset, 'Te acompañamos', 'Un asesor te guía por WhatsApp']] as const).map(([Icon, title, text]) => (
              <li key={title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FFC92E] text-[#0E1A3A]"><Icon className="size-5" /></span>
                <span><strong className="block text-sm">{title}</strong><span className="block text-xs text-white/65">{text}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 lg:px-8">
        {financiers.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#DCE1EC] bg-white p-8 text-center text-[#5B6478]">
            Escríbenos por WhatsApp y te contamos las opciones de crédito disponibles.
          </p>
        ) : (
          <>
            <Group id="good" icon={<CircleCheck className="size-5" />} title="Para personas con" highlight="buen historial crediticio" text="Cupos más altos y cuotas cómodas." financiers={good} />
            <Group id="reported" icon={<TriangleAlert className="size-5" />} title="Para personas" highlight="reportadas" text="Aunque tengas reportes en centrales de riesgo, puedes estrenar." financiers={reported} />
          </>
        )}

        <section aria-labelledby="how" className="py-8">
          <h2 id="how">Así de fácil</h2>
          <ol className="mt-6 grid gap-3 md:grid-cols-3">
            {([[ShoppingBag, 'Elige tu producto', 'Busca en el catálogo lo que necesitas.'], [MessageCircle, 'Solicita tu crédito', 'En línea o con un asesor por WhatsApp, con la financiera que prefieras.'], [PackageCheck, 'Recíbelo en casa', 'Con el crédito aprobado, despachamos tu pedido.']] as const).map(([Icon, title, text], i) => (
              <li key={title} className="relative rounded-2xl border border-[#DCE1EC] bg-white p-5">
                <span className="absolute right-4 top-4 text-3xl font-extrabold text-[#E8ECF4]">{i + 1}</span>
                <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-[#EAF0FF] text-[#2F5BFF]"><Icon className="size-5" /></span>
                <p className="mt-3 font-bold text-[#0E1A3A]">{title}</p>
                <p className="mt-1 text-sm text-[#5B6478]">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {categories.length > 0 && (
          <section aria-labelledby="what" className="rounded-3xl bg-[#0E1A3A] p-6 text-white sm:p-8">
            <h2 id="what" className="text-2xl text-white sm:text-3xl">Financia una <span className="text-[#FFC92E]">amplia variedad</span> de productos</h2>
            <ul className="mt-5 flex flex-wrap gap-2">
              {categories.map((c) => (
                <li key={c.name}>
                  <Link href={`/productos?categoria=${encodeURIComponent(c.name)}`} className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-[#FFC92E] hover:text-[#0E1A3A]">{c.name}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs leading-5 text-[#5B6478]">
          La aprobación, el cupo, el número de cuotas y las tasas los define cada entidad financiera según su estudio. ZELTRON Express no otorga créditos directamente.
        </p>
      </div>
    </main>
  )
}
