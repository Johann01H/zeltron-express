import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CATALOG_TAG, getProducts } from './catalog'
import { isWordPressConfigured, wpQuery } from './wordpress'

/** Video corto demostrativo (menú «Shorts» del panel de WordPress). */
export type Short = {
  id: string
  title: string
  caption: string
  /** MP4/WebM directo. `null` si el short es de YouTube. */
  videoUrl: string | null
  youtubeId: string | null
  posterUrl: string | null
  product: {
    slug: string
    name: string
    price: number
    compareAtPrice: number | null
    image: string
    inStock: boolean
  } | null
}

type WpShort = Omit<Short, 'product'> & { productSlug: string | null }

async function loadShorts(): Promise<WpShort[]> {
  'use cache'
  // Misma etiqueta que el catálogo: publicar un short en WordPress actualiza la tienda.
  cacheTag(CATALOG_TAG)
  cacheLife('hours')
  if (!isWordPressConfigured()) return []
  try {
    const data = await wpQuery<{ zeltronShorts: WpShort[] }>(/* GraphQL */ `
      query Shorts {
        zeltronShorts(first: 40) { id title caption videoUrl youtubeId posterUrl productSlug }
      }
    `)
    return data.zeltronShorts
  } catch (error) {
    // Sin la versión 1.5 del plugin (o con WordPress caído) la sección simplemente no aparece.
    console.error('[shorts] no se pudieron cargar:', error instanceof Error ? error.message : error)
    return []
  }
}

export async function getShorts(): Promise<Short[]> {
  const [shorts, products] = await Promise.all([loadShorts(), getProducts()])
  const bySlug = new Map(products.map((p) => [p.slug, p]))
  return shorts.map(({ productSlug, ...short }) => {
    const p = productSlug ? bySlug.get(productSlug) : undefined
    return {
      ...short,
      product: p
        ? { slug: p.slug, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice, image: p.images[0], inStock: p.stock > 0 }
        : null,
    }
  })
}

export async function getShortsForProduct(slug: string) {
  return (await getShorts()).filter((s) => s.product?.slug === slug)
}
