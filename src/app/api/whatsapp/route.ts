import { createHmac, timingSafeEqual } from 'node:crypto'
import { after } from 'next/server'
import { handleIncoming, pauseForHuman, type Incoming } from '@/lib/whatsapp/bot'
import { isWhatsAppConfigured } from '@/lib/whatsapp/graph'

/**
 * Webhook de WhatsApp (Meta → tienda).
 * URL para Meta: https://www.zeltronexpress.com/api/whatsapp
 * Variables: WHATSAPP_VERIFY_TOKEN (la inventas tú y la pegas igual en Meta) y WHATSAPP_APP_SECRET (clave secreta de la app de Meta).
 */

// GET: Meta verifica la URL al guardarla.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const expected = process.env.WHATSAPP_VERIFY_TOKEN
  if (expected && params.get('hub.mode') === 'subscribe' && params.get('hub.verify_token') === expected) {
    return new Response(params.get('hub.challenge') ?? '', { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

function validSignature(body: string, header: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET
  if (!secret || !header?.startsWith('sha256=')) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('hex'))
  const received = Buffer.from(header.slice(7))
  return expected.length === received.length && timingSafeEqual(expected, received)
}

type WebhookMessage = {
  id: string
  from: string
  type: string
  text?: { body: string }
  interactive?: { type: string; button_reply?: { id: string }; list_reply?: { id: string } }
  button?: { text: string; payload?: string }
}

type WebhookValue = {
  contacts?: { wa_id: string; profile?: { name?: string } }[]
  messages?: WebhookMessage[]
  message_echoes?: { to: string }[]
}

// POST: mensajes de los clientes. Se responde 200 de inmediato y se atiende después (Meta exige respuesta rápida).
export async function POST(request: Request) {
  const body = await request.text()
  if (!validSignature(body, request.headers.get('x-hub-signature-256'))) {
    return new Response('Invalid signature', { status: 401 })
  }
  if (!isWhatsAppConfigured()) return new Response('OK', { status: 200 })

  let payload: { entry?: { changes?: { field: string; value: WebhookValue }[] }[] }
  try {
    payload = JSON.parse(body)
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const jobs: (() => Promise<unknown>)[] = []
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {}
      // Coexistencia: un asesor escribió desde la app de WhatsApp Business → el bot se calla con ese cliente.
      if (change.field === 'smb_message_echoes') {
        for (const echo of value.message_echoes ?? []) jobs.push(() => pauseForHuman(echo.to))
        continue
      }
      if (change.field !== 'messages') continue
      for (const message of value.messages ?? []) {
        const contact = value.contacts?.find((c) => c.wa_id === message.from)
        const incoming: Incoming = {
          id: message.id,
          from: message.from,
          name: contact?.profile?.name ?? '',
          kind: message.type,
          text: message.text?.body ?? (message.type === 'button' ? message.button?.text : undefined),
          reply: message.interactive?.button_reply?.id ?? message.interactive?.list_reply?.id ?? message.button?.payload,
        }
        jobs.push(() => handleIncoming(incoming))
      }
    }
  }

  after(async () => {
    for (const job of jobs) {
      try {
        await job()
      } catch (error) {
        console.error('[whatsapp] Error atendiendo el mensaje:', error)
      }
    }
  })
  return new Response('OK', { status: 200 })
}
