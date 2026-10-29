'use client'

import { useSyncExternalStore } from 'react'
import { OFFER_ENDS_AT } from '@/lib/config'

const END = OFFER_ENDS_AT ? new Date(OFFER_ENDS_AT).getTime() : 0

// Reloj compartido que avanza cada segundo. En el servidor devuelve null, así
// el prerender no lee la hora (requisito de cacheComponents).
const subscribe = (notify: () => void) => {
  const id = window.setInterval(notify, 1000)
  return () => window.clearInterval(id)
}
const getSecond = () => Math.floor(Date.now() / 1000)
const getServerSecond = () => null

function useRemainingMs() {
  const second = useSyncExternalStore(subscribe, getSecond, getServerSecond)
  return second === null ? null : Math.max(0, END - second * 1000)
}

export function OfferCountdown({ segmented = false }: { segmented?: boolean }) {
  const remaining = useRemainingMs()
  if (remaining !== null && remaining <= 0) return null
  if (segmented) {
    const t = Math.floor((remaining ?? 0) / 1000)
    const parts: [string, number][] = [['días', Math.floor(t / 86400)], ['horas', Math.floor((t % 86400) / 3600)], ['min', Math.floor((t % 3600) / 60)], ['seg', t % 60]]
    return (
      <div className="countdown" role="timer" aria-label="Tiempo restante de la oferta">
        {parts.map(([label, value]) => (
          <div key={label} className="countdown-cell">
            <span className="countdown-value">{remaining === null ? '--' : String(value).padStart(2, '0')}</span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
    )
  }
  if (remaining === null) return <span aria-label="Cuenta regresiva de oferta">--:--:--</span>

  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')

  return (
    <span aria-label={`Oferta termina en ${days} días, ${hours} horas, ${minutes} minutos y ${seconds} segundos`}>
      {days > 0 ? `${days}d ` : ''}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  )
}

export function OfferSection({ children }: { children: React.ReactNode }) {
  const remaining = useRemainingMs()
  if (!OFFER_ENDS_AT) return null
  // Mientras no hay reloj (prerender) se muestra; en el cliente se oculta si ya terminó.
  return remaining === null || remaining > 0 ? <>{children}</> : null
}
