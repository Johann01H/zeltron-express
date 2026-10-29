'use client'

import { Check, MessageCircle, PackageCheck, Truck, Home } from 'lucide-react'
import { deliveryWindow, ZONES } from '@/lib/shipping'
import { cn } from '@/lib/utils'

export type TimelineStep = 'recibido' | 'confirmacion' | 'despachado' | 'en-camino' | 'entregado'

const steps: { id: TimelineStep; title: string; text: string; Icon: typeof Check }[] = [
  { id: 'recibido', title: 'Pedido recibido', text: 'Ya tenemos tus datos.', Icon: Check },
  { id: 'confirmacion', title: 'Confirmación por WhatsApp', text: 'Te escribimos para confirmar dirección y horario.', Icon: MessageCircle },
  { id: 'despachado', title: 'Despachado', text: 'Te enviamos el número de guía.', Icon: PackageCheck },
  { id: 'en-camino', title: 'En camino', text: 'La transportadora lo lleva a tu dirección.', Icon: Truck },
  { id: 'entregado', title: 'Entregado', text: 'Pagas en efectivo al recibir.', Icon: Home },
]

export function OrderTimeline({ current, createdAt, zone }: { current: TimelineStep; createdAt: string; zone: 'express' | 'national' }) {
  const currentIndex = steps.findIndex((s) => s.id === current)
  const eta = deliveryWindow(ZONES[zone], new Date(createdAt))

  return (
    <div>
      <p className="mb-5 rounded-xl bg-[#EAF0FF] px-4 py-3 text-sm text-[#0E1A3A]">
        Entrega estimada entre el <strong>{eta.label}</strong>
      </p>
      <ol className="relative flex flex-col">
        {steps.map(({ id, title, text, Icon }, index) => {
          const done = index < currentIndex
          const active = index === currentIndex
          return (
            <li key={id} className="relative flex gap-4 pb-6 last:pb-0" aria-current={active ? 'step' : undefined}>
              {index < steps.length - 1 && (
                <span aria-hidden="true" className={cn('absolute left-[1.05rem] top-9 h-[calc(100%-2.25rem)] w-0.5', done ? 'bg-[#2F5BFF]' : 'bg-[#E6EAF2]')} />
              )}
              <span aria-hidden="true" className={cn('relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2',
                done && 'border-[#2F5BFF] bg-[#2F5BFF] text-white',
                active && 'border-[#FFC92E] bg-[#0E1A3A] text-[#FFC92E] ring-4 ring-[#FFC92E]/30',
                !done && !active && 'border-[#DCE1EC] bg-white text-[#9AA1B2]')}>
                {done ? <Check className="size-4" strokeWidth={3} /> : <Icon className="size-4" />}
              </span>
              <div className="pt-1.5">
                <p className={cn('text-sm font-bold', done || active ? 'text-[#0E1A3A]' : 'text-[#8A91A3]')}>
                  {title} {active && <span className="ml-1 rounded-full bg-[#FFC92E] px-2 py-0.5 text-[10px] font-extrabold text-[#0E1A3A]">Ahora</span>}
                </p>
                <p className="mt-0.5 text-xs text-[#5B6478]">{text}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
