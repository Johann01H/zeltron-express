import type { Metadata } from 'next'
import { Suspense } from 'react'
import { WhatsApp } from '@/components/storefront'
import { ProductCatalog } from '@/components/product-catalog'
import { getCategories, getProducts } from '@/lib/catalog'
import { CatalogSkeleton } from '@/components/skeletons'

export const metadata: Metadata = {
  title: 'Productos | ZELTRON Express',
  description: 'Explora y filtra nuestro catálogo de tecnología por categoría, precio, marca y beneficios de envío.',
}

type ProductsSearchParams = {
  categoria?: string | string[]
  subcategoria?: string | string[]
  q?: string | string[]
  oferta?: string | string[]
}

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

async function Catalog({ searchParams }: { searchParams: Promise<ProductsSearchParams> }) {
  const [params, products, categories] = await Promise.all([searchParams, getProducts(), getCategories()])
  const initialCategory = firstValue(params.categoria)
  const initialSubcategory = firstValue(params.subcategoria)
  const initialQuery = firstValue(params.q)
  const initialSaleOnly = firstValue(params.oferta) === 'true'
  const catalogKey = [initialCategory, initialSubcategory, initialQuery, initialSaleOnly].join('|')

  return (
    <ProductCatalog
      key={catalogKey}
      products={products}
      categories={categories}
      initialCategory={initialCategory}
      initialSubcategory={initialSubcategory}
      initialQuery={initialQuery}
      initialSaleOnly={initialSaleOnly}
    />
  )
}

export default function ProductsPage({ searchParams }: PageProps<'/productos'>) {
  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Suspense fallback={<CatalogSkeleton />}>
          <Catalog searchParams={searchParams as Promise<ProductsSearchParams>} />
        </Suspense>
      </main>
      <WhatsApp />
    </>
  )
}
