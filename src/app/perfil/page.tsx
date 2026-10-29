import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { ProfileDashboard, type ProfileTab } from '@/components/profile-dashboard'
import { getCurrentCustomer } from '@/lib/auth'
import { PanelSkeleton } from '@/components/skeletons'

export const metadata: Metadata = {
  title: 'Mi perfil | ZELTRON Express',
  description: 'Consulta tus pedidos y direcciones en ZELTRON Express.',
  robots: { index: false },
}

const tabs: ProfileTab[] = ['resumen', 'direcciones', 'pedidos']

async function Profile({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const [customer, params] = await Promise.all([getCurrentCustomer(), searchParams])
  // Sin sesión no hay perfil: el acceso se hace desde el menú de cuenta del header.
  if (!customer) redirect('/iniciar-sesion')
  const tab = typeof params.tab === 'string' && tabs.includes(params.tab as ProfileTab) ? (params.tab as ProfileTab) : 'resumen'
  return <ProfileDashboard customer={customer} initialTab={tab} />
}

export default function ProfilePage({ searchParams }: PageProps<'/perfil'>) {
  return (
    <main>
      <Suspense fallback={<PanelSkeleton label="Cargando tu perfil" />}>
        <Profile searchParams={searchParams as Promise<{ tab?: string | string[] }>} />
      </Suspense>
    </main>
  )
}
