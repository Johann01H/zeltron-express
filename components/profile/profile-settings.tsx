'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import type { Customer } from '@/lib/auth'
import { changePassword, updateProfile, type ProfileActionResult } from '@/lib/profile-actions'
import { cn } from '@/lib/utils'
import { AvatarEditor } from './profile-avatar'
import { Feedback, FormField, PanelHeader, inputClass, primaryButton } from './profile-ui'

type Props = { customer: Customer; onChange: (customer: Customer) => void }

export function ProfileSettings({ customer, onChange }: Props) {
  return (
    <section aria-labelledby="settings-title">
      <PanelHeader title="Configuración" description="Actualiza tu foto, tus datos y tu contraseña." />
      <h2 id="settings-title" className="sr-only">Configuración</h2>

      <div className="mt-6 flex flex-col gap-5">
        <Card title="Foto de perfil" description="Se muestra en tu cuenta y en el menú de la tienda.">
          <AvatarEditor customer={customer} onChange={onChange} variant="settings" />
        </Card>
        <DetailsForm customer={customer} onChange={onChange} />
        <PasswordForm />
      </div>
    </section>
  )
}

function Card({ title, description, icon, children }: { title: string; description: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#DCE1EC] bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        {icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EAF0FF] text-[#2F5BFF]">{icon}</span>}
        <div>
          <h3 className="text-base font-extrabold tracking-[-.03em] text-[#0E1A3A]">{title}</h3>
          <p className="mt-0.5 text-sm text-[#5B6478]">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function DetailsForm({ customer, onChange }: Props) {
  const [result, setResult] = useState<ProfileActionResult | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setResult(null)
    startTransition(async () => {
      const response = await updateProfile(formData)
      setResult(response)
      if (response.customer) onChange(response.customer)
    })
  }

  return (
    <Card title="Datos personales" description="Los usamos para coordinar tus entregas." icon={<UserRound className="size-4" />}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nombre" htmlFor="set-first">
          <input id="set-first" name="firstName" defaultValue={customer.firstName || customer.name} required minLength={2} maxLength={40} autoComplete="given-name" className={inputClass} />
        </FormField>
        <FormField label="Apellidos" htmlFor="set-last">
          <input id="set-last" name="lastName" defaultValue={customer.lastName} maxLength={40} autoComplete="family-name" className={inputClass} />
        </FormField>
        <FormField label="Celular" htmlFor="set-phone">
          <input id="set-phone" name="phone" type="tel" inputMode="tel" defaultValue={customer.phone} pattern="[0-9+\s\-]{7,20}" placeholder="300 000 0000" autoComplete="tel" className={inputClass} />
        </FormField>
        <FormField label="Correo electrónico" htmlFor="set-email" hint="(no se puede cambiar)">
          <input id="set-email" value={customer.email} disabled readOnly className={inputClass} />
        </FormField>
        {result && <div className="sm:col-span-2"><Feedback result={result} /></div>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className={primaryButton}>{pending ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const [visible, setVisible] = useState(false)
  const [result, setResult] = useState<ProfileActionResult | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setResult(null)
    startTransition(async () => {
      const response = await changePassword(formData)
      setResult(response)
      if (response.ok) form.reset()
    })
  }

  const type = visible ? 'text' : 'password'
  return (
    <Card title="Contraseña" description="Al cambiarla cerramos tu cuenta en los demás dispositivos." icon={<LockKeyhole className="size-4" />}>
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Contraseña actual" htmlFor="pwd-current" className="sm:col-span-2">
          <input id="pwd-current" name="currentPassword" type={type} required autoComplete="current-password" className={cn(inputClass, 'sm:max-w-[calc(50%-.5rem)]')} />
        </FormField>
        <FormField label="Nueva contraseña" htmlFor="pwd-new">
          <input id="pwd-new" name="newPassword" type={type} required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" className={inputClass} />
        </FormField>
        <FormField label="Confirmar nueva contraseña" htmlFor="pwd-confirm">
          <input id="pwd-confirm" name="confirmPassword" type={type} required minLength={8} autoComplete="new-password" className={inputClass} />
        </FormField>
        {result && <div className="sm:col-span-2"><Feedback result={result} /></div>}
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button type="submit" disabled={pending} className={primaryButton}>{pending ? 'Actualizando…' : 'Cambiar contraseña'}</button>
          <button type="button" onClick={() => setVisible((v) => !v)} aria-pressed={visible} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B6478] hover:text-[#0E1A3A]">
            {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
            {visible ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
          </button>
        </div>
      </form>
    </Card>
  )
}
