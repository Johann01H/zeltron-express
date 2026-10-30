import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
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
  street: string
  city: string
  phone: string
  notes: string
  isPrimary: boolean
}

export type CustomerOrderSummary = {
  number: string
  date: string
  itemCount: number
  total: number
  status: string
}

export type Customer = {
  id: string
  name: string
  email: string
  phone: string
  memberSince: string
  addresses: CustomerAddress[]
  orders: CustomerOrderSummary[]
}

/** Cookie httpOnly con el token de sesión emitido por WordPress. */
export const SESSION_COOKIE = 'zx_session'

export const ACCOUNTS_ENABLED = isWordPressConfigured()

export const CUSTOMER_FIELDS = /* GraphQL */ `
  id
  name
  email
  phone
  memberSince
  addresses { id label recipient street city phone notes isPrimary }
  orders { number date itemCount total status }
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
    console.error('[auth] No se pudo cargar la sesión:', error)
    return null
  }
})
