import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { ProfileDashboard } from '@/components/profile-dashboard'
import { PROFILE_TABS, type ProfileTab } from '@/lib/profile-tabs'
import { getCurrentCustomer } from '@/lib/auth'
import { getProducts } from '@/lib/catalog'
import { PanelSkeleton } from '@/components/skeletons'

export const metadata: Metadata = {
  title: 'Mi cuenta | ZELTRON Express',
  description: 'Tus pedidos, direcciones, favoritos y datos en ZELTRON Express.',
  robots: { index: false },
}

async function Profile({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const [customer, params, products] = await Promise.all([getCurrentCustomer(), searchParams, getProducts()])
  // Sin sesión no hay perfil: se vuelve aquí después de iniciar sesión.
  if (!customer) redirect('/iniciar-sesion?next=/perfil')
  const requested = typeof params.tab === 'string' ? params.tab : ''
  const tab: ProfileTab = (PROFILE_TABS as readonly string[]).includes(requested) ? (requested as ProfileTab) : 'pedidos'
  return <ProfileDashboard key={tab} customer={customer} initialTab={tab} products={products} />
}

export default function ProfilePage({ searchParams }: PageProps<'/perfil'>) {
  return (
    <main>
      <Suspense fallback={<PanelSkeleton label="Cargando tu cuenta" />}>
        <Profile searchParams={searchParams as Promise<{ tab?: string | string[] }>} />
      </Suspense>
    </main>
  )
}
