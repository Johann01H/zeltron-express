import 'server-only'
import type { Category, Product } from './types'

/**
 * Cliente WPGraphQL para el backend headless (admin.zeltronexpress.com).
 *
 * Contrato: los campos `zeltronProducts`, `zeltronCategories` y la mutación
 * `zeltronCreateOrder` los registra el plugin propio `zeltron-core`.
 * Así el frontend no depende de la forma interna de WooCommerce y nunca recibe
 * datos privados (proveedor, costo, margen).
 */
const GRAPHQL_URL = process.env.WORDPRESS_GRAPHQL_URL
const API_SECRET = process.env.ZELTRON_API_SECRET

export const isWordPressConfigured = () => Boolean(GRAPHQL_URL)

type GraphQLResponse<T> = { data?: T; errors?: { message: string }[] }

export async function wpQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  options: { authenticated?: boolean } = {},
): Promise<T> {
  if (!GRAPHQL_URL) throw new Error('WORDPRESS_GRAPHQL_URL no está configurada')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (options.authenticated) {
    if (!API_SECRET) throw new Error('ZELTRON_API_SECRET no está configurada')
    headers['X-Zeltron-Secret'] = API_SECRET
  }

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    // Típico de hostings gratuitos que responden con un reto JavaScript en vez de JSON.
    throw new Error(`WordPress respondió ${response.status} sin JSON (${contentType || 'sin content-type'})`)
  }

  const json = (await response.json()) as GraphQLResponse<T>
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '))
  if (!json.data) throw new Error('Respuesta de WPGraphQL sin datos')
  return json.data
}

const PRODUCT_FIELDS = /* GraphQL */ `
  id
  slug
  name
  category
  subcategory
  brand
  description
  price
  compareAtPrice
  images
  variants
  specs { label value }
  stock
  isBestSeller
  freeShipping
`

type WpProduct = Omit<Product, 'specs'> & { specs: { label: string; value: string }[] | null }

const toProduct = (p: WpProduct): Product => ({
  ...p,
  brand: p.brand || null,
  compareAtPrice: p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : null,
  images: p.images?.length ? p.images : ['/placeholder.svg'],
  variants: p.variants?.length ? p.variants : ['Única'],
  specs: Object.fromEntries((p.specs ?? []).map((s) => [s.label, s.value])),
})

export async function fetchCatalog(): Promise<{ products: Product[]; categories: Category[] }> {
  const data = await wpQuery<{ zeltronProducts: WpProduct[]; zeltronCategories: Category[] }>(/* GraphQL */ `
    query ZeltronCatalog {
      zeltronProducts { ${PRODUCT_FIELDS} }
      zeltronCategories { name subcategories }
    }
  `)
  return { products: data.zeltronProducts.map(toProduct), categories: data.zeltronCategories }
}

export type CreateOrderInput = {
  reference: string
  customer: {
    name: string
    phone: string
    email: string
    department: string
    city: string
    neighborhood: string
    address: string
    notes: string
    consent: boolean
    zone: 'express' | 'national'
  }
  items: { productId: string; variant: string; quantity: number }[]
}

export async function createWordPressOrder(input: CreateOrderInput) {
  const data = await wpQuery<{ zeltronCreateOrder: { orderNumber: string; status: string } }>(
    /* GraphQL */ `
      mutation ZeltronCreateOrder($input: ZeltronCreateOrderInput!) {
        zeltronCreateOrder(input: $input) { orderNumber status }
      }
    `,
    { input },
    { authenticated: true },
  )
  return data.zeltronCreateOrder
}
