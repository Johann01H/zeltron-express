'use client'

import { Truck, Zap } from 'lucide-react'
import { deliveryWindow, ZONES, type DeliveryZone } from '@/lib/shipping'
import { useHydrated } from '@/lib/use-hydrated'
import { cn } from '@/lib/utils'

/** "Si pides hoy, llega entre ..." — se calcula en el navegador para usar la fecha real. */
export function DeliveryEstimate({ zone, compact = false, className }: { zone?: DeliveryZone; compact?: boolean; className?: string }) {
  const hydrated = useHydrated()
  const zones = zone ? [zone] : [ZONES.express, ZONES.national]

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {zones.map((z) => {
        const Icon = z.id === 'express' ? Zap : Truck
        return (
          <div key={z.id} className={cn('flex items-start gap-3 rounded-xl border border-[#DCE1EC] bg-white', compact ? 'p-2.5' : 'p-3.5')}>
            <span aria-hidden="true" className={cn('grid size-8 shrink-0 place-items-center rounded-lg', z.id === 'express' ? 'bg-[#FFC92E] text-[#0E1A3A]' : 'bg-[#0E1A3A] text-[#FFC92E]')}>
              <Icon className="size-4" />
            </span>
            <p className="text-sm leading-5 text-[#5B6478]">
              <strong className="block text-[#0E1A3A]">{z.id === 'express' ? 'En Cali y alrededores' : 'Resto del país'}</strong>
              {hydrated ? <>Si pides hoy, llega entre el <span className="font-semibold text-[#0E1A3A]">{deliveryWindow(z).label}</span></> : `${z.minDays} a ${z.maxDays} días hábiles`}
            </p>
          </div>
        )
      })}
    </div>
  )
}
