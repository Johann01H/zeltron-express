'use client'

import Link from 'next/link'
import { useState, useTransition, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Check, CreditCard, Eye, EyeOff, LockKeyhole, MessageCircle, Truck } from 'lucide-react'
import { whatsappLink, COMPANY_NAME } from '@/lib/config'
import { formatCOP } from '@/lib/format'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { signIn, signUp } from '@/lib/account-actions'

type AccountFormMode = 'sign-in' | 'sign-up'

const benefits = [
  { Icon: CreditCard, title: 'Pago contra entrega', text: 'Pagas cuando recibes' },
  { Icon: Truck, title: 'Entrega de 3 a 7 días', text: 'Seguimiento de tu pedido' },
  { Icon: MessageCircle, title: 'Soporte humano', text: 'Te atendemos por WhatsApp' },
]

export function AccountForm({ mode, showcase }: { mode: AccountFormMode; showcase: Product[] }) {
  const isSignUp = mode === 'sign-up'

  return (
    <div className="grid min-h-dvh bg-[#F3F5FA] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <BrandPanel isSignUp={isSignUp} showcase={showcase} />
      <main className="flex flex-col px-5 py-6 sm:px-10 lg:px-14 lg:py-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B6478] transition hover:text-[#0E1A3A]">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver a la tienda
          </Link>
          <a href={whatsappLink('Hola, necesito ayuda con mi cuenta.')} target="_blank" rel="noreferrer" className="text-sm text-[#5B6478] transition hover:text-[#0E1A3A]">
            ¿Necesitas ayuda? <span className="font-semibold text-[#167A53]">WhatsApp</span>
          </a>
        </div>

        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">
          <ModeSwitch isSignUp={isSignUp} />
          <AuthForm key={mode} isSignUp={isSignUp} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#8A8C95]">
          <span>© {COMPANY_NAME}</span>
          <Link href="/terminos" className="hover:text-[#0E1A3A]">Términos</Link>
          <Link href="/privacidad" className="hover:text-[#0E1A3A]">Privacidad</Link>
        </div>
      </main>
    </div>
  )
}

