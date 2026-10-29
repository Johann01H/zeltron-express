import { CartView } from '@/components/cart-view'
import { getProducts } from '@/lib/catalog'

export default async function CartPage() {
  return <CartView products={await getProducts()} />
}
