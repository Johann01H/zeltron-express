'use client'
import { usePathname } from 'next/navigation'

/** Rutas con pantalla propia, sin header ni footer de la tienda. */
export const STANDALONE_ROUTES = ['/iniciar-sesion', '/registrarse']

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (STANDALONE_ROUTES.includes(pathname)) return null
  return <>{children}</>
}
