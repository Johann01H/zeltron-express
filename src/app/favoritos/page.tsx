import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import { FavoritesContent } from '@/components/favorites-content'
import { WhatsApp } from '@/components/storefront'
import { getProducts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Favoritos | ZELTRON Express',
  description: 'Revisa los productos que guardaste en tu lista de favoritos de ZELTRON Express.',
}

export default async function FavoritesPage() {
  const products = await getProducts()
  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-14">
        <nav aria-label="Ruta de navegación" className="mb-7 flex items-center gap-2 text-xs text-[#737681]">
          <Link href="/" className="transition hover:text-[#2F5BFF]">Inicio</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Favoritos</span>
        </nav>

        <section className="flex flex-col justify-between gap-6 rounded-[1.75rem] border border-[#DCE1EC] bg-white p-6 shadow-[0_16px_50px_rgba(14,26,58,.06)] sm:flex-row sm:items-end sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#EAF0FF] text-[#2F5BFF]">
              <Heart aria-hidden="true" className="size-5 fill-current" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2F5BFF]">Tu lista personal</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-[-.06em] text-[#0E1A3A] sm:text-4xl">Tus favoritos</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#656A76]">Se guardan en este navegador para que vuelvas a ellos cuando quieras.</p>
            </div>
          </div>
          <Link href="/productos" className="btn-secondary shrink-0">
            Seguir explorando <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </section>

        <div className="mt-10">
          <FavoritesContent products={products} />
        </div>
      </main>
      <WhatsApp />
    </>
  )
}
