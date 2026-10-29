import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import type { Category, Product } from './types'
import { fetchCatalog, isWordPressConfigured } from './wordpress'
import { seedCategories, seedProducts } from './data/seed'

/** Etiqueta de caché que invalida el plugin al guardar productos (ver /api/revalidate). */
export const CATALOG_TAG = 'catalog'

async function loadCatalog(): Promise<{ products: Product[]; categories: Category[] }> {
  'use cache'
  cacheTag(CATALOG_TAG)
  cacheLife('hours')

  if (!isWordPressConfigured()) {
    return { products: seedProducts, categories: seedCategories }
  }
  return fetchCatalog()
}

export async function getProducts() {
  return (await loadCatalog()).products
}

export async function getCategories() {
  return (await loadCatalog()).categories
}

export async function getProduct(slug: string) {
  return (await getProducts()).find((product) => product.slug === slug) ?? null
}
