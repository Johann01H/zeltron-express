'use client'

import Link from 'next/link'
import { CalendarDays, Home, Mail, MapPin, PackageCheck, Phone, UserRound, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCOP } from '@/lib/format'
import type { Customer } from '@/lib/auth'

export type ProfileTab = 'resumen' | 'direcciones' | 'pedidos'

export function ProfileDashboard({ customer, initialTab = 'resumen' }: { customer: Customer; initialTab?: ProfileTab }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
      <nav aria-label="Ruta de navegación" className="mb-5 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="transition hover:text-primary">Inicio</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Mi cuenta</span>
      </nav>
      <SignedInProfile customer={customer} initialTab={initialTab} />
    </section>
  )
}

function SignedInProfile({ customer, initialTab }: { customer: Customer; initialTab: ProfileTab }) {
  const primary = customer.addresses.find((a) => a.isPrimary) ?? customer.addresses[0]
  return (
    <>
      <div className="rounded-[1.75rem] bg-tinta p-6 text-white sm:p-8 lg:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#FFC92E]">Mi cuenta · ZELTRON Express</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-.06em] text-white sm:text-4xl">¡Hola, {customer.name.split(' ')[0]}!</h1>
        <p className="mt-3 text-xs text-white/65">Cliente desde {customer.memberSince}</p>
      </div>
      <Tabs defaultValue={initialTab} className="mt-8 w-full">
        <TabsList variant="line" className="w-full max-w-full justify-start gap-1 overflow-x-auto p-0">
          <TabsTrigger value="resumen" className="h-10 min-w-max px-3"><UserRound data-icon="inline-start" />Resumen</TabsTrigger>
          <TabsTrigger value="direcciones" className="h-10 min-w-max px-3"><MapPin data-icon="inline-start" />Direcciones</TabsTrigger>
          <TabsTrigger value="pedidos" className="h-10 min-w-max px-3"><PackageCheck data-icon="inline-start" />Mis pedidos</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen" className="mt-6 grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle><h2 className="text-lg font-bold">Datos personales</h2></CardTitle></CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <Fact icon={UserRound} label="Nombre" value={customer.name} />
                <Fact icon={Mail} label="Correo" value={customer.email} />
                <Fact icon={Phone} label="Celular" value={customer.phone || '—'} />
                <Fact icon={CalendarDays} label="Cliente desde" value={customer.memberSince} />
              </dl>
            </CardContent>
          </Card>
          {primary && (
            <Card>
              <CardHeader><CardTitle><h2 className="text-lg font-bold">Dirección principal</h2></CardTitle></CardHeader>
              <CardContent className="flex items-start gap-3">
                <Home aria-hidden="true" className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{primary.street}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{primary.city}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="direcciones" className="mt-6 grid gap-4 md:grid-cols-2">
          {customer.addresses.length === 0 && <p className="text-sm text-muted-foreground">No tienes direcciones guardadas.</p>}
          {customer.addresses.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><h3 className="text-base font-bold">{a.label}</h3>{a.isPrimary && <Badge variant="secondary">Principal</Badge>}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-semibold">{a.recipient}</p>
                <p>{a.street}</p>
                <p className="text-muted-foreground">{a.city}</p>
                {a.notes && <p className="mt-2 text-xs text-muted-foreground">{a.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="pedidos" className="mt-6 flex flex-col gap-3">
          {customer.orders.length === 0 && <p className="text-sm text-muted-foreground">Aún no tienes pedidos.</p>}
          {customer.orders.map((o) => (
            <div key={o.number} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div>
                <p className="text-sm font-semibold">{o.number}</p>
                <p className="text-xs text-muted-foreground">{o.date} · {o.itemCount} productos</p>
              </div>
              <div className="text-right">
                <Badge variant="secondary">{o.status}</Badge>
                <p className="mt-1 text-sm font-bold tabular-nums">{formatCOP(o.total)}</p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </>
  )
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon aria-hidden="true" className="mt-0.5 size-4 text-primary" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-semibold">{value}</dd>
      </div>
    </div>
  )
}
