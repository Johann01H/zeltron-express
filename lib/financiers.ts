import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CATALOG_TAG } from './catalog'
import { isWordPressConfigured, wpQuery } from './wordpress'

/** Financiera con convenio (menú «Financieras» de WordPress). */
export type Financier = {
  id: string
  name: string
  logoUrl: string | null
  audience: 'good' | 'reported' | 'both'
  description: string
  /** Enlace para solicitar en línea. `null`: se tramita con un asesor por WhatsApp. */
  applyUrl: string | null
}

export async function getFinanciers(): Promise<Financier[]> {
  'use cache'
  cacheTag(CATALOG_TAG)
  cacheLife('hours')
  if (!isWordPressConfigured()) return []
  try {
    const data = await wpQuery<{ zeltronFinanciers: Financier[] }>(/* GraphQL */ `
      query Financiers { zeltronFinanciers { id name logoUrl audience description applyUrl } }
    `)
    return data.zeltronFinanciers
  } catch (error) {
    // Sin la versión 1.7 del plugin el crédito simplemente no se muestra.
    console.error('[financieras] no se pudieron cargar:', error instanceof Error ? error.message : error)
    return []
  }
}
