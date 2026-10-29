'use client'

import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import { ProductCard } from '@/components/storefront'
import type { Product } from '@/lib/types'
import { useHydrated } from '@/lib/use-hydrated'
import { useFavorites } from '@/store/favorites'

export function FavoritesContent({ products }: { products: Product[] }) {
  const hydrated = useHydrated()
  const favoriteIds = useFavorites((state) => state.ids)
  const favoriteProducts = products.filter((product) => favoriteIds.includes(product.id))

  return (
    <section aria-labelledby="favorites-list-title">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#2F5BFF]">Tu selección</p>
          <h2 id="favorites-list-title" className="mt-1 text-2xl font-extrabold tracking-[-.05em] text-[#0E1A3A]">
            Guardados para después
          </h2>
        </div>
        <p aria-live="polite" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#5B6478] ring-1 ring-[#DCE1EC]">
          {favoriteProducts.length} {favoriteProducts.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {!hydrated ? (
        <div className="h-64 animate-pulse rounded-3xl border border-[#DCE1EC] bg-white" aria-busy="true" />
      ) : favoriteProducts.length > 0 ? (
        <div className="favorites-grid">
          {favoriteProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-[#D3D9E6] bg-white px-6 py-16 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-[#EAF0FF] text-[#2F5BFF]">
            <Heart aria-hidden="true" className="size-7" />
          </span>
          <h3 className="mt-5 text-xl font-extrabold tracking-[-.04em] text-[#0E1A3A]">Todavía no guardas favoritos</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#6B6E78]">
            Toca el corazón de cualquier producto y lo encontrarás aquí cuando quieras volver.
          </p>
          <Link href="/productos" className="btn-primary mt-6">
            Explorar productos <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      )}
    </section>
  )
}
