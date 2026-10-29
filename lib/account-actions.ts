'use server'
import { ACCOUNTS_ENABLED } from '@/lib/auth'

export type AccountActionResult = { ok: boolean; message: string }

const notYet: AccountActionResult = {
  ok: false,
  message: 'Las cuentas de cliente se habilitarán muy pronto. Mientras tanto puedes comprar sin registrarte y pagar contra entrega.',
}

export async function signIn(formData: FormData): Promise<AccountActionResult> {
  void formData // se usará al conectar el login de WPGraphQL
  if (!ACCOUNTS_ENABLED) return notYet
  // TODO(zeltron-core): mutación de login en WPGraphQL + cookie de sesión httpOnly.
  return notYet
}

export async function signUp(formData: FormData): Promise<AccountActionResult> {
  if (formData.get('password') !== formData.get('confirmPassword')) {
    return { ok: false, message: 'Las contraseñas no coinciden. Revisa ambos campos.' }
  }
  if (!ACCOUNTS_ENABLED) return notYet
  // TODO(zeltron-core): mutación de registro en WPGraphQL.
  return notYet
}
