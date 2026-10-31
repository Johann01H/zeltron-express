'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, Heart, LogOut, MapPin, PackageCheck, Settings, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { Customer } from '@/lib/auth'
import { formatCOP } from '@/lib/format'
import type { Product } from '@/lib/types'
import { useHydrated } from '@/lib/use-hydrated'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/store/favorites'
import { FavoritesContent } from '@/components/favorites-content'
import { AvatarEditor } from '@/components/profile/profile-avatar'
import { ProfileAddresses } from '@/components/profile/profile-addresses'
import { ProfileOrders } from '@/components/profile/profile-orders'
import { ProfileSettings } from '@/components/profile/profile-settings'

import type { ProfileTab } from '@/lib/profile-tabs'
export type { ProfileTab }

const NAV: { id: ProfileTab; label: string; Icon: LucideIcon }[] = [
  { id: 'pedidos', label: 'Mis pedidos', Icon: PackageCheck },
  { id: 'direcciones', label: 'Direcciones', Icon: MapPin },
  { id: 'favoritos', label: 'Favoritos', Icon: Heart },
  { id: 'configuracion', label: 'Configuración', Icon: Settings },
]

export function ProfileDashboard({ customer: initial, initialTab = 'pedidos', products }: { customer: Customer; initialTab?: ProfileTab; products: Product[] }) {
  const [customer, setCustomer] = useState(initial)
  const [tab, setTab] = useState<ProfileTab>(initialTab)
  const hydrated = useHydrated()
  const favoriteIds = useFavorites((state) => state.ids)
  const favoriteCount = hydrated ? products.filter((p) => favoriteIds.includes(p.id)).length : null

  const counts: Partial<Record<ProfileTab, number | null>> = {
    pedidos: customer.orderCount,
    direcciones: customer.addresses.length,
    favoritos: favoriteCount,
  }

  function go(next: ProfileTab) {
    setTab(next)
    // La pestaña queda en la URL para poder volver o compartir el enlace, sin recargar.
    window.history.replaceState(null, '', next === 'pedidos' ? '/perfil' : `/perfil?tab=${next}`)
    if (window.innerWidth < 1024) document.getElementById('profile-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-[70vh] bg-[#F3F5FA]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8 lg:py-10">
        <nav aria-label="Ruta de navegación" className="mb-5 flex items-center gap-1.5 text-xs text-[#5B6478]">
          <Link href="/" className="transition hover:text-[#2F5BFF]">Inicio</Link>
          <ChevronRight aria-hidden="true" className="size-3.5" />
          <span aria-current="page" className="font-semibold text-[#0E1A3A]">Mi cuenta</span>
        </nav>

        <div className="grid items-start gap-5 lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:gap-6">
          <aside className="overflow-hidden rounded-3xl border border-[#DCE1EC] bg-white shadow-[0_12px_32px_rgba(14,26,58,.06)] lg:sticky lg:top-6">
            <div className="relative h-24 overflow-hidden bg-[#0E1A3A]">
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(255,201,46,.45),transparent_45%),radial-gradient(circle_at_0%_100%,rgba(47,91,255,.45),transparent_50%)]" />
              <div aria-hidden="true" className="absolute inset-0 opacity-[.08] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            </div>
            <div className="-mt-14 flex flex-col items-center px-6 text-center">
              <AvatarEditor customer={customer} onChange={setCustomer} variant="sidebar" />
              <h1 className="mt-4 text-xl font-extrabold tracking-[-.04em] text-[#0E1A3A]">{customer.name}</h1>
              <p className="mt-0.5 max-w-full truncate text-sm text-[#5B6478]">{customer.email}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#EAF0FF] px-3 py-1 text-[11px] font-bold text-[#2F5BFF]">
                <ShieldCheck aria-hidden="true" className="size-3.5" /> Cliente desde {customer.memberSince}
              </span>
            </div>

            <dl className="mx-5 mt-5 grid grid-cols-2 overflow-hidden rounded-2xl bg-[#F3F5FA] text-center">
              <div className="px-3 py-3.5">
                <dt className="text-[11px] font-semibold text-[#5B6478]">Pedidos</dt>
                <dd className="mt-0.5 text-xl font-extrabold tabular-nums text-[#0E1A3A]">{customer.orderCount}</dd>
              </div>
              <div className="border-l border-[#DCE1EC] px-3 py-3.5">
                <dt className="text-[11px] font-semibold text-[#5B6478]">Total comprado</dt>
                <dd className="mt-0.5 text-base font-extrabold tabular-nums text-[#0E1A3A]">{formatCOP(customer.totalSpent)}</dd>
              </div>
            </dl>

            <nav aria-label="Secciones de mi cuenta" className="mt-4 flex gap-1.5 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-4 lg:pb-2">
              {NAV.map(({ id, label, Icon }) => {
                const active = tab === id
                const count = counts[id]
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => go(id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition lg:py-3',
                      active ? 'bg-[#EAF0FF] font-bold text-[#2F5BFF]' : 'text-[#0E1A3A] hover:bg-[#F3F5FA]',
                    )}
                  >
                    {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 hidden w-1 rounded-r-full bg-[#2F5BFF] lg:block" />}
                    <Icon aria-hidden="true" className={cn('size-[18px]', active ? 'text-[#2F5BFF]' : 'text-[#5B6478] group-hover:text-[#0E1A3A]')} />
                    <span className="whitespace-nowrap">{label}</span>
                    {typeof count === 'number' && count > 0 && (
                      <span className={cn('ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums', active ? 'bg-[#2F5BFF] text-white' : 'bg-[#F3F5FA] text-[#5B6478]')}>{count}</span>
                    )}
                  </button>
                )
              })}
            </nav>

            <form action="/api/cuenta/salir" method="post" className="hidden border-t border-[#EEF1F6] px-4 py-3 lg:block">
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#B42318] transition hover:bg-[#FFF1F0]">
                <LogOut aria-hidden="true" className="size-[18px]" /> Cerrar sesión
              </button>
            </form>
          </aside>

          <div id="profile-panel" className="min-w-0 scroll-mt-4 rounded-3xl border border-[#DCE1EC] bg-white p-5 shadow-[0_12px_32px_rgba(14,26,58,.06)] sm:p-7">
            {tab === 'pedidos' && <ProfileOrders orders={customer.orders} />}
            {tab === 'direcciones' && <ProfileAddresses customer={customer} onChange={setCustomer} />}
            {tab === 'favoritos' && <FavoritesContent products={products} />}
            {tab === 'configuracion' && <ProfileSettings customer={customer} onChange={setCustomer} />}
          </div>

          <form action="/api/cuenta/salir" method="post" className="lg:hidden">
            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F5C2BD] bg-white py-3 text-sm font-bold text-[#B42318]">
              <LogOut aria-hidden="true" className="size-4" /> Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
