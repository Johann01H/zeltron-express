import 'server-only'

/**
 * Cliente mínimo de la API oficial de WhatsApp (Cloud API de Meta).
 * Variables (Vercel → Settings → Environment Variables):
 *   WHATSAPP_TOKEN            token permanente del usuario del sistema
 *   WHATSAPP_PHONE_NUMBER_ID  ID del número del bot (no es el número en sí)
 *   WHATSAPP_GRAPH_URL        opcional, por defecto https://graph.facebook.com/v23.0
 */
const GRAPH_URL = process.env.WHATSAPP_GRAPH_URL ?? 'https://graph.facebook.com/v23.0'

export const isWhatsAppConfigured = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)

/** Recorta respetando los límites de WhatsApp (botones 20, filas 24/72, cuerpo 1024…). */
export const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)

async function post(payload: Record<string, unknown>) {
  const response = await fetch(`${GRAPH_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...payload }),
  })
  if (!response.ok) {
    console.error('[whatsapp] Meta respondió', response.status, (await response.text()).slice(0, 500))
  }
  return response.ok
}

const base = (to: string) => ({ recipient_type: 'individual', to })

export function sendText(to: string, body: string) {
  return post({ ...base(to), type: 'text', text: { body: clip(body, 4096), preview_url: true } })
}

export type Button = { id: string; title: string }

export function sendButtons(to: string, body: string, buttons: Button[], header?: { image: string } | { text: string }) {
  return post({
    ...base(to),
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(header && ('image' in header ? { header: { type: 'image', image: { link: header.image } } } : { header: { type: 'text', text: clip(header.text, 60) } })),
      body: { text: clip(body, 1024) },
      action: { buttons: buttons.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id, title: clip(b.title, 20) } })) },
    },
  })
}

export type ListRow = { id: string; title: string; description?: string }

export function sendList(to: string, body: string, buttonLabel: string, sections: { title: string; rows: ListRow[] }[]) {
  let remaining = 10 // WhatsApp admite 10 filas en total
  const clean = sections
    .map((section) => {
      const rows = section.rows.slice(0, remaining)
      remaining -= rows.length
      return {
        title: clip(section.title, 24),
        rows: rows.map((r) => ({ id: r.id, title: clip(r.title, 24), ...(r.description ? { description: clip(r.description, 72) } : {}) })),
      }
    })
    .filter((s) => s.rows.length > 0)
  return post({
    ...base(to),
    type: 'interactive',
    interactive: { type: 'list', body: { text: clip(body, 1024) }, action: { button: clip(buttonLabel, 20), sections: clean } },
  })
}

export function sendLink(to: string, body: string, label: string, url: string) {
  return post({
    ...base(to),
    type: 'interactive',
    interactive: { type: 'cta_url', body: { text: clip(body, 1024) }, action: { name: 'cta_url', parameters: { display_text: clip(label, 20), url } } },
  })
}

/** Marca el mensaje como leído (los dos chulitos azules) y muestra «escribiendo…». */
export function markRead(messageId: string) {
  return post({ status: 'read', message_id: messageId, typing_indicator: { type: 'text' } })
}
