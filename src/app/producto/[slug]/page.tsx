import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CreditCard, MessageCircle, ShieldCheck, Truck } from 'lucide-react'
import { getProduct, getProducts } from '@/lib/catalog'
import { FREE_SHIPPING_FROM, STORE_NAME } from '@/lib/config'
import { discount, formatCOP, isOnSale } from '@/lib/format'
import { ProductCard, WhatsApp } from '@/components/storefront'
import { FavoriteButton } from '@/components/favorite-button'
import { ProductActions } from './product-actions'
import { ProductGallery } from '@/components/product-gallery'
import { DeliveryEstimate } from '@/components/delivery-estimate'

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<'/producto/[slug]'>): Promise<Metadata> {
  const p = await getProduct((await params).slug)
  return p
    ? { title: `${p.name} | ${STORE_NAME}`, description: p.description, openGraph: { title: p.name, description: p.description, images: p.images } }
    : { title: `Producto | ${STORE_NAME}` }
}

export default async function ProductPage({ params }: PageProps<'/producto/[slug]'>) {
  const p = await getProduct((await params).slug)
  if (!p) notFound()

  const products = await getProducts()
  const related = [
    ...products.filter((x) => x.slug !== p.slug && x.category === p.category),
    ...products.filter((x) => x.slug !== p.slug && x.category !== p.category),
  ].slice(0, 4)

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    image: p.images,
    description: p.description,
    sku: p.id,
    ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    offers: {
      '@type': 'Offer',
      price: p.price,
      priceCurrency: 'COP',
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }
  const specs = Object.entries(p.specs)

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-10 pb-28 lg:px-8 lg:pb-10">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={p.images} name={p.name}>
            <FavoriteButton productId={p.id} productName={p.name} className="absolute right-4 top-4 z-10" />
          </ProductGallery>
          <div className="flex flex-col justify-center">
            <nav aria-label="Ruta de navegación" className="flex flex-wrap items-center gap-1.5 text-xs text-[#5B6478]"><Link href="/productos" className="hover:text-[#2F5BFF]">Catálogo</Link><span aria-hidden="true">/</span><Link href={`/productos?categoria=${encodeURIComponent(p.category)}`} className="hover:text-[#2F5BFF]">{p.category}</Link><span aria-hidden="true">/</span><span>{p.subcategory}</span></nav>
            <h1 className="mt-3 text-4xl">{p.name}</h1>
            {p.brand && <p className="mt-2 text-sm font-semibold text-[#2F5BFF]">{p.brand}</p>}
            <div className="mt-6 flex items-end gap-3">
              <strong className="text-4xl tabular-nums">{formatCOP(p.price)}</strong>
              {isOnSale(p) && (
                <>
                  <del className="text-[#5B6478]">{formatCOP(p.compareAtPrice!)}</del>
                  <span className="rounded-full bg-[#FFC92E] px-2 py-1 text-xs font-bold text-[#0E1A3A]">-{discount(p)}%</span>
                </>
              )}
            </div>
            {p.stock <= 0 ? (
              <p className="mt-4 text-sm font-semibold text-[#B42318]">Agotado por ahora</p>
            ) : p.stock <= 10 ? (
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0E1A3A]"><span aria-hidden="true" className="size-2 rounded-full bg-[#FFC92E] ring-4 ring-[#FFC92E]/25" />Quedan {p.stock} unidades</p>
            ) : null}
            <p className="mt-4 text-sm leading-relaxed text-[#5B6478]">{p.description}</p>
            {specs.length > 0 && (
              <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {specs.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-[#5B6478]">{label}</dt>
                    <dd className="font-semibold text-[#0E1A3A]">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <ProductActions product={p} />
            <div className="mt-6">
              <DeliveryEstimate />
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-xs text-[#5B6478]">
              {([[Truck, `Envío gratis desde ${formatCOP(FREE_SHIPPING_FROM)}`], [CreditCard, 'Pago contra entrega'], [ShieldCheck, 'Retracto de 5 días hábiles'], [MessageCircle, 'Soporte por WhatsApp']] as const).map(([Icon, text]) => (
                <li key={text} className="flex items-center gap-3 rounded-xl border border-[#DDE2EE] bg-white p-3">
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#0E1A3A] text-[#FFC92E]"><Icon className="size-4" /></span>
                  <span className="font-semibold text-[#0E1A3A]">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {related.length > 0 && (
          <section className="mt-16">
            <h2>También te puede interesar</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {related.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}
      </main>
      <WhatsApp product={p} />
    </>
  )
}
