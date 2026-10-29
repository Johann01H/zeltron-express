import type { Metadata } from 'next'
import { AccountForm } from '@/components/account-form'
import { getProducts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Iniciar sesión | ZELTRON Express',
  description: 'Accede a tu cuenta de ZELTRON Express.',
  robots: { index: false },
}

export default async function Page() {
  const products = await getProducts()
  const showcase = products.filter((p) => p.stock > 0 && p.isBestSeller).slice(0, 3)
  return <AccountForm mode="sign-in" showcase={showcase} />
}
