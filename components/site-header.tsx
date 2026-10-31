import { getCategories } from '@/lib/catalog'
import { getCurrentCustomer } from '@/lib/auth'
import { Header } from '@/components/storefront'

/** Header con la sesión del cliente (lee la cookie: se renderiza en cada petición, dentro de <Suspense>). */
export async function SiteHeader() {
  const [categories, customer] = await Promise.all([getCategories(), getCurrentCustomer()])
  const account = customer ? { name: customer.name, email: customer.email, avatarUrl: customer.avatarUrl } : null
  return <Header categories={categories} account={account} />
}

/** Versión sin sesión para el shell estático mientras llega la real. */
export async function SiteHeaderShell() {
  const categories = await getCategories()
  return <Header categories={categories} account={null} />
}
