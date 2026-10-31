import { getCategories, getProducts } from '@/lib/catalog'
import { getCurrentCustomer } from '@/lib/auth'
import { toSearchItems } from '@/lib/search'
import { Header } from '@/components/storefront'
import { FavoritesSync } from '@/components/favorites-sync'

/** Header con la sesión del cliente (lee la cookie: se renderiza en cada petición, dentro de <Suspense>). */
export async function SiteHeader() {
  const [categories, products, customer] = await Promise.all([getCategories(), getProducts(), getCurrentCustomer()])
  const account = customer ? { name: customer.name, email: customer.email, avatarUrl: customer.avatarUrl } : null
  return (
    <>
      <Header categories={categories} account={account} searchItems={toSearchItems(products)} />
      {/* Con sesión, los favoritos del navegador y los de la cuenta se combinan y se mantienen sincronizados. */}
      {customer && <FavoritesSync accountId={customer.id} serverIds={customer.favorites} />}
    </>
  )
}

/** Versión sin sesión para el shell estático mientras llega la real. */
export async function SiteHeaderShell() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()])
  return <Header categories={categories} account={null} searchItems={toSearchItems(products)} />
}
