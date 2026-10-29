/**
 * Tipos públicos del catálogo. Lo que está aquí puede llegar al navegador,
 * por eso NO incluye proveedor ni costo de proveedor: esos datos viven solo
 * en WordPress (admin.zeltronexpress.com).
 */
export type Product = {
  id: string
  slug: string
  name: string
  category: string
  subcategory: string
  brand: string | null
  description: string
  price: number
  /** Precio "antes". `null` cuando el producto no está en oferta. */
  compareAtPrice: number | null
  images: string[]
  variants: string[]
  specs: Record<string, string>
  stock: number
  isBestSeller: boolean
  freeShipping: boolean
}

export type Category = {
  name: string
  subcategories: string[]
}

export type CartItem = Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'images'> & {
  quantity: number
  selectedVariant: string
}
