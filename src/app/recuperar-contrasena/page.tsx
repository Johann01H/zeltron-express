import type { Metadata } from 'next'
import { AccountForm } from '@/components/account-form'
import { getProducts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Recuperar contraseña | ZELTRON Express',
  description: 'Recibe un enlace en tu correo para crear una nueva contraseña.',
  robots: { index: false },
}

export default async function Page() {
  const products = await getProducts()
  const showcase = products.filter((p) => p.stock > 0 && p.isBestSeller).slice(0, 3)
  return <AccountForm mode="forgot" showcase={showcase} />
}
