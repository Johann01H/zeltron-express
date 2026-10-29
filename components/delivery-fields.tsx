'use client'

import Link from 'next/link'
import { useState } from 'react'
import { DEPARTMENTS, VALLE_CITIES, zoneFor } from '@/lib/shipping'
import { DeliveryEstimate } from '@/components/delivery-estimate'
import { cn } from '@/lib/utils'

export const fieldClass =
  'h-11 w-full rounded-xl border border-[#DCE1EC] bg-white px-3.5 text-sm text-[#0E1A3A] placeholder:text-[#9AA1B2] outline-none transition focus:border-[#2F5BFF] focus:ring-4 focus:ring-[#2F5BFF]/12'

export function Field({ label, hint, htmlFor, children, className }: { label: string; hint?: string; htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-[#0E1A3A]">
        {label} {hint && <span className="font-normal text-[#8A91A3]">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

/** Campos de entrega con formato colombiano. `prefix` evita ids repetidos si hay dos formularios en la página. */
export function DeliveryFields({ prefix = '', withEmail = true, compact = false }: { prefix?: string; withEmail?: boolean; compact?: boolean }) {
  const [department, setDepartment] = useState('Valle del Cauca')
  const [city, setCity] = useState('Cali')
  const zone = zoneFor(city, department)
  const id = (name: string) => `${prefix}${name}`

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre completo" htmlFor={id('name')}>
        <input id={id('name')} name="name" autoComplete="name" placeholder="Nombre y apellido" required minLength={2} className={fieldClass} />
      </Field>
      <Field label="Celular" hint="(te confirmamos por WhatsApp)" htmlFor={id('phone')}>
        <input id={id('phone')} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="300 000 0000" required pattern="[0-9+\s\-]{7,20}" className={fieldClass} />
      </Field>
      {withEmail && (
        <Field label="Correo" hint="(opcional)" htmlFor={id('email')} className="sm:col-span-2">
          <input id={id('email')} name="email" type="email" autoComplete="email" placeholder="nombre@correo.com" className={fieldClass} />
        </Field>
      )}
      <Field label="Departamento" htmlFor={id('department')}>
        <select id={id('department')} name="department" value={department} onChange={(e) => { setDepartment(e.target.value); setCity(e.target.value === 'Valle del Cauca' ? 'Cali' : '') }} className={cn(fieldClass, 'appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%235B6478%27 stroke-width=%272%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-[position:right_.85rem_center] bg-no-repeat pr-9')}>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </Field>
      <Field label="Ciudad o municipio" htmlFor={id('city')}>
        <input id={id('city')} name="city" value={city} onChange={(e) => setCity(e.target.value)} list={department === 'Valle del Cauca' ? id('valle-cities') : undefined} autoComplete="address-level2" placeholder="Ej. Cali" required minLength={2} className={fieldClass} />
        <datalist id={id('valle-cities')}>{VALLE_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="Barrio" htmlFor={id('neighborhood')}>
        <input id={id('neighborhood')} name="neighborhood" autoComplete="address-level3" placeholder="Ej. San Fernando" required minLength={2} className={fieldClass} />
      </Field>
      <Field label="Dirección" htmlFor={id('address')}>
        <input id={id('address')} name="address" autoComplete="street-address" placeholder="Ej. Calle 5 # 38-25, apto 302" required minLength={5} className={fieldClass} />
      </Field>
      <Field label="Punto de referencia" hint="(opcional)" htmlFor={id('notes')} className="sm:col-span-2">
        <input id={id('notes')} name="notes" maxLength={300} placeholder="Ej. Edificio azul frente al parque, timbre 302" className={fieldClass} />
      </Field>

      <div className="sm:col-span-2">
        <DeliveryEstimate zone={zone} compact={compact} />
      </div>

      <label className="flex items-start gap-2.5 text-xs leading-5 text-[#5B6478] sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-[#2F5BFF]" />
        <span>
          Autorizo a ZELTRON S.A.S. a usar mis datos para gestionar y entregar este pedido, según la{' '}
          <Link href="/privacidad" target="_blank" className="font-semibold text-[#0E1A3A] underline underline-offset-2">política de privacidad</Link> (Ley 1581 de 2012).
        </span>
      </label>
    </div>
  )
}

export const readDeliveryForm = (form: FormData) => {
  const field = (name: string) => String(form.get(name) ?? '')
  return {
    name: field('name'),
    phone: field('phone'),
    email: field('email'),
    department: field('department'),
    city: field('city'),
    neighborhood: field('neighborhood'),
    address: field('address'),
    notes: field('notes'),
    consent: form.get('consent') === 'on',
  }
}
