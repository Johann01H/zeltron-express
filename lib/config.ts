/**
 * Configuración central de la tienda.
 * Todo lo que hoy está fijo aquí debería venir más adelante de los ajustes del
 * plugin de WordPress (zeltron-core) vía WPGraphQL.
 */
export const COMPANY_NAME = 'ZELTRON S.A.S.'
export const STORE_NAME = 'ZELTRON Express'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zeltronexpress.com'

export const WHATSAPP_NUMBER = '573025931994'
export const WHATSAPP_DISPLAY = '+57 302 593 1994'
export const whatsappLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`

export const INSTAGRAM_URL = 'https://instagram.com/zeltronsas'
export const FACEBOOK_URL = 'https://facebook.com/zeltronsasoficial'

/** Envíos (COP). */
export const FREE_SHIPPING_FROM = 150_000
export const SHIPPING_FEE = 12_000
export const shippingFor = (subtotal: number) =>
  subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE

/** Fin de la campaña de ofertas. `null` oculta la cuenta regresiva. */
export const OFFER_ENDS_AT: string | null = '2026-12-31T23:59:59-05:00'
