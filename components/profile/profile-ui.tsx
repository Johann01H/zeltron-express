'use client'

import { cn } from '@/lib/utils'
import type { ProfileActionResult } from '@/lib/profile-actions'

/** Piezas visuales compartidas por las secciones de «Mi cuenta». */

export const inputClass =
  'h-11 w-full rounded-xl border border-[#DCE1EC] bg-white px-3.5 text-sm text-[#0E1A3A] placeholder:text-[#9A9CA5] outline-none transition focus:border-[#2F5BFF] focus:ring-4 focus:ring-[#2F5BFF]/12 disabled:bg-[#F3F5FA] disabled:text-[#5B6478]'

export const selectClass = cn(
  inputClass,
  'appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%235B6478%27 stroke-width=%272%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-[position:right_.8rem_center] bg-no-repeat pr-9',
)

export const primaryButton =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2F5BFF] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(47,91,255,.25)] transition hover:bg-[#2449D8] disabled:opacity-60'

export const secondaryButton =
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE1EC] bg-white px-5 text-sm font-bold text-[#0E1A3A] transition hover:border-[#0E1A3A] disabled:opacity-60'

export function FormField({ label, htmlFor, hint, children, className }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-[#353946]">
        {label} {hint && <span className="font-normal text-[#8A8C95]">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

export function Feedback({ result }: { result: ProfileActionResult | null }) {
  if (!result) return null
  return (
    <p
      role={result.ok ? 'status' : 'alert'}
      className={cn(
        'rounded-xl border px-4 py-3 text-xs leading-5',
        result.ok ? 'border-[#B7E4C7] bg-[#EEFBF3] text-[#14532D]' : 'border-[#F5C2BD] bg-[#FFF1F0] text-[#912018]',
      )}
    >
      {result.message}
    </p>
  )
}

export function PanelHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E6EAF2] pb-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-[-.05em] text-[#0E1A3A]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[#5B6478]">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#D3D9E6] bg-[#FAFBFD] px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-[#EAF0FF] text-[#2F5BFF]">{icon}</span>
      <h3 className="mt-4 text-lg font-extrabold tracking-[-.04em] text-[#0E1A3A]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-[#5B6478]">{text}</p>
      {children}
    </div>
  )
}

/** Reduce la foto en el navegador (cuadrada, 400 px, JPEG) antes de enviarla: pesa ~40 KB. */
export async function prepareAvatar(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Sube una imagen JPG, PNG o WebP.')
  if (file.size > 15 * 1024 * 1024) throw new Error('La imagen es demasiado pesada. Usa una de menos de 15 MB.')
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const size = Math.min(400, side)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Tu navegador no pudo procesar la imagen.')
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.86)
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || 'Z'
}
