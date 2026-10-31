'use server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ACCOUNTS_ENABLED, SESSION_COOKIE, getSessionToken } from '@/lib/auth'
import { wpQuery } from '@/lib/wordpress'

export type AccountActionResult = { ok: boolean; message: string; redirectTo?: string }

const notYet: AccountActionResult = {
  ok: false,
  message: 'Las cuentas de cliente se habilitarán muy pronto. Mientras tanto puedes comprar sin registrarte y pagar contra entrega.',
}

const genericError = 'No pudimos completar la solicitud. Intenta de nuevo en un momento o escríbenos por WhatsApp.'

type SessionPayload = { token: string | null; expiresIn: number | null }

/** Los mensajes de error del plugin ya vienen en español y pensados para el cliente. */
function messageFrom(error: unknown) {
  const text = error instanceof Error ? error.message : ''
  if (!text || /No autorizado|sin JSON|no está configurada|fetch failed|ECONN|ETIMEDOUT/i.test(text)) {
    console.error('[cuenta]', error)
    return genericError
  }
  return text
}

async function saveSession({ token, expiresIn }: SessionPayload, remember: boolean) {
  if (!token) throw new Error(genericError)
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Sin «Mantener mi sesión iniciada» la cookie dura lo que dure el navegador abierto.
    ...(remember && expiresIn ? { maxAge: expiresIn } : {}),
  })
}

function safeRedirect(value: FormDataEntryValue | null) {
  const path = typeof value === 'string' ? value : ''
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : '/'
}

const email = z.string().trim().toLowerCase().email('Escribe un correo electrónico válido.')
const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.').max(200, 'La contraseña es demasiado larga.')

export async function signIn(formData: FormData): Promise<AccountActionResult> {
  if (!ACCOUNTS_ENABLED) return notYet
  const parsed = z
    .object({ email, password: z.string().min(1, 'Escribe tu contraseña.') })
    .safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const remember = formData.get('remember') === 'on'
  try {
    const data = await wpQuery<{ zeltronSignIn: SessionPayload }>(
      `mutation SignIn($input: ZeltronSignInInput!) { zeltronSignIn(input: $input) { token expiresIn } }`,
      { input: { ...parsed.data, remember } },
      { authenticated: true },
    )
    await saveSession(data.zeltronSignIn, remember)
    return { ok: true, message: '¡Bienvenido de nuevo!', redirectTo: safeRedirect(formData.get('redirectTo')) }
  } catch (error) {
    return { ok: false, message: messageFrom(error) }
  }
}

export async function signUp(formData: FormData): Promise<AccountActionResult> {
  if (formData.get('password') !== formData.get('confirmPassword')) {
    return { ok: false, message: 'Las contraseñas no coinciden. Revisa ambos campos.' }
  }
  if (!ACCOUNTS_ENABLED) return notYet
  const parsed = z
    .object({
      name: z.string().trim().min(2, 'Escribe tu nombre completo.').max(80),
      email,
      phone: z.string().trim().max(20).optional(),
      password,
      acceptTerms: z.literal('on', { error: 'Debes aceptar los términos y la política de privacidad.' }),
    })
    .safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone') || undefined,
      password: formData.get('password'),
      acceptTerms: formData.get('acceptTerms'),
    })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const { acceptTerms, ...input } = parsed.data
  void acceptTerms
  try {
    const data = await wpQuery<{ zeltronSignUp: SessionPayload }>(
      `mutation SignUp($input: ZeltronSignUpInput!) { zeltronSignUp(input: $input) { token expiresIn } }`,
      { input },
      { authenticated: true },
    )
    await saveSession(data.zeltronSignUp, true)
    return { ok: true, message: '¡Tu cuenta está lista!', redirectTo: safeRedirect(formData.get('redirectTo')) }
  } catch (error) {
    return { ok: false, message: messageFrom(error) }
  }
}

export async function requestPasswordReset(formData: FormData): Promise<AccountActionResult> {
  if (!ACCOUNTS_ENABLED) return notYet
  const parsed = email.safeParse(formData.get('email'))
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  try {
    await wpQuery(
      `mutation Forgot($input: ZeltronRequestPasswordResetInput!) { zeltronRequestPasswordReset(input: $input) { ok } }`,
      { input: { email: parsed.data } },
      { authenticated: true },
    )
    return {
      ok: true,
      message: `Si existe una cuenta con ${parsed.data}, te enviamos un correo con el enlace para crear una nueva contraseña. Revisa también la carpeta de spam.`,
    }
  } catch (error) {
    return { ok: false, message: messageFrom(error) }
  }
}

export async function resetPassword(formData: FormData): Promise<AccountActionResult> {
  if (!ACCOUNTS_ENABLED) return notYet
  if (formData.get('password') !== formData.get('confirmPassword')) {
    return { ok: false, message: 'Las contraseñas no coinciden. Revisa ambos campos.' }
  }
  const parsed = z
    .object({ login: z.string().min(1), key: z.string().min(1), password })
    .safeParse({ login: formData.get('login'), key: formData.get('key'), password: formData.get('password') })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, message: issue.path[0] === 'password' ? issue.message : 'El enlace no es válido. Solicita uno nuevo.' }
  }
  try {
    await wpQuery(
      `mutation Reset($input: ZeltronResetPasswordInput!) { zeltronResetPassword(input: $input) { ok } }`,
      { input: parsed.data },
      { authenticated: true },
    )
    return { ok: true, message: 'Listo, tu contraseña se actualizó. Ya puedes iniciar sesión con la nueva.' }
  } catch (error) {
    return { ok: false, message: messageFrom(error) }
  }
}

export async function signOut(): Promise<void> {
  const token = await getSessionToken()
  ;(await cookies()).delete(SESSION_COOKIE)
  if (!token || !ACCOUNTS_ENABLED) return
  try {
    await wpQuery(
      `mutation SignOut($input: ZeltronSignOutInput!) { zeltronSignOut(input: $input) { ok } }`,
      { input: { token } },
      { authenticated: true },
    )
  } catch (error) {
    console.error('[cuenta] No se pudo cerrar la sesión en WordPress:', error)
  }
}
