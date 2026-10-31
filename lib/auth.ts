import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'
import { isWordPressConfigured, wpQuery } from './wordpress'

/**
 * Cuentas de cliente.
 * Las cuentas viven en WordPress (clientes de WooCommerce). El plugin zeltron-core emite un
 * token de sesión aleatorio que guardamos en una cookie httpOnly; con él se consulta el perfil.
 * Todas las llamadas van servidor a servidor con X-Zeltron-Secret.
 */
export type CustomerAddress = {
  id: string
  label: string
  recipient: string
  phone: string
  department: string
  city: string
  neighborhood: string
  street: string
  notes: string
  isPrimary: boolean
}

export type OrderStep = 'recibido' | 'confirmacion' | 'despachado' | 'en-camino' | 'entregado' | 'cancelado'

export type CustomerOrderItem = {
  name: string
  variant: string
  quantity: number
  total: number
  image: string
  slug: string
}

export type CustomerOrderSummary = {
  number: string
  date: string
  itemCount: number
  total: number
  shipping: number
  status: string
  step: OrderStep
  address: string
  city: string
  carrier: string
  trackingNumber: string
  items: CustomerOrderItem[]
}

export type Customer = {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  phone: string
  avatarUrl: string
  memberSince: string
  orderCount: number
  totalSpent: number
  addresses: CustomerAddress[]
  orders: CustomerOrderSummary[]
}

/** Cookie httpOnly con el token de sesión emitido por WordPress. */
export const SESSION_COOKIE = 'zx_session'

export const ACCOUNTS_ENABLED = isWordPressConfigured()

export const CUSTOMER_FIELDS = /* GraphQL */ `
  id
  firstName
  lastName
  name
  email
  phone
  avatarUrl
  memberSince
  orderCount
  totalSpent
  addresses { id label recipient phone department city neighborhood street notes isPrimary }
  orders {
    number date itemCount total shipping status step address city carrier trackingNumber
    items { name variant quantity total image slug }
  }
`

export async function getSessionToken(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null
}

/** Cliente con sesión activa, o null. Se deduplica dentro de una misma petición. */
export const getCurrentCustomer = cache(async (): Promise<Customer | null> => {
  const token = await getSessionToken()
  if (!token || !ACCOUNTS_ENABLED) return null
  try {
    const data = await wpQuery<{ zeltronCustomer: Customer | null }>(
      `query Customer($token: String!) { zeltronCustomer(token: $token) { ${CUSTOMER_FIELDS} } }`,
      { token },
      { authenticated: true },
    )
    return data.zeltronCustomer
  } catch (error) {
    // Errores internos de Next.js (prerender, redirecciones) deben seguir su curso.
    unstable_rethrow(error)
    console.error('[auth] No se pudo cargar la sesión:', error)
    return null
  }
})
