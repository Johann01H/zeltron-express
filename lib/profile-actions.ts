'use server'
import { z } from 'zod'
import { CUSTOMER_FIELDS, getSessionToken, type Customer } from '@/lib/auth'
import { DEPARTMENTS } from '@/lib/shipping'
import { wpQuery } from '@/lib/wordpress'

export type ProfileActionResult = { ok: boolean; message: string; customer?: Customer }

const genericError = 'No pudimos guardar los cambios. Intenta de nuevo en un momento.'

function messageFrom(error: unknown) {
  const text = error instanceof Error ? error.message : ''
  if (!text || /No autorizado|sin JSON|no está configurada|fetch failed|ECONN|ETIMEDOUT/i.test(text)) {
    console.error('[perfil]', error)
    return genericError
  }
  return text
}

/** Ejecuta una mutación de «Mi cuenta» con el token de la cookie y devuelve el perfil actualizado. */
async function mutate(name: string, input: Record<string, unknown>, success: string): Promise<ProfileActionResult> {
  const token = await getSessionToken()
  if (!token) return { ok: false, message: 'Tu sesión expiró. Inicia sesión de nuevo.' }
  const type = name.charAt(0).toUpperCase() + name.slice(1) + 'Input'
  try {
    const data = await wpQuery<Record<string, { customer: Customer }>>(
      `mutation Profile($input: ${type}!) { ${name}(input: $input) { customer { ${CUSTOMER_FIELDS} } } }`,
      { input: { token, ...input } },
      { authenticated: true },
    )
    return { ok: true, message: success, customer: data[name].customer }
  } catch (error) {
    return { ok: false, message: messageFrom(error) }
  }
}

const text = (max: number) => z.string().trim().max(max)
const phone = z.string().trim().regex(/^[0-9+\s-]{7,20}$/, 'Revisa el número de celular.')

export async function updateProfile(formData: FormData) {
  const parsed = z
    .object({ firstName: text(40).min(2, 'Escribe tu nombre.'), lastName: text(40), phone: phone.or(z.literal('')) })
    .safeParse({ firstName: formData.get('firstName'), lastName: formData.get('lastName') ?? '', phone: formData.get('phone') ?? '' })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  return mutate('zeltronUpdateProfile', parsed.data, 'Tus datos se guardaron.')
}

export async function changePassword(formData: FormData) {
  if (formData.get('newPassword') !== formData.get('confirmPassword')) {
    return { ok: false, message: 'Las contraseñas nuevas no coinciden.' }
  }
  const parsed = z
    .object({
      currentPassword: z.string().min(1, 'Escribe tu contraseña actual.'),
      newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres.').max(200),
    })
    .safeParse({ currentPassword: formData.get('currentPassword'), newPassword: formData.get('newPassword') })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  return mutate('zeltronChangePassword', parsed.data, 'Listo, tu contraseña se actualizó. Cerramos tus otras sesiones.')
}

export async function saveAddress(formData: FormData) {
  const parsed = z
    .object({
      id: text(20).optional(),
      label: text(30),
      recipient: text(80).min(2, 'Escribe quién recibe el pedido.'),
      phone,
      department: z.enum(DEPARTMENTS, { error: 'Elige el departamento.' }),
      city: text(60).min(2, 'Escribe la ciudad.'),
      neighborhood: text(60),
      street: text(120).min(5, 'Escribe la dirección completa (calle, número y apartamento).'),
      notes: text(200),
      isPrimary: z.boolean(),
    })
    .safeParse({
      id: formData.get('id') || undefined,
      label: formData.get('label') || 'Casa',
      recipient: formData.get('recipient'),
      phone: formData.get('phone'),
      department: formData.get('department'),
      city: formData.get('city'),
      neighborhood: formData.get('neighborhood') ?? '',
      street: formData.get('street'),
      notes: formData.get('notes') ?? '',
      isPrimary: formData.get('isPrimary') === 'on',
    })
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }
  return mutate('zeltronSaveAddress', parsed.data, parsed.data.id ? 'Dirección actualizada.' : 'Dirección guardada.')
}

export async function deleteAddress(id: string) {
  return mutate('zeltronDeleteAddress', { id: String(id).slice(0, 20) }, 'Dirección eliminada.')
}

export async function setPrimaryAddress(id: string) {
  return mutate('zeltronSetPrimaryAddress', { id: String(id).slice(0, 20) }, 'Esta es ahora tu dirección principal.')
}

export async function setAvatar(dataUrl: string) {
  if (typeof dataUrl !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(dataUrl) || dataUrl.length > 1_500_000) {
    return { ok: false, message: 'Sube una imagen JPG, PNG o WebP.' }
  }
  return mutate('zeltronSetAvatar', { image: dataUrl }, 'Tu foto de perfil se actualizó.')
}

export async function removeAvatar() {
  return mutate('zeltronRemoveAvatar', {}, 'Quitamos tu foto de perfil.')
}

/** Guarda la lista de favoritos en la cuenta. Devuelve la lista que quedó (solo productos publicados). */
export async function saveFavorites(ids: string[]): Promise<{ ok: boolean; favorites?: string[] }> {
  const token = await getSessionToken()
  if (!token || !Array.isArray(ids)) return { ok: false }
  const clean = [...new Set(ids.map(String).filter((id) => /^\d{1,12}$/.test(id)))].slice(0, 200)
  try {
    const data = await wpQuery<{ zeltronSetFavorites: { favorites: string[] } }>(
      `mutation Favorites($input: ZeltronSetFavoritesInput!) { zeltronSetFavorites(input: $input) { favorites } }`,
      { input: { token, ids: clean } },
      { authenticated: true },
    )
    return { ok: true, favorites: data.zeltronSetFavorites.favorites }
  } catch (error) {
    console.error('[favoritos]', error)
    return { ok: false }
  }
}
