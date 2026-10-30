import type { Metadata } from 'next'
import { AccountForm } from '@/components/account-form'
import { getProducts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Nueva contraseña | ZELTRON Express',
  description: 'Crea una nueva contraseña para tu cuenta de ZELTRON Express.',
  robots: { index: false },
  // El enlace lleva la clave de recuperación: que no se filtre a otros sitios.
  referrer: 'no-referrer',
}

export default async function Page() {
  const products = await getProducts()
  const showcase = products.filter((p) => p.stock > 0 && p.isBestSeller).slice(0, 3)
  return <AccountForm mode="reset" showcase={showcase} />
}
