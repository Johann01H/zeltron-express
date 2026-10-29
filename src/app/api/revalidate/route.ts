import { revalidateTag } from 'next/cache'
import { CATALOG_TAG } from '@/lib/catalog'

/**
 * Webhook que llama el plugin zeltron-core cuando se crea/edita/borra un
 * producto en WordPress. Requiere el mismo secreto en ambos lados.
 */
export async function POST(request: Request) {
  const secret = process.env.ZELTRON_API_SECRET
  if (!secret || request.headers.get('x-zeltron-secret') !== secret) {
    return Response.json({ ok: false }, { status: 401 })
  }
  revalidateTag(CATALOG_TAG, 'max')
  return Response.json({ ok: true, revalidated: CATALOG_TAG })
}
