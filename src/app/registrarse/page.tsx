import type { Metadata } from 'next'
import { AccountForm } from '@/components/account-form'
import { getProducts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Crear cuenta | ZELTRON Express',
  description: 'Crea tu cuenta en ZELTRON Express y sigue tus pedidos.',
  robots: { index: false },
}

export default async function Page() {
  const products = await getProducts()
  const showcase = products.filter((p) => p.stock > 0 && p.isBestSeller).slice(0, 3)
  return <AccountForm mode="sign-up" showcase={showcase} />
}
