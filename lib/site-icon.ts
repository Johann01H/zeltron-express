import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CATALOG_TAG } from './catalog'

/**
 * Ícono del sitio configurado en WordPress (Ajustes → Generales → Icono del sitio).
 * Se lee del índice público de la REST API (`site_icon_url`), así que no requiere el secreto.
 * Comparte la etiqueta del catálogo: al guardar cualquier producto también se refresca.
 */
export async function getSiteIconUrl(): Promise<string | null> {
  'use cache'
  cacheTag(CATALOG_TAG)
  cacheLife('hours')

  const graphqlUrl = process.env.WORDPRESS_GRAPHQL_URL
  if (!graphqlUrl) return null

  try {
    const response = await fetch(new URL('/wp-json/', graphqlUrl), { headers: { Accept: 'application/json' } })
    if (!response.ok || !(response.headers.get('content-type') ?? '').includes('application/json')) return null
    const index = (await response.json()) as { site_icon_url?: unknown }
    const url = typeof index.site_icon_url === 'string' ? index.site_icon_url : ''
    return /^https?:\/\//.test(url) ? url : null
  } catch {
    return null
  }
}
