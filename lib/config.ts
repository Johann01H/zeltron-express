/**
 * Configuración central de la tienda.
 * Todo lo que hoy está fijo aquí debería venir más adelante de los ajustes del
 * plugin de WordPress (zeltron-core) vía WPGraphQL.
 */
export const COMPANY_NAME = 'ZELTRON S.A.S.'
export const STORE_NAME = 'ZELTRON Express'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://zeltronexpress.com'

/** Número al que llevan los botones de WhatsApp de la tienda (el del bot, si lo tienes). Solo dígitos con indicativo. */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '573025931994').replace(/\D/g, '')
export const WHATSAPP_DISPLAY = `+${WHATSAPP_NUMBER.slice(0, 2)} ${WHATSAPP_NUMBER.slice(2, 5)} ${WHATSAPP_NUMBER.slice(5, 8)} ${WHATSAPP_NUMBER.slice(8)}`
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
