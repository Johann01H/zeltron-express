'use server'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { getProducts } from '@/lib/catalog'
import { shippingFor } from '@/lib/config'
import { zoneFor } from '@/lib/shipping'
import { createWordPressOrder, isWordPressConfigured } from '@/lib/wordpress'
import type { PlacedOrder } from '@/store/orders'

const schema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, 'Escribe tu nombre completo'),
    phone: z.string().trim().regex(/^[0-9+\s-]{7,20}$/, 'Revisa el número de celular'),
    email: z.union([z.literal(''), z.email('Correo no válido')]),
    department: z.string().trim().min(2, 'Elige el departamento'),
    city: z.string().trim().min(2, 'Indica la ciudad o municipio'),
    neighborhood: z.string().trim().min(2, 'Indica el barrio'),
    address: z.string().trim().min(5, 'Escribe la dirección completa'),
    notes: z.string().trim().max(300),
    consent: z.boolean().refine(Boolean, 'Debes autorizar el tratamiento de tus datos para enviar el pedido'),
  }),
  items: z
    .array(z.object({ productId: z.string(), variant: z.string(), quantity: z.number().int().min(1).max(20) }))
    .min(1, 'Tu carrito está vacío'),
})

export type CheckoutInput = z.input<typeof schema>
export type CheckoutResult = { ok: true; order: PlacedOrder } | { ok: false; error: string }

const makeReference = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `ZX-${date}-${randomBytes(3).toString('hex').toUpperCase()}`
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Revisa los datos del pedido.' }
  const { customer, items } = parsed.data

  // Los precios se recalculan en el servidor: nunca se confía en lo que envía el navegador.
  const catalog = new Map((await getProducts()).map((p) => [p.id, p]))
  const lines = []
  for (const item of items) {
    const product = catalog.get(item.productId)
    if (!product) return { ok: false, error: 'Uno de los productos ya no está disponible. Actualiza tu carrito.' }
    if (product.stock < item.quantity) return { ok: false, error: `No hay suficientes unidades de ${product.name}.` }
    lines.push({ name: product.name, price: product.price, quantity: item.quantity, selectedVariant: item.variant })
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const shipping = shippingFor(subtotal)
  const reference = makeReference()
  const zone = zoneFor(customer.city, customer.department)
  let orderNumber = reference
  let registered = false

  if (isWordPressConfigured()) {
    try {
      const created = await createWordPressOrder({ reference, customer: { ...customer, zone: zone.id }, items })
      orderNumber = created.orderNumber
      registered = true
    } catch (error) {
      console.error('[checkout] No se pudo registrar el pedido en WordPress', error)
      // Seguimos: el cliente puede confirmar por WhatsApp con la referencia.
    }
  }

  return {
    ok: true,
    order: {
      reference,
      orderNumber,
      registered,
      customer: {
        name: customer.name,
        phone: customer.phone,
        city: `${customer.city}, ${customer.department}`,
        address: `${customer.address}, barrio ${customer.neighborhood}`,
      },
      zone: zone.id,
      items: lines,
      subtotal,
      shipping,
      total: subtotal + shipping,
      createdAt: new Date().toISOString(),
    },
  }
}
