import 'server-only'
import { wpQuery } from '@/lib/wordpress'

/** Memoria corta de cada conversación (se guarda en WordPress 24 h; ver Bot_State en el plugin). */
export type BotState = {
  step: 'idle' | 'search' | 'track-number' | 'track-phone'
  /** IDs de mensajes ya respondidos (Meta reintenta los webhooks). */
  seen: string[]
  /** Hasta cuándo el bot calla porque atiende una persona (ms). */
  pausedUntil?: number
  lastQuery?: string
  pendingOrder?: string
  greetedAt?: number
}

export const emptyState = (): BotState => ({ step: 'idle', seen: [] })

export async function loadState(phone: string): Promise<BotState | null> {
  const data = await wpQuery<{ zeltronBotState: string | null }>(
    `query BotState($phone: String!) { zeltronBotState(phone: $phone) }`,
    { phone },
    { authenticated: true },
  )
  if (!data.zeltronBotState) return null
  try {
    return { ...emptyState(), ...(JSON.parse(data.zeltronBotState) as Partial<BotState>) }
  } catch {
    return null
  }
}

export async function saveState(phone: string, state: BotState) {
  const compact = { ...state, seen: state.seen.slice(-20) }
  await wpQuery(
    `mutation SetBotState($input: ZeltronSetBotStateInput!) { zeltronSetBotState(input: $input) { ok } }`,
    { input: { phone, state: JSON.stringify(compact) } },
    { authenticated: true },
  )
}
