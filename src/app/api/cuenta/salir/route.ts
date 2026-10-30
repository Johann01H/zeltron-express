import { signOut } from '@/lib/account-actions'

/** Cierra la sesión (borra la cookie y anula el token en WordPress) y vuelve al inicio. */
export async function POST(request: Request) {
  await signOut()
  return Response.redirect(new URL('/', request.url), 303)
}
