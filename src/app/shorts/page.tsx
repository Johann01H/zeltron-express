import Link from 'next/link'
import { ArrowRight, Clapperboard } from 'lucide-react'
import { getShorts } from '@/lib/shorts'
import { ShortsGrid } from '@/components/shorts'

export const metadata = {
  title: 'Shorts | ZELTRON Express',
  description: 'Videos cortos de nuestros productos funcionando de verdad.',
}

export default async function ShortsPage() {
  const shorts = await getShorts()
  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <p className="eyebrow">Videos reales</p>
        <h1 className="mt-2 text-4xl sm:text-5xl">Míralo en acción</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#5B6478]">
          Así funcionan los productos antes de que lleguen a tu puerta. Toca un video para verlo en pantalla completa y desliza para ver el siguiente.
        </p>
        <div className="mt-10">
          {shorts.length > 0 ? (
            <ShortsGrid shorts={shorts} />
          ) : (
            <div className="grid place-items-center rounded-3xl border border-dashed border-[#DCE1EC] bg-white px-6 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-[#0E1A3A] text-[#FFC92E]"><Clapperboard className="size-6" /></span>
              <p className="mt-4 text-lg font-bold text-[#0E1A3A]">Muy pronto, videos de nuestros productos</p>
              <p className="mt-1 text-sm text-[#5B6478]">Mientras tanto, explora el catálogo.</p>
              <Link href="/productos" className="btn-primary mt-6">Ver productos <ArrowRight aria-hidden="true" className="size-4" /></Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
