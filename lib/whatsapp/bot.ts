import 'server-only'
import { getProducts } from '@/lib/catalog'
import { FREE_SHIPPING_FROM, SHIPPING_FEE, SITE_URL, STORE_NAME, WHATSAPP_NUMBER } from '@/lib/config'
import { discount, formatCOP, isOnSale } from '@/lib/format'
import { normalize, searchItems } from '@/lib/search'
import { EXPRESS_CITIES, ZONES } from '@/lib/shipping'
import type { Product } from '@/lib/types'
import { lookupOrder, type OrderStatus } from '@/lib/wordpress'
import { clip, markRead, sendButtons, sendLink, sendList, sendText, type ListRow } from './graph'
import { emptyState, loadState, saveState, type BotState } from './state'

/** Mensaje entrante ya simplificado desde el webhook. */
export type Incoming = {
  id: string
  from: string // número del cliente, ej. 573001234567
  name: string
  text?: string // texto escrito
  reply?: string // id del botón o fila elegida
  kind: string // text | interactive | button | image | audio | …
}

const HUMAN_PAUSE_MS = 12 * 60 * 60 * 1000
/** Número de los asesores. Si es el mismo del bot (coexistencia), el bot se pausa y responden por el mismo chat. */
const ADVISOR_NUMBER = (process.env.WHATSAPP_ADVISOR_NUMBER ?? WHATSAPP_NUMBER).replace(/\D/g, '')
const SAME_NUMBER_ADVISOR = ADVISOR_NUMBER === WHATSAPP_NUMBER.replace(/\D/g, '')

