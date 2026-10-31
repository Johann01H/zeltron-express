'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2, Pencil, Trash2 } from 'lucide-react'
import type { Customer } from '@/lib/auth'
import { removeAvatar, setAvatar, type ProfileActionResult } from '@/lib/profile-actions'
import { cn } from '@/lib/utils'
import { Feedback, initials, prepareAvatar, secondaryButton } from './profile-ui'

type Props = { customer: Customer; onChange: (customer: Customer) => void; variant: 'sidebar' | 'settings' }

export function AvatarEditor({ customer, onChange, variant }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<ProfileActionResult | null>(null)
  const [pending, startTransition] = useTransition()
  const src = preview ?? customer.avatarUrl

  const apply = (action: () => Promise<ProfileActionResult>) =>
    startTransition(async () => {
      const response = await action()
      setResult(response)
      setPreview(null)
      if (response.customer) {
        onChange(response.customer)
        router.refresh() // actualiza la foto del menú de cuenta en el header
      }
    })

  async function handleFile(file: File | undefined) {
    if (!file) return
    setResult(null)
    try {
      const dataUrl = await prepareAvatar(file)
      setPreview(dataUrl)
      apply(() => setAvatar(dataUrl))
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : 'No pudimos leer la imagen.' })
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => handleFile(e.target.files?.[0])}
    />
  )

  const circle = (size: string, text: string) => (
    <span className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#0E1A3A] font-extrabold text-[#FFC92E]', size, text)}>
      {src ? <img src={src} alt={`Foto de ${customer.name}`} className="size-full object-cover" /> : <span aria-hidden="true">{initials(customer.name)}</span>}
      {pending && (
        <span className="absolute inset-0 grid place-items-center bg-[#0E1A3A]/55 text-white">
          <Loader2 aria-hidden="true" className="size-6 animate-spin" />
          <span className="sr-only">Guardando foto…</span>
        </span>
      )}
    </span>
  )

  if (variant === 'sidebar') {
    return (
      <div className="relative">
        {picker}
        <span className="block rounded-full bg-gradient-to-br from-[#FFC92E] via-[#FFE07A] to-[#2F5BFF] p-[3px] shadow-[0_12px_30px_rgba(14,26,58,.25)]">
          <span className="block rounded-full bg-white p-[3px]">{circle('size-24', 'text-2xl')}</span>
        </span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          aria-label={customer.avatarUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
          className="absolute bottom-0.5 right-0.5 grid size-9 place-items-center rounded-full border-[3px] border-white bg-[#0E1A3A] text-[#FFC92E] shadow-md transition hover:scale-105 disabled:opacity-70"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
        </button>
        {result && !result.ok && <p role="alert" className="absolute left-1/2 top-full mt-2 w-56 -translate-x-1/2 rounded-lg bg-[#FFF1F0] px-3 py-2 text-center text-[11px] text-[#912018]">{result.message}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {picker}
      <div className="flex flex-wrap items-center gap-5">
        {circle('size-20', 'text-xl')}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={pending} className={secondaryButton}>
            <Camera aria-hidden="true" className="size-4" /> {customer.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {customer.avatarUrl && (
            <button type="button" onClick={() => apply(removeAvatar)} disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-[#B42318] hover:bg-[#FFF1F0] disabled:opacity-60">
              <Trash2 aria-hidden="true" className="size-4" /> Quitar
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-[#8A8C95]">JPG, PNG o WebP. La recortamos en cuadrado automáticamente.</p>
      <Feedback result={result} />
    </div>
  )
}
