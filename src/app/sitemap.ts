import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/catalog'
import { SITE_URL } from '@/lib/config'

const pages = ['', 'productos', 'preguntas-frecuentes', 'envios', 'garantias-y-devoluciones', 'terminos', 'privacidad', 'contacto', 'rastrear']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts()
  return [
    ...pages.map((path) => ({ url: `${SITE_URL}/${path}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/producto/${p.slug}` })),
  ]
}