const ORDER_RE = /ZX-?\d{8}-?[A-Z0-9]{6}/i
const GREETINGS = ['hola', 'holi', 'ola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'menu', 'inicio', 'empezar', 'hey', 'saludos', 'info', 'informacion']

const menuRows: ListRow[] = [
  { id: 'm_buscar', title: '🔎 Buscar un producto', description: 'Celulares, audífonos, portátiles, TV…' },
  { id: 'm_ofertas', title: '🔥 Ofertas', description: 'Los descuentos de hoy' },
  { id: 'm_pedido', title: '📦 Rastrear mi pedido', description: 'Con tu número de pedido ZX-…' },
  { id: 'm_envios', title: '🚚 Envíos y pagos', description: 'Tiempos, costo y pago contra entrega' },
  { id: 'm_garantia', title: '🛡️ Garantías y cambios', description: 'Devoluciones y garantía' },
  { id: 'm_asesor', title: '🙋 Hablar con un asesor', description: 'Te atiende una persona' },
]

const productUrl = (p: Product) => `${SITE_URL}/producto/${p.slug}`
const firstName = (name: string) => name.trim().split(/\s+/)[0] || ''

function orderReference(text: string) {
  const match = text.match(ORDER_RE)?.[0].toUpperCase().replace(/[^A-Z0-9]/g, '')
  return match ? `ZX-${match.slice(2, 10)}-${match.slice(10, 16)}` : null
}

/* ----------------------------------------------------------------------------
 * Respuestas
 * ------------------------------------------------------------------------- */

async function sendMenu(to: string, intro: string) {
  await sendList(to, intro, 'Ver opciones', [{ title: 'Elige una opción', rows: menuRows }])
}

async function sendWelcome(to: string, name: string) {
  const hello = firstName(name) ? `¡Hola, ${firstName(name)}! 👋` : '¡Hola! 👋'
  await sendMenu(
    to,
    `${hello} Bienvenido a *${STORE_NAME}*.\n\nTecnología con envío a toda Colombia y *pago contra entrega*. Soy el asistente virtual y te ayudo al instante. ¿Qué necesitas?`,
  )
}

async function sendProductList(to: string, intro: string, products: Product[]) {
  const rows = products.slice(0, 10).map((p) => {
    const price = `${formatCOP(p.price)}${isOnSale(p) ? ` · -${discount(p)}%` : ''}${p.stock > 0 ? '' : ' · Agotado'}`
    // Si el nombre no cabe en el título (24 letras), va completo en la descripción.
    return { id: `p_${p.id}`, title: p.name, description: p.name.length > 24 ? `${p.name} · ${price}` : price }
  })
  await sendList(to, intro, 'Ver productos', [{ title: 'Resultados', rows }])
}

async function sendProductCard(to: string, p: Product) {
  const lines = [
    `*${p.name}*`,
    isOnSale(p) ? `~${formatCOP(p.compareAtPrice!)}~  *${formatCOP(p.price)}*  (-${discount(p)}%)` : `*${formatCOP(p.price)}*`,
    p.variants.length > 1 ? `Opciones: ${p.variants.join(', ')}` : '',
    p.stock > 0 ? '✅ Disponible' : '⏳ Agotado por ahora',
    p.freeShipping || p.price >= FREE_SHIPPING_FROM ? '🚚 Envío gratis' : `🚚 Envío ${formatCOP(SHIPPING_FEE)}`,
    '💵 Pagas al recibir',
    '',
    clip(p.description.replace(/\s+/g, ' '), 300),
  ].filter((line, i, all) => line !== '' || (i > 0 && all[i - 1] !== ''))
  await sendButtons(
    to,
    lines.join('\n'),
    [
      { id: `buy_${p.id}`, title: p.stock > 0 ? 'Lo quiero' : 'Avísame' },
      { id: 'more', title: 'Ver más opciones' },
      { id: 'm_asesor', title: 'Hablar con asesor' },
    ],
    p.images[0] && !p.images[0].startsWith('/') ? { image: p.images[0] } : undefined,
  )
}

async function sendSearch(to: string, query: string, state: BotState, products: Product[]) {
  const results = searchItems(products, query, 10)
  state.lastQuery = query
  state.step = 'idle'
  if (results.length === 0) {
    await sendButtons(
      to,
      `No encontré productos para «${clip(query, 40)}» 😕\n\nPrueba con otra palabra o la marca (por ejemplo: *audífonos*, *celular samsung*, *portátil*), o pregúntale a un asesor.`,
      [
        { id: 'm_buscar', title: 'Buscar otra cosa' },
        { id: 'm_asesor', title: 'Hablar con asesor' },
        { id: 'menu', title: 'Menú' },
      ],
    )
    return
  }
  if (results.length === 1) return sendProductCard(to, results[0])
  const total = searchItems(products, query).length
  await sendProductList(
    to,
    `Encontré ${total} ${total === 1 ? 'producto' : 'productos'} para «${clip(query, 40)}»${total > 10 ? ' (te muestro los 10 más relevantes)' : ''}. Elige uno para ver precio y detalles 👇\n\nTodo el catálogo: ${SITE_URL}/productos?q=${encodeURIComponent(query)}`,
    results,
  )
}

async function sendDeals(to: string, products: Product[]) {
  const deals = products.filter((p) => isOnSale(p) && p.stock > 0).sort((a, b) => discount(b) - discount(a))
  if (deals.length) return sendProductList(to, `🔥 *Ofertas de hoy* (${deals.length}). Elige una para ver detalles:`, deals)
  const best = products.filter((p) => p.isBestSeller && p.stock > 0)
  return sendProductList(to, 'Hoy no hay ofertas activas, pero estos son los más vendidos ⭐', best.length ? best : products.filter((p) => p.stock > 0))
}

const STEP_TEXT: Record<OrderStatus['step'], string> = {
  recibido: '📥 Recibimos tu pedido.',
  confirmacion: '📞 Por confirmar: te escribimos para confirmarlo antes de despacharlo.',
  despachado: '📦 Despachado: ya salió de nuestra bodega.',
  'en-camino': '🚚 En camino a tu dirección.',
  entregado: '✅ Entregado. ¡Gracias por tu compra!',
  cancelado: '❌ Cancelado.',
}

async function sendOrder(to: string, order: OrderStatus) {
  const lines = [
    `*Pedido ${order.orderNumber}*`,
    STEP_TEXT[order.step] ?? order.statusLabel,
    `Estado: ${order.statusLabel}`,
    `Total: ${formatCOP(order.total)} (pagas al recibir)`,
    order.carrier ? `Transportadora: ${order.carrier}` : '',
    order.trackingNumber ? `Guía: ${order.trackingNumber}` : '',
  ].filter(Boolean)
  await sendButtons(to, lines.join('\n'), [
    { id: 'm_pedido', title: 'Otro pedido' },
    { id: 'm_asesor', title: 'Hablar con asesor' },
    { id: 'menu', title: 'Menú' },
  ])
}

async function trackOrder(to: string, reference: string, phone: string, state: BotState) {
  const order = await lookupOrder(reference, phone)
  if (order) {
    state.step = 'idle'
    state.pendingOrder = undefined
    return sendOrder(to, order)
  }
  if (state.step !== 'track-phone' && phone === to) {
    // El pedido pudo hacerse con otro celular: lo pedimos una vez.
    state.step = 'track-phone'
    state.pendingOrder = reference
    return sendText(to, `No encontré el pedido *${reference}* con este número de WhatsApp.\n\nEscríbeme el *celular* con el que hiciste el pedido (solo números).`)
  }
  state.step = 'idle'
  state.pendingOrder = undefined
  await sendButtons(to, `No encontré un pedido *${reference}* con ese celular. Revisa el número del pedido (llega en la confirmación) o habla con un asesor.`, [
    { id: 'm_pedido', title: 'Intentar de nuevo' },
    { id: 'm_asesor', title: 'Hablar con asesor' },
  ])
}

async function sendShipping(to: string) {
  const express = ZONES.express
  const national = ZONES.national
  await sendButtons(
    to,
    [
      '*Envíos y pagos* 🚚',
      `• ${EXPRESS_CITIES.join(', ')}: ${express.minDays} a ${express.maxDays} días hábiles.`,
      `• Resto de Colombia: ${national.minDays} a ${national.maxDays} días hábiles.`,
      `• Envío *gratis* desde ${formatCOP(FREE_SHIPPING_FROM)}; si no, ${formatCOP(SHIPPING_FEE)}.`,
      '• Pedidos antes de las 2:00 p. m. salen el mismo día hábil.',
      '',
      '💵 *Pago contra entrega*: pagas en efectivo al recibir. Antes de despachar te escribimos para confirmar.',
      '',
      `Más información: ${SITE_URL}/envios`,
    ].join('\n'),
    [
      { id: 'm_buscar', title: 'Buscar producto' },
      { id: 'm_asesor', title: 'Hablar con asesor' },
      { id: 'menu', title: 'Menú' },
    ],
  )
}

async function sendWarranty(to: string) {
  await sendButtons(
    to,
    [
      '*Garantías y cambios* 🛡️',
      '• Tienes *5 días hábiles* de retracto desde que recibes.',
      '• Todos los productos tienen garantía según el fabricante.',
      '• Para un cambio o garantía, escríbele a un asesor con tu número de pedido.',
      '',
      `Política completa: ${SITE_URL}/garantias-y-devoluciones`,
    ].join('\n'),
    [
      { id: 'm_asesor', title: 'Hablar con asesor' },
      { id: 'm_pedido', title: 'Rastrear pedido' },
      { id: 'menu', title: 'Menú' },
    ],
  )
}

async function handOff(to: string, name: string, state: BotState, context?: string) {
  if (SAME_NUMBER_ADVISOR) {
    // Coexistencia: el asesor responde desde la app en este mismo chat; el bot se calla 12 horas.
    state.pausedUntil = Date.now() + HUMAN_PAUSE_MS
    state.step = 'idle'
    await sendText(
      to,
      `Listo${firstName(name) ? `, ${firstName(name)}` : ''} 🙌 Un asesor te responde por aquí en breve (lunes a sábado).\n\nSi quieres volver al menú automático, escribe *menú*.`,
    )
    return
  }
  const summary = `Hola, soy ${name || 'cliente'} (${to}). Vengo del asistente de ZELTRON.${context ? ` ${context}` : ''}`
  await sendLink(to, 'Un asesor te atiende por WhatsApp. Toca el botón para escribirle; ya le dejamos el contexto 👇', 'Hablar con asesor', `https://wa.me/${ADVISOR_NUMBER}?text=${encodeURIComponent(summary)}`)
}

/* ----------------------------------------------------------------------------
 * Enrutador
 * ------------------------------------------------------------------------- */

export async function handleIncoming(msg: Incoming) {
  const state = (await loadState(msg.from)) ?? emptyState()
  if (state.seen.includes(msg.id)) return // reintento de Meta
  state.seen.push(msg.id)

  const isNew = !state.greetedAt || Date.now() - state.greetedAt > 24 * 60 * 60 * 1000
  const raw = (msg.text ?? '').trim()
  const text = normalize(raw)
  const wantsMenu = msg.reply === 'menu' || GREETINGS.includes(text) || text === 'menu'

  // Atiende una persona: el bot no interrumpe, salvo que el cliente pida el menú.
  if (state.pausedUntil && state.pausedUntil > Date.now()) {
    const resume = msg.reply === 'menu' || ['menu', 'inicio', 'bot', 'asistente'].includes(text)
    if (!resume) return saveState(msg.from, state)
    state.pausedUntil = undefined
  }

  await markRead(msg.id).catch(() => undefined)
  const products = await getProducts()

  try {
    // 1. Botones y filas
    if (msg.reply) {
      const id = msg.reply
      if (id === 'menu') await sendMenu(msg.from, '¿En qué más te ayudo?')
      else if (id === 'm_buscar') {
        state.step = 'search'
        await sendText(msg.from, '¿Qué producto buscas? Escríbelo con tus palabras 🔎\n\nEjemplos: *audífonos inalámbricos*, *celular samsung*, *parlante jbl*, *portátil*.')
      } else if (id === 'm_ofertas') await sendDeals(msg.from, products)
      else if (id === 'm_pedido') {
        state.step = 'track-number'
        await sendText(msg.from, 'Escríbeme tu *número de pedido* 📦 (empieza por ZX-, por ejemplo ZX-20261030-A1B2C3).\n\nLo encuentras en la confirmación de tu compra.')
      } else if (id === 'm_envios') await sendShipping(msg.from)
      else if (id === 'm_garantia') await sendWarranty(msg.from)
      else if (id === 'm_asesor') await handOff(msg.from, msg.name, state, state.lastQuery ? `Estaba buscando: ${state.lastQuery}.` : undefined)
      else if (id === 'more') {
        if (state.lastQuery) await sendSearch(msg.from, state.lastQuery, state, products)
        else await sendMenu(msg.from, '¿Qué te gustaría ver?')
      } else if (id.startsWith('p_')) {
        const product = products.find((p) => p.id === id.slice(2))
        if (product) await sendProductCard(msg.from, product)
        else await sendMenu(msg.from, 'Ese producto ya no está disponible. ¿Te ayudo con otra cosa?')
      } else if (id.startsWith('buy_')) {
        const product = products.find((p) => p.id === id.slice(4))
        if (!product) await sendMenu(msg.from, 'Ese producto ya no está disponible. ¿Te ayudo con otra cosa?')
        else if (product.stock <= 0) await handOff(msg.from, msg.name, state, `Quiero que me avisen cuando llegue: ${product.name}.`)
        else
          await sendLink(
            msg.from,
            `¡Excelente elección! 🎉 *${product.name}* por *${formatCOP(product.price)}*.\n\nHaz tu pedido en un minuto: eliges cantidad${product.variants.length > 1 ? ' y color' : ''}, escribes tu dirección y *pagas al recibir*. Si prefieres que te lo tomemos por aquí, escribe *asesor*.`,
            'Comprar ahora',
            productUrl(product),
          )
      } else await sendMenu(msg.from, '¿En qué te ayudo?')
      state.greetedAt ??= Date.now()
      return
    }

    // 2. Mensajes que no son texto (fotos, audios, ubicaciones…)
    if (!raw) {
      await sendMenu(msg.from, 'Por ahora solo puedo leer mensajes de texto 🙏 Elige una opción o escribe *asesor* para hablar con una persona.')
      return
    }

    // 3. Pasos que esperan una respuesta
    if (state.step === 'track-phone' && state.pendingOrder) {
      const digits = raw.replace(/\D/g, '')
      if (digits.length >= 7) return await trackOrder(msg.from, state.pendingOrder, digits, state)
    }
    const reference = orderReference(raw)
    if (reference) return await trackOrder(msg.from, reference, msg.from, state)
    if (state.step === 'track-number') {
      state.step = 'idle'
      await sendButtons(msg.from, 'Ese no parece un número de pedido. Debe verse así: *ZX-20261030-A1B2C3*.', [
        { id: 'm_pedido', title: 'Intentar de nuevo' },
        { id: 'm_asesor', title: 'Hablar con asesor' },
      ])
      return
    }

    // 4. Viene del botón «Pedir por WhatsApp» de un producto de la tienda
    const interested = raw.match(/interesad[oa] en (.+?)(?: por \$|\.|$)/i)?.[1]
    if (interested) {
      const product = products.find((p) => normalize(p.name) === normalize(interested)) ?? searchItems(products, interested, 1)[0]
      if (product) {
        state.lastQuery = interested
        if (isNew) await sendText(msg.from, `¡Hola${firstName(msg.name) ? `, ${firstName(msg.name)}` : ''}! 👋 Gracias por escribir a ${STORE_NAME}. Este es el producto que te interesa:`)
        return await sendProductCard(msg.from, product)
      }
    }

    // 5. Intenciones por palabras clave
    // Formulario de contacto de la tienda («Hola, soy… Mi celular es…»): lo atiende una persona.
    if (/^hola soy .+ mi celular es/.test(text)) return await handOff(msg.from, msg.name, state, `Mensaje: «${clip(raw, 200)}».`)
    if (wantsMenu || (isNew && /^(hola|buen|ola|hey|info)/.test(text) && searchItems(products, raw, 1).length === 0)) return await sendWelcome(msg.from, msg.name)
    if (/\b(asesor|humano|persona|agente|alguien|llamar|llamada)\b/.test(text)) return await handOff(msg.from, msg.name, state, `Mensaje: «${clip(raw, 120)}».`)
    if (/\b(envio|envios|domicilio|despacho|cuanto (tarda|demora)|llega|pago|pagar|contra ?entrega|efectivo|transferencia|nequi|daviplata)\b/.test(text)) return await sendShipping(msg.from)
    if (/\b(garantia|devolucion|devolver|cambio|reembolso|retracto|danado|defectuoso)\b/.test(text)) return await sendWarranty(msg.from)
    if (/\b(pedido|orden|rastrear|rastreo|guia|seguimiento)\b/.test(text)) {
      state.step = 'track-number'
      return await sendText(msg.from, 'Claro 📦 Escríbeme tu *número de pedido* (empieza por ZX-).')
    }
    if (/^(gracias|muchas gracias|ok|listo|perfecto|vale|dale|genial)\b/.test(text)) {
      return await sendText(msg.from, '¡Con gusto! 😊 Si necesitas algo más, escribe *menú*.')
    }
    if (/\b(oferta|ofertas|descuento|descuentos|promo|promocion)\b/.test(text)) return await sendDeals(msg.from, products)

    // 6. Cualquier otra cosa: lo tratamos como búsqueda de producto
    const query = raw.replace(/^(tienen|tienes|hay|busco|quiero|necesito|precio( de)?|cuanto (vale|cuesta)|me interesa)\s+/i, '').replace(/[?¿!¡]/g, '').trim()
    if (state.step === 'search' || searchItems(products, query, 1).length > 0) return await sendSearch(msg.from, query, state, products)
    await sendMenu(msg.from, `No estoy seguro de haber entendido 🤔 Puedo ayudarte con esto, o escribe *asesor* para hablar con una persona.`)
  } finally {
    state.greetedAt ??= Date.now()
    await saveState(msg.from, state)
  }
}

/** Un asesor escribió desde la app (coexistencia): el bot se pausa para ese cliente. */
export async function pauseForHuman(customer: string) {
  const state = (await loadState(customer)) ?? emptyState()
  state.pausedUntil = Date.now() + HUMAN_PAUSE_MS
  state.step = 'idle'
  await saveState(customer, state)
}
