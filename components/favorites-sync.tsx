'use client'

import { useEffect, useRef } from 'react'
import { saveFavorites } from '@/lib/profile-actions'
import { useFavorites } from '@/store/favorites'

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id))

/**
 * Con sesión iniciada: al entrar combina los favoritos de este navegador con los de la cuenta
 * y, desde ahí, cada corazón que se marca o desmarca se guarda en la cuenta.
 */
export function FavoritesSync({ accountId, serverIds }: { accountId: string; serverIds: string[] }) {
  const synced = useRef<string[] | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const start = () => {
      const local = useFavorites.getState().ids
      const merged = [...new Set([...serverIds, ...local])]
      useFavorites.getState().setFavorites(merged)
      synced.current = serverIds
      if (!sameList(merged, serverIds)) push(merged)
    }

    const push = (ids: string[]) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(async () => {
        const result = await saveFavorites(ids)
        if (!cancelled && result.ok && result.favorites) synced.current = result.favorites
      }, 500)
    }

    // Espera a que el estado guardado en el navegador esté cargado antes de combinar.
    const persist = useFavorites.persist
    const unsubHydration = persist.hasHydrated() ? (start(), undefined) : persist.onFinishHydration(start)

    const unsubscribe = useFavorites.subscribe((state, previous) => {
      if (synced.current === null || sameList(state.ids, previous.ids)) return
      if (!sameList(state.ids, synced.current)) push(state.ids)
    })

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      unsubscribe()
      unsubHydration?.()
    }
    // Se vuelve a sincronizar si cambia la cuenta (otro inicio de sesión).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId])

  return null
}
