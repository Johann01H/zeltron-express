import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST(request: Request) {
  ;(await cookies()).delete(SESSION_COOKIE)
  return Response.redirect(new URL('/', request.url), 303)
}
