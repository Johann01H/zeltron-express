import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CATALOG_TAG, getProducts } from './catalog'
import { isOnSale, discount } from './format'
import type { Product } from './types'
import { isWordPressConfigured, wpQuery } from './wordpress'

export type BannerSize = 'large' | 'tall' | 'small' | 'wide'

export type Banner = {
  id: string
  title: string
  size: BannerSize
  imageUrl: string
  imageWidth: number | null
  imageHeight: number | null
  mobileImageUrl: string | null
  mobileWidth: number | null
  mobileHeight: number | null
  href: string | null
  productSlug: string | null
}

/** Bloque del inicio armado en WordPress (menú «Banners → Secciones»). */
export type BannerSection = {
  id: string
  title: string
  subtitle: string
  viewAllHref: string | null
  banners: Banner[]
  /** Productos debajo del mosaico: los de los banners y luego los de la categoría, con descuento primero. */
  products: Product[]
}

type WpSection = Omit<BannerSection, 'products'> & { category: string | null; subcategory: string | null }

const MAX_PRODUCTS = 10

async function loadSections(): Promise<WpSection[]> {
  'use cache'
  cacheTag(CATALOG_TAG)
  cacheLife('hours')
  if (!isWordPressConfigured()) return []
  try {
    const query = (fields: string) => wpQuery<{ zeltronBannerSections: WpSection[] }>(/* GraphQL */ `
      query BannerSections {
        zeltronBannerSections {
          id title subtitle category subcategory viewAllHref
          banners { id title size imageUrl mobileImageUrl href productSlug ${fields} }
        }
      }
    `)
    // Las medidas de las imágenes llegan desde la versión 1.7.1 del plugin; sin ellas se usan medidas típicas.
    const data = await query('imageWidth imageHeight mobileWidth mobileHeight').catch(() => query(''))
    return data.zeltronBannerSections
  } catch (error) {
    // Sin la versión 1.6 del plugin (o con WordPress caído) las secciones no aparecen.
    console.error('[banners] no se pudieron cargar:', error instanceof Error ? error.message : error)
    return []
  }
}

export async function getBannerSections(): Promise<BannerSection[]> {
  const [sections, catalog] = await Promise.all([loadSections(), getProducts()])
  const bySlug = new Map(catalog.map((p) => [p.slug, p]))

  return sections
    .filter((s) => s.banners.length > 0)
    .map(({ category, subcategory, ...section }) => {
      const linked = section.banners.flatMap((b) => (b.productSlug && bySlug.get(b.productSlug)) || [])
      const inCategory = category
        ? catalog
            .filter((p) => p.category === category && (!subcategory || p.subcategory === subcategory))
            .sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || Number(isOnSale(b)) - Number(isOnSale(a)) || discount(b) - discount(a))
        : []
      const products = [...new Map([...linked, ...inCategory].map((p) => [p.id, p])).values()].slice(0, MAX_PRODUCTS)
      return { ...section, products }
    })
}
