import { getCategories } from '@/lib/catalog'
import { getCurrentCustomer } from '@/lib/auth'
import { Header } from '@/components/storefront'

export async function SiteHeader() {
  const [categories, customer] = await Promise.all([getCategories(), getCurrentCustomer()])
  // Al conectar la sesión (cookie), este componente pasa a ser dinámico: ya está dentro de <Suspense> en el layout.
  const account = customer ? { name: customer.name, email: customer.email } : null
  return <Header categories={categories} account={account} />
}
