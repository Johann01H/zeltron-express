import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CATALOG_TAG } from './catalog'
import type { Product } from './types'
import { isWordPressConfigured, wpQuery } from './wordpress'

/** Diapositiva de la portada (menú «Portada» de WordPress). */
export type HeroSlide = {
  id: string
  pill: string
  title: string
  description: string
  primaryText: string
  primaryHref: string
  secondaryText: string
  secondaryHref: string
  card: 'product' | 'image' | 'none'
  cardLabel: string
  imageUrl: string | null
  imageWidth: number | null
  imageHeight: number | null
  imageHref: string | null
  /** `image`: la imagen ocupa toda la portada (sin texto ni tarjeta). */
  layout: 'text' | 'image'
  fullImageUrl: string | null
  fullWidth: number | null
  fullHeight: number | null
  fullMobileUrl: string | null
  fullMobileWidth: number | null
  fullMobileHeight: number | null
  fullHref: string | null
  product: Pick<Product, 'slug' | 'name' | 'price' | 'compareAtPrice' | 'images'> | null
}

type WpSlide = Omit<HeroSlide, 'product'> & { productSlug: string | null }

async function loadSlides(): Promise<WpSlide[]> {
  'use cache'
  cacheTag(CATALOG_TAG)
  cacheLife('hours')
  if (!isWordPressConfigured()) return []
  try {
    const query = (fields: string) => wpQuery<{ zeltronHeroSlides: WpSlide[] }>(/* GraphQL */ `
      query HeroSlides {
        zeltronHeroSlides {
          id pill title description primaryText primaryHref secondaryText secondaryHref
          card cardLabel productSlug imageUrl imageWidth imageHeight imageHref
          ${fields}
        }
      }
    `)
    // «Imagen completa» llega desde la versión 1.8.1 del plugin.
    const full = 'layout fullImageUrl fullWidth fullHeight fullMobileUrl fullMobileWidth fullMobileHeight fullHref'
    const data = await query(full).catch(() => query(''))
    return data.zeltronHeroSlides.map((s) => ({ ...EMPTY_FULL, ...s }))
  } catch (error) {
    // Sin la versión 1.8 del plugin se muestra la portada de siempre.
    console.error('[portada] no se pudo cargar:', error instanceof Error ? error.message : error)
    return []
  }
}

const EMPTY_FULL = {
  layout: 'text' as const,
  fullImageUrl: null,
  fullWidth: null,
  fullHeight: null,
  fullMobileUrl: null,
  fullMobileWidth: null,
  fullMobileHeight: null,
  fullHref: null,
}

/** La portada de siempre, por si no hay diapositivas en WordPress. */
const DEFAULT_SLIDE: Omit<HeroSlide, 'product'> = {
  id: 'default',
  pill: 'Pagas cuando recibes tu pedido',
  title: 'Tecnología que llega a tu puerta.',
  description: 'Audífonos, cargadores, relojes y accesorios con precios claros. Pides hoy, lo recibes en 3 a 7 días hábiles y pagas en efectivo al recibir.',
  primaryText: 'Ver ofertas',
  primaryHref: '/productos?oferta=true',
  secondaryText: 'Explorar catálogo',
  secondaryHref: '/productos',
  card: 'product',
  cardLabel: 'Destacado de la semana',
  imageUrl: null,
  imageWidth: null,
  imageHeight: null,
  imageHref: null,
  ...EMPTY_FULL,
}

/** `featured` es el producto automático (el más vendido) cuando la diapositiva no elige uno. */
export async function getHeroSlides(products: Product[], featured: Product | undefined): Promise<HeroSlide[]> {
  const slides = await loadSlides()
  const bySlug = new Map(products.map((p) => [p.slug, p]))
  const pick = (p: Product | undefined) => (p ? { slug: p.slug, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice, images: p.images } : null)
  if (slides.length === 0) return [{ ...DEFAULT_SLIDE, product: pick(featured) }]
  return slides.map(({ productSlug, ...slide }) => ({
    ...slide,
    product: slide.card === 'product' ? pick((productSlug && bySlug.get(productSlug)) || featured) : null,
  }))
}
