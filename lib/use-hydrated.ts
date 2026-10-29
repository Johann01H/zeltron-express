'use client'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** `true` solo en el cliente, para leer stores persistidos sin errores de hidratación. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false)
}
