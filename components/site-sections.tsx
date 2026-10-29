import Link from 'next/link'
import { ArrowRight, BatteryCharging, CreditCard, Gamepad2, Headphones, Home, MessageCircle, ShieldCheck, Smartphone, Truck, Watch } from 'lucide-react'
import { COMPANY_NAME, FACEBOOK_URL, FREE_SHIPPING_FROM, INSTAGRAM_URL, whatsappLink } from '@/lib/config'
import { formatCOP } from '@/lib/format'
import type { Category, Product } from '@/lib/types'

export function TrustBar() {
  const items = [
    { Icon: CreditCard, title: 'Pago contra entrega', description: 'Pagas en efectivo al recibir' },
    { Icon: Truck, title: 'Envío a domicilio', description: `Gratis desde ${formatCOP(FREE_SHIPPING_FROM)}` },
    { Icon: ShieldCheck, title: 'Compra protegida', description: '5 días hábiles de retracto' },
    { Icon: MessageCircle, title: 'Soporte por WhatsApp', description: 'Te responde una persona' },
  ]
  return (
    <section className="trust" aria-label="Por qué comprar en ZELTRON Express">
      {items.map(({ Icon, title, description }) => (
        <div key={title} className="trust-item">
          <span className="trust-icon" aria-hidden="true"><Icon className="size-5" /></span>
          <span>
            <strong className="block text-sm font-bold text-[#0E1A3A]">{title}</strong>
            <span className="block text-xs text-[#5B6478]">{description}</span>
          </span>
        </div>
      ))}
    </section>
  )
}

const categoryIcons: Record<string, typeof Smartphone> = {
  Audio: Headphones,
  Smartwatches: Watch,
  'Accesorios para celular': Smartphone,
  'Carga y energía': BatteryCharging,
  'Hogar inteligente': Home,
  'Gamer y oficina': Gamepad2,
}

export function CategoryGrid({ categories, products }: { categories: Category[]; products: Product[] }) {
  const visible = categories.filter((category) => products.some((product) => product.category === category.name))
  if (visible.length === 0) return null
  // La tarjeta "Ver todo" rellena las celdas libres de la última fila (4 columnas en escritorio, 2 en móvil).
  const usedLg = 4 + (visible.length - 1)
  const usedSm = 2 + (visible.length - 1)
  const spanLg = 4 - (usedLg % 4) || 4
  const spanSm = 2 - (usedSm % 2) || 2

  return (
    <section className="py-16" aria-labelledby="category-heading">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 id="category-heading">Compra por categoría</h2>
          <p className="mt-2 text-sm text-[#5B6478]">Audio, carga, hogar inteligente y todo para tu escritorio.</p>
        </div>
        <Link href="/productos" className="link-arrow">Ver catálogo <ArrowRight aria-hidden="true" className="size-4" /></Link>
      </div>
      <div className="cat-grid">
        {visible.map(({ name }, index) => {
          const Icon = categoryIcons[name] ?? Smartphone
          const inCategory = products.filter((product) => product.category === name)
          const featured = inCategory[0]
          return (
            <Link href={`/productos?categoria=${encodeURIComponent(name)}`} key={name} className="cat-card group" data-featured={index === 0 ? 'true' : undefined}>
              {featured && <img src={featured.images[0]} alt="" aria-hidden="true" className="cat-card-image" />}
              <span className="cat-card-count">{inCategory.length} {inCategory.length === 1 ? 'producto' : 'productos'}</span>
              <span className="cat-card-foot">
                <span className="cat-card-icon" aria-hidden="true"><Icon className="size-5" /></span>
                <span className="cat-card-name">{name}</span>
                <ArrowRight aria-hidden="true" className="ml-auto size-5 shrink-0 transition group-hover:translate-x-1" />
              </span>
            </Link>
          )
        })}
        <Link href="/productos" className="cat-all group" style={{ '--span-lg': spanLg, '--span-sm': spanSm } as React.CSSProperties}>
          <span className="text-sm font-semibold text-white/70">{products.length} productos</span>
          <span className="mt-auto block text-2xl font-extrabold leading-tight tracking-[-.04em] text-white">Ver todo el catálogo</span>
          <span className="cat-all-arrow" aria-hidden="true"><ArrowRight className="size-5 transition group-hover:translate-x-0.5" /></span>
        </Link>
      </div>
    </section>
  )
}

const howSteps = [
  { title: 'Eliges y pides', text: 'Sin pagar nada por adelantado. Solo tus datos de entrega.' },
  { title: 'Te confirmamos', text: 'Te escribimos por WhatsApp para validar dirección y horario.' },
  { title: 'Despachamos', text: 'Te enviamos el número de guía para que sigas tu pedido.' },
  { title: 'Pagas al recibir', text: 'Revisas tu pedido y pagas en efectivo al mensajero.' },
]

export function HowItWorks() {
  return (
    <section className="py-16" aria-labelledby="how-title">
      <div className="mb-10 max-w-2xl">
        <h2 id="how-title">Así funciona el pago contra entrega</h2>
        <p className="mt-2 text-sm text-[#5B6478]">Cuatro pasos y no pagas hasta tener el producto en tus manos.</p>
      </div>
      <ol className="how-steps">
        {howSteps.map((step, index) => (
          <li key={step.title} className="how-step">
            <span className="how-step-number" aria-hidden="true">{index + 1}</span>
            <h3 className="mt-4 text-lg text-[#0E1A3A]">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-6 text-[#5B6478]">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Footer() {
  return (
    <footer>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 lg:px-8">
        <div>
          <div className="logo">ZELTRON <span>Express</span></div>
          <p className="mt-3 text-sm text-white/70">Tu aliado en la era digital.</p>
        </div>
        <div>
          <h3>Ayuda y servicio</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
            <Link href="/rastrear">Rastrear pedido</Link>
            <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
            <Link href="/envios">Envíos</Link>
            <Link href="/garantias-y-devoluciones">Garantías y devoluciones</Link>
            <Link href="/contacto">Contacto</Link>
          </div>
        </div>
        <div>
          <h3>Legal</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
            <Link href="/terminos">Términos y condiciones</Link>
            <Link href="/privacidad">Política de privacidad</Link>
          </div>
        </div>
        <div>
          <h3>Síguenos</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
            <a href={whatsappLink()} target="_blank" rel="noreferrer">WhatsApp</a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a>
            <a href={FACEBOOK_URL} target="_blank" rel="noreferrer">Facebook</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">© {COMPANY_NAME}</div>
    </footer>
  )
}