function BrandPanel({ isSignUp, showcase }: { isSignUp: boolean; showcase: Product[] }) {
  const [main, ...rest] = showcase
  return (
    <aside className="relative isolate overflow-hidden bg-[#0E1A3A] px-5 py-6 text-white sm:px-10 lg:flex lg:min-h-dvh lg:flex-col lg:justify-between lg:p-12 xl:p-14">
      {/* Fondo: brillo cálido, retícula de puntos y órbitas */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_88%_8%,rgba(255,201,46,.32),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(47,91,255,.28),transparent_42%)]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
      <div aria-hidden="true" className="absolute -right-40 top-1/3 -z-10 hidden size-[34rem] rounded-full border border-white/10 lg:block" />
      <div aria-hidden="true" className="absolute -right-20 top-[42%] -z-10 hidden size-[22rem] rounded-full border border-white/[.07] lg:block" />

      <Link href="/" className="logo inline-block">ZELTRON <span>Express</span></Link>
      <p className="mt-3 text-2xl font-extrabold leading-tight tracking-[-.05em] text-white lg:hidden">
        Tecnología que llega <span className="text-[#FFC92E]">a tu puerta.</span>
      </p>

      <div className="hidden lg:block">
        <p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#FFC92E]">
          {isSignUp ? 'Únete a ZELTRON' : 'Qué bueno verte de nuevo'}
        </p>
        <h2 className="mt-4 max-w-md text-5xl font-extrabold leading-[.98] tracking-[-.06em] text-white xl:text-6xl">
          Tecnología que llega <span className="text-[#FFC92E]">a tu puerta.</span>
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
          {isSignUp
            ? 'Crea tu cuenta para seguir tus pedidos y guardar tus direcciones de entrega.'
            : 'Entra para revisar tus pedidos, tus direcciones y tus productos favoritos.'}
        </p>

        {main && (
          <div className="relative mt-12 h-[19rem] max-w-lg">
            <ShowcaseCard product={main} className="absolute left-0 top-4 z-20 w-56 -rotate-3" large />
            {rest[0] && <ShowcaseCard product={rest[0]} className="absolute left-[15rem] top-0 z-10 w-44 rotate-3" />}
            {rest[1] && <ShowcaseCard product={rest[1]} className="absolute left-[16.5rem] top-[10.5rem] z-30 w-44 -rotate-2" />}
          </div>
        )}
      </div>

      <ul className="mt-6 hidden gap-3 lg:grid lg:grid-cols-3">
        {benefits.map(({ Icon, title, text }) => (
          <li key={title} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 backdrop-blur-sm">
            <Icon aria-hidden="true" className="size-5 text-[#FFC92E]" />
            <p className="mt-3 text-sm font-bold">{title}</p>
            <p className="mt-0.5 text-xs text-white/60">{text}</p>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function ShowcaseCard({ product, className, large = false }: { product: Product; className?: string; large?: boolean }) {
  return (
    <div className={cn('rounded-2xl bg-white p-3 text-[#0E1A3A] shadow-[0_24px_60px_rgba(0,0,0,.35)] transition duration-500 hover:rotate-0', className)}>
      <div className={cn('grid place-items-center rounded-xl bg-[#F4F6FB]', large ? 'h-40' : 'h-24')}>
        <img src={product.images[0]} alt="" className="size-[85%] object-contain" />
      </div>
      <p className="mt-3 truncate text-xs font-semibold">{product.name}</p>
      <p className="mt-1 text-sm font-extrabold tabular-nums">{formatCOP(product.price)}</p>
    </div>
  )
}

function ModeSwitch({ isSignUp }: { isSignUp: boolean }) {
  const tab = 'flex-1 rounded-full py-2.5 text-center text-sm font-semibold transition'
  return (
    <nav aria-label="Tipo de acceso" className="flex rounded-full bg-[#E6EAF2] p-1">
      <Link href="/iniciar-sesion" aria-current={!isSignUp ? 'page' : undefined} className={cn(tab, !isSignUp ? 'bg-white text-[#0E1A3A] shadow-sm' : 'text-[#6B6E78] hover:text-[#0E1A3A]')}>
        Iniciar sesión
      </Link>
      <Link href="/registrarse" aria-current={isSignUp ? 'page' : undefined} className={cn(tab, isSignUp ? 'bg-white text-[#0E1A3A] shadow-sm' : 'text-[#6B6E78] hover:text-[#0E1A3A]')}>
        Crear cuenta
      </Link>
    </nav>
  )
}

const inputClass =
  'h-12 w-full rounded-xl border border-[#DCE1EC] bg-white px-4 text-sm text-[#0E1A3A] placeholder:text-[#9A9CA5] outline-none transition focus:border-[#2F5BFF] focus:ring-4 focus:ring-[#2F5BFF]/12'

function TextField({ label, hint, id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-[#353946]">
        {label} {hint && <span className="font-normal text-[#8A8C95]">{hint}</span>}
      </label>
      <input id={id} className={inputClass} {...props} />
    </div>
  )
}

function passwordScore(value: string) {
  return [value.length >= 8, /[A-Z]/.test(value) && /[a-z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length
}

function AuthForm({ isSignUp }: { isSignUp: boolean }) {
  const [visible, setVisible] = useState(false)
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, startTransition] = useTransition()
  const score = passwordScore(password)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await (isSignUp ? signUp(formData) : signIn(formData))
      setNotice(result.message)
    })
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h1 className="mt-9 text-3xl font-extrabold tracking-[-.06em] text-[#0E1A3A] sm:text-4xl">
        {isSignUp ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#656A76]">
        {isSignUp ? 'Solo te tomará un minuto.' : 'Ingresa con tu correo y contraseña.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {isSignUp && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField id="name" name="name" label="Nombre completo" autoComplete="name" placeholder="María Fernanda" required />
            <TextField id="phone" name="phone" label="Celular" hint="(opcional)" type="tel" inputMode="tel" autoComplete="tel" placeholder="300 000 0000" />
          </div>
        )}
        <TextField id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@correo.com" required />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-semibold text-[#353946]">Contraseña</label>
            {!isSignUp && (
              <button type="button" className="text-xs font-semibold text-[#2F5BFF] hover:underline" onClick={() => setNotice('Para recuperar tu acceso escríbenos por WhatsApp mientras habilitamos esta opción.')}>
                ¿La olvidaste?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={visible ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder={isSignUp ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputClass, 'pr-12')}
            />
            <button
              type="button"
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={visible}
              onClick={() => setVisible((v) => !v)}
              className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#737681] transition hover:bg-[#F4F6FB] hover:text-[#0E1A3A]"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {isSignUp && password && (
            <div className="mt-1 flex items-center gap-2" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={cn('h-1 flex-1 rounded-full transition', i < score ? (score <= 1 ? 'bg-[#B42318]' : score === 2 ? 'bg-[#FFC92E]' : 'bg-[#167A53]') : 'bg-[#DCE1EC]')} />
                ))}
              </div>
              <span className="text-[11px] text-[#6B6E78]">{['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'][score]}</span>
            </div>
          )}
        </div>

        {isSignUp && (
          <TextField id="confirm-password" name="confirmPassword" label="Confirmar contraseña" type="password" autoComplete="new-password" placeholder="Repite tu contraseña" minLength={8} required />
        )}

        <label className="flex items-start gap-2.5 text-xs leading-5 text-[#656A76]">
          <input name={isSignUp ? 'acceptTerms' : 'remember'} type="checkbox" required={isSignUp} className="peer sr-only" />
          <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded border border-[#C9D0DE] bg-white text-transparent transition peer-checked:border-[#0E1A3A] peer-checked:bg-[#0E1A3A] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#2F5BFF]">
            <Check className="size-3" strokeWidth={3} />
          </span>
          {isSignUp ? (
            <span>
              Acepto los <Link href="/terminos" className="font-semibold text-[#0E1A3A] underline underline-offset-2">términos</Link> y la{' '}
              <Link href="/privacidad" className="font-semibold text-[#0E1A3A] underline underline-offset-2">política de privacidad</Link>.
            </span>
          ) : (
            <span>Mantener mi sesión iniciada</span>
          )}
        </label>

        <button
          type="submit"
          disabled={pending}
          className="group mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0E1A3A] text-sm font-bold text-white shadow-[0_10px_30px_rgba(14,26,58,.25)] transition hover:bg-[#172B55] disabled:opacity-70"
        >
          {pending ? 'Un momento…' : isSignUp ? 'Crear mi cuenta' : 'Iniciar sesión'}
          <ArrowRight aria-hidden="true" className="size-4 text-[#FFC92E] transition group-hover:translate-x-0.5" />
        </button>

        {notice && (
          <p role="status" className="rounded-xl border border-[#F3DE9A] bg-[#FFF9E6] px-4 py-3 text-xs leading-5 text-[#6B4E00]">{notice}</p>
        )}
      </form>

      <div className="my-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.14em] text-[#9A9CA5]">
        <span className="h-px flex-1 bg-[#DCE1EC]" /> o <span className="h-px flex-1 bg-[#DCE1EC]" />
      </div>

      <Link href="/productos" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#DCE1EC] bg-white text-sm font-semibold text-[#0E1A3A] transition hover:border-[#0E1A3A]">
        Comprar sin cuenta
      </Link>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#8A8C95]">
        <LockKeyhole aria-hidden="true" className="size-3" />
        Tus datos se usan solo para gestionar tus pedidos.
      </p>
    </div>
  )
}
