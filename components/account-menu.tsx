'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Heart, LogIn, LogOut, PackageCheck, UserPlus, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HeaderAccount = { name: string; email: string } | null

const item = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0E1A3A] outline-none transition hover:bg-[#F4F6FB] focus-visible:bg-[#F4F6FB]'

export function AccountMenu({ account }: { account: HeaderAccount }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open])

  const close = () => setOpen(false)
  const firstName = account?.name.split(' ')[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn('flex items-center gap-1.5 rounded-lg p-1.5 text-white transition hover:text-[#FFC92E]', open && 'text-[#FFC92E]')}
      >
        <UserRound className="size-5" aria-hidden="true" />
        <span className="hidden text-xs font-semibold lg:inline">{account ? `Hola, ${firstName}` : 'Mi cuenta'}</span>
        <ChevronDown aria-hidden="true" className={cn('hidden size-3.5 transition lg:block', open && 'rotate-180')} />
        <span className="sr-only">Menú de cuenta</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="fixed inset-x-3 top-[7.25rem] z-50 origin-top-right sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+.75rem)] sm:w-72 animate-in fade-in zoom-in-95 rounded-2xl border border-[#DCE1EC] bg-white p-2 text-[#0E1A3A] shadow-[0_24px_60px_rgba(14,26,58,.22)] duration-150"
        >
          <span aria-hidden="true" className="absolute -top-1.5 right-5 hidden size-3 sm:block rotate-45 border-l border-t border-[#DCE1EC] bg-white" />
          {account ? (
            <>
              <div className="flex items-center gap-3 px-3 pb-3 pt-2">
                <span className="grid size-10 place-items-center rounded-full bg-[#0E1A3A] text-sm font-bold text-[#FFC92E]">{firstName?.[0]?.toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{account.name}</p>
                  <p className="truncate text-xs text-[#5B6478]">{account.email}</p>
                </div>
              </div>
              <div className="my-1 h-px bg-[#E6EAF2]" />
              <Link role="menuitem" href="/perfil" onClick={close} className={item}><UserRound className="size-4 text-[#2F5BFF]" />Mi perfil</Link>
              <Link role="menuitem" href="/perfil?tab=pedidos" onClick={close} className={item}><PackageCheck className="size-4 text-[#2F5BFF]" />Mis pedidos</Link>
              <Link role="menuitem" href="/favoritos" onClick={close} className={item}><Heart className="size-4 text-[#2F5BFF]" />Favoritos</Link>
              <div className="my-1 h-px bg-[#E6EAF2]" />
              <form action="/api/cuenta/salir" method="post">
                <button role="menuitem" type="submit" className={cn(item, 'w-full text-[#B42318] hover:bg-[#FFF1F0]')}><LogOut className="size-4" />Cerrar sesión</button>
              </form>
            </>
          ) : (
            <>
              <div className="px-3 pb-3 pt-2">
                <p className="text-sm font-bold">Bienvenido a ZELTRON</p>
                <p className="mt-0.5 text-xs leading-5 text-[#5B6478]">Sigue tus pedidos y guarda tus direcciones.</p>
              </div>
              <Link role="menuitem" href="/iniciar-sesion" onClick={close} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0E1A3A] text-sm font-bold text-white transition hover:bg-[#172B55]">
                <LogIn className="size-4 text-[#FFC92E]" />Iniciar sesión
              </Link>
              <Link role="menuitem" href="/registrarse" onClick={close} className="mt-2 flex h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE1EC] text-sm font-bold text-[#0E1A3A] transition hover:border-[#0E1A3A]">
                <UserPlus className="size-4" />Crear cuenta
              </Link>
              <Link role="menuitem" href="/rastrear" onClick={close} className={cn(item, 'mt-2 justify-center text-[#2F5BFF]')}><PackageCheck className="size-4" />Rastrear un pedido</Link>
              <p className="px-3 pb-1 pt-1 text-center text-[11px] text-[#8A8C95]">No necesitas cuenta para comprar.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
