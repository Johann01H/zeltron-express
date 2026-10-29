import 'server-only'

/**
 * Punto de integración de cuentas de cliente.
 * Las cuentas vivirán en WordPress (usuarios con rol "customer"); el plugin
 * zeltron-core expondrá login/registro vía WPGraphQL y Next.js guardará la
 * sesión en una cookie httpOnly. Mientras eso no exista, no hay sesión.
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
  name: string
  email: string
  phone: string
  memberSince: string
  addresses: CustomerAddress[]
  orders: CustomerOrderSummary[]
}

/** Cookie httpOnly donde se guardará el token de sesión emitido por WordPress. */
export const SESSION_COOKIE = 'zx_session'

export async function getCurrentCustomer(): Promise<Customer | null> {
  // TODO(zeltron-core): leer la cookie de sesión y consultar `viewer` en WPGraphQL.
  return null
}

export const ACCOUNTS_ENABLED = false
