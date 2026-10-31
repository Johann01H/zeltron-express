'use client'

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react'
import { Briefcase, Home, MapPin, MapPinned, Pencil, Phone, Plus, Star, Trash2, X } from 'lucide-react'
import type { Customer, CustomerAddress } from '@/lib/auth'
import { deleteAddress, saveAddress, setPrimaryAddress, type ProfileActionResult } from '@/lib/profile-actions'
import { DEPARTMENTS, VALLE_CITIES } from '@/lib/shipping'
import { cn } from '@/lib/utils'
import { EmptyState, Feedback, FormField, PanelHeader, inputClass, primaryButton, secondaryButton, selectClass } from './profile-ui'

const LABELS = [
  { value: 'Casa', Icon: Home },
  { value: 'Trabajo', Icon: Briefcase },
  { value: 'Otro', Icon: MapPin },
]

type Props = { customer: Customer; onChange: (customer: Customer) => void }

export function ProfileAddresses({ customer, onChange }: Props) {
  const [editing, setEditing] = useState<CustomerAddress | 'new' | null>(null)
  const [result, setResult] = useState<ProfileActionResult | null>(null)
  const [pending, startTransition] = useTransition()
  const addresses = [...customer.addresses].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
  const full = customer.addresses.length >= 8

  const run = (action: () => Promise<ProfileActionResult>) =>
    startTransition(async () => {
      const response = await action()
      setResult(response)
      if (response.customer) onChange(response.customer)
    })

  return (
    <section aria-labelledby="addresses-title">
      <PanelHeader
        title="Direcciones"
        description="Guarda dónde recibes tus pedidos. La principal se usa por defecto."
        action={
          customer.addresses.length > 0 && (
            <button type="button" className={primaryButton} onClick={() => { setResult(null); setEditing('new') }} disabled={full}>
              <Plus aria-hidden="true" className="size-4" /> Agregar dirección
            </button>
          )
        }
      />
      <h2 id="addresses-title" className="sr-only">Direcciones</h2>

      {result && !editing && <div className="mt-5"><Feedback result={result} /></div>}

      {addresses.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<MapPinned className="size-6" />} title="No tienes direcciones guardadas" text="Agrega tu casa o tu trabajo para comprar más rápido la próxima vez.">
            <button type="button" className={cn(primaryButton, 'mt-6')} onClick={() => setEditing('new')}>
              <Plus aria-hidden="true" className="size-4" /> Agregar dirección
            </button>
          </EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {addresses.map((address) => {
            const Icon = LABELS.find((l) => l.value === address.label)?.Icon ?? MapPin
            return (
              <article
                key={address.id}
                className={cn(
                  'flex flex-col rounded-2xl border bg-white p-5 transition',
                  address.isPrimary ? 'border-[#2F5BFF] shadow-[0_0_0_3px_rgba(47,91,255,.10)]' : 'border-[#DCE1EC] hover:border-[#B9C3D6]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('grid size-9 place-items-center rounded-xl', address.isPrimary ? 'bg-[#2F5BFF] text-white' : 'bg-[#F3F5FA] text-[#0E1A3A]')}>
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <h3 className="text-base font-extrabold tracking-[-.03em] text-[#0E1A3A]">{address.label}</h3>
                  </div>
                  {address.isPrimary && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF0FF] px-2.5 py-1 text-[11px] font-bold text-[#2F5BFF]">
                      <Star aria-hidden="true" className="size-3 fill-current" /> Principal
                    </span>
                  )}
                </div>
                <div className="mt-4 flex-1 space-y-1 text-sm">
                  <p className="font-semibold text-[#0E1A3A]">{address.recipient}</p>
                  <p className="text-[#353946]">{address.street}</p>
                  <p className="text-[#5B6478]">{[address.neighborhood && `Barrio ${address.neighborhood}`, address.city, address.department].filter(Boolean).join(' · ')}</p>
                  <p className="flex items-center gap-1.5 pt-1 text-xs text-[#5B6478]"><Phone aria-hidden="true" className="size-3.5" /> {address.phone}</p>
                  {address.notes && <p className="pt-1 text-xs italic text-[#8A8C95]">{address.notes}</p>}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#EEF1F6] pt-3">
                  <button type="button" disabled={pending} onClick={() => { setResult(null); setEditing(address) }} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-[#0E1A3A] hover:bg-[#F3F5FA]">
                    <Pencil aria-hidden="true" className="size-3.5" /> Editar
                  </button>
                  {!address.isPrimary && (
                    <button type="button" disabled={pending} onClick={() => run(() => setPrimaryAddress(address.id))} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-[#2F5BFF] hover:bg-[#EAF0FF]">
                      <Star aria-hidden="true" className="size-3.5" /> Hacer principal
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => { if (window.confirm(`¿Eliminar la dirección «${address.label}»?`)) run(() => deleteAddress(address.id)) }}
                    className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-[#B42318] hover:bg-[#FFF1F0]"
                  >
                    <Trash2 aria-hidden="true" className="size-3.5" /> Eliminar
                  </button>
                </div>
              </article>
            )
          })}
          {!full && (
            <button
              type="button"
              onClick={() => { setResult(null); setEditing('new') }}
              className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#D3D9E6] text-sm font-bold text-[#5B6478] transition hover:border-[#2F5BFF] hover:text-[#2F5BFF]"
            >
              <span className="grid size-10 place-items-center rounded-full bg-[#F3F5FA]"><Plus aria-hidden="true" className="size-5" /></span>
              Agregar otra dirección
            </button>
          )}
        </div>
      )}

      {editing && (
        <AddressDialog
          address={editing === 'new' ? null : editing}
          isFirst={customer.addresses.length === 0}
          defaults={{ recipient: customer.name, phone: customer.phone }}
          onClose={() => setEditing(null)}
          onSaved={(updated, response) => { onChange(updated); setResult(response); setEditing(null) }}
        />
      )}
    </section>
  )
}

function AddressDialog({
  address,
  isFirst,
  defaults,
  onClose,
  onSaved,
}: {
  address: CustomerAddress | null
  isFirst: boolean
  defaults: { recipient: string; phone: string }
  onClose: () => void
  onSaved: (customer: Customer, result: ProfileActionResult) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const preset = LABELS.some((l) => l.value === address?.label) ? address?.label ?? 'Casa' : address ? 'Otro' : 'Casa'
  const [label, setLabel] = useState(preset)
  const [department, setDepartment] = useState(address?.department || 'Valle del Cauca')
  const [result, setResult] = useState<ProfileActionResult | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    if (label === 'Otro') formData.set('label', String(formData.get('customLabel') || 'Otro'))
    setResult(null)
    startTransition(async () => {
      const response = await saveAddress(formData)
      if (response.ok && response.customer) onSaved(response.customer, response)
      else setResult(response)
    })
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose() }}
      className="m-auto w-[min(36rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-3xl border border-[#DCE1EC] bg-white p-0 text-[#0E1A3A] shadow-[0_30px_80px_rgba(14,26,58,.35)] backdrop:bg-[#0E1A3A]/55 backdrop:backdrop-blur-[2px]"
      aria-labelledby="address-dialog-title"
    >
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-[#E6EAF2] px-6 py-4">
          <h2 id="address-dialog-title" className="text-lg font-extrabold tracking-[-.04em]">{address ? 'Editar dirección' : 'Nueva dirección'}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-9 place-items-center rounded-lg text-[#5B6478] hover:bg-[#F3F5FA]"><X className="size-4" /></button>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          {address && <input type="hidden" name="id" value={address.id} />}
          <input type="hidden" name="label" value={label} />
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 text-xs font-semibold text-[#353946]">Nombre de la dirección</legend>
            <div className="flex flex-wrap gap-2">
              {LABELS.map(({ value, Icon }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={label === value}
                  onClick={() => setLabel(value)}
                  className={cn(
                    'inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition',
                    label === value ? 'border-[#2F5BFF] bg-[#EAF0FF] text-[#2F5BFF]' : 'border-[#DCE1EC] text-[#5B6478] hover:border-[#0E1A3A]',
                  )}
                >
                  <Icon aria-hidden="true" className="size-4" /> {value}
                </button>
              ))}
            </div>
            {label === 'Otro' && (
              <input name="customLabel" defaultValue={address && !LABELS.some((l) => l.value === address.label) ? address.label : ''} maxLength={30} placeholder="Ej. Casa de mi mamá" aria-label="Nombre personalizado" className={cn(inputClass, 'mt-2')} />
            )}
          </fieldset>

          <FormField label="Quién recibe" htmlFor="addr-recipient">
            <input id="addr-recipient" name="recipient" defaultValue={address?.recipient ?? defaults.recipient} autoComplete="name" required minLength={2} maxLength={80} className={inputClass} />
          </FormField>
          <FormField label="Celular" htmlFor="addr-phone">
            <input id="addr-phone" name="phone" type="tel" inputMode="tel" defaultValue={address?.phone ?? defaults.phone} autoComplete="tel" required pattern="[0-9+\s\-]{7,20}" placeholder="300 000 0000" className={inputClass} />
          </FormField>
          <FormField label="Departamento" htmlFor="addr-department">
            <select id="addr-department" name="department" value={department} onChange={(e) => setDepartment(e.target.value)} className={selectClass}>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Ciudad o municipio" htmlFor="addr-city">
            <input id="addr-city" name="city" defaultValue={address?.city ?? (department === 'Valle del Cauca' ? 'Cali' : '')} list={department === 'Valle del Cauca' ? 'addr-valle-cities' : undefined} required minLength={2} maxLength={60} autoComplete="address-level2" className={inputClass} />
            <datalist id="addr-valle-cities">{VALLE_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
          </FormField>
          <FormField label="Barrio" htmlFor="addr-neighborhood">
            <input id="addr-neighborhood" name="neighborhood" defaultValue={address?.neighborhood ?? ''} maxLength={60} placeholder="Ej. San Fernando" autoComplete="address-level3" className={inputClass} />
          </FormField>
          <FormField label="Dirección" htmlFor="addr-street">
            <input id="addr-street" name="street" defaultValue={address?.street ?? ''} required minLength={5} maxLength={120} placeholder="Calle 5 # 38-25, apto 302" autoComplete="street-address" className={inputClass} />
          </FormField>
          <FormField label="Indicaciones" hint="(opcional)" htmlFor="addr-notes" className="sm:col-span-2">
            <input id="addr-notes" name="notes" defaultValue={address?.notes ?? ''} maxLength={200} placeholder="Ej. Edificio azul, portería 24 horas" className={inputClass} />
          </FormField>
          <label className="flex items-center gap-2.5 text-sm font-semibold text-[#353946] sm:col-span-2">
            <input type="checkbox" name="isPrimary" defaultChecked={address?.isPrimary ?? isFirst} disabled={isFirst} className="size-4 accent-[#2F5BFF]" />
            Usar como dirección principal
            {isFirst && <input type="hidden" name="isPrimary" value="on" />}
          </label>
          {result && <div className="sm:col-span-2"><Feedback result={result} /></div>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#E6EAF2] bg-[#FAFBFD] px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButton}>Cancelar</button>
          <button type="submit" disabled={pending} className={primaryButton}>{pending ? 'Guardando…' : address ? 'Guardar cambios' : 'Guardar dirección'}</button>
        </div>
      </form>
    </dialog>
  )
}
