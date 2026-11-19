'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { formatCOP } from '@/lib/format'
import type { HeroSlide } from '@/lib/hero'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 7000

function SmartLink({ href, className, children, label }: { href: string; className: string; children: ReactNode; label?: string }) {
  if (/^https?:\/\//.test(href)) return <a href={href} target="_blank" rel="noreferrer" className={className} aria-label={label}>{children}</a>
  return <Link href={href} className={className} aria-label={label}>{children}</Link>
}

/** Tarjeta de envío con el producto destacado (el diseño de siempre). */
function ShipLabel({ slide }: { slide: HeroSlide }) {
  const p = slide.product
  if (!p) return null
  const onSale = p.compareAtPrice !== null && p.compareAtPrice > p.price
  return (
    <Link href={`/producto/${p.slug}`} className="ship-label group" aria-label={`Ver ${p.name}`}>
      <div className="ship-label-head">
        <span className="font-extrabold tracking-[-.04em]">ZELTRON <span className="text-[#0E1A3A]/60">Express</span></span>
        <span className="ship-label-tag">Contra entrega</span>
      </div>
      <div className="ship-label-body">
        <div className="ship-label-media">
          <img src={p.images[0]} alt="" className="size-full object-contain transition duration-500 group-hover:scale-105" />
        </div>
        <div className="min-w-0">
          {slide.cardLabel && <p className="text-xs font-semibold text-[#5B6478]">{slide.cardLabel}</p>}
          <h2 className="mt-1 text-xl leading-tight text-[#0E1A3A] sm:text-2xl">{p.name}</h2>
          <p className="mt-3 text-3xl font-extrabold tabular-nums text-[#0E1A3A]">{formatCOP(p.price)}</p>
          {onSale && <del className="text-sm text-[#5B6478]">{formatCOP(p.compareAtPrice!)}</del>}
        </div>
      </div>
      <dl className="ship-label-route">
        <div><dt>Pides</dt><dd>Hoy</dd></div>
        <div><dt>Llega en</dt><dd>3 a 7 días</dd></div>
        <div><dt>Pagas</dt><dd>Al recibir</dd></div>
      </dl>
      <div className="ship-label-foot">
        <span aria-hidden="true" className="ship-barcode" />
        <span className="inline-flex items-center gap-1 text-sm font-bold text-[#2F5BFF]">
          Ver producto <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

function SideImage({ slide, eager }: { slide: HeroSlide; eager: boolean }) {
  if (!slide.imageUrl) return null
  const img = (
    <img
      src={slide.imageUrl}
      alt={slide.title}
      width={slide.imageWidth ?? undefined}
      height={slide.imageHeight ?? undefined}
      loading={eager ? 'eager' : 'lazy'}
      className="mx-auto h-auto max-h-[30rem] w-auto max-w-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,.35)]"
    />
  )
  return slide.imageHref ? <SmartLink href={slide.imageHref} className="block transition hover:scale-[1.01]" label={slide.title}>{img}</SmartLink> : img
}

function FullImage({ slide, eager }: { slide: HeroSlide; eager: boolean }) {
  const picture = (
    <picture>
      {slide.fullMobileUrl && (
        <source media="(max-width: 767px)" srcSet={slide.fullMobileUrl} width={slide.fullMobileWidth ?? undefined} height={slide.fullMobileHeight ?? undefined} />
      )}
      <img
        src={slide.fullImageUrl!}
        alt={slide.title}
        width={slide.fullWidth ?? undefined}
        height={slide.fullHeight ?? undefined}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        className="block h-auto w-full"
      />
    </picture>
  )
  return slide.fullHref ? <SmartLink href={slide.fullHref} className="block" label={slide.title}>{picture}</SmartLink> : picture
}

function Slide({ slide, index, active, padBottom }: { slide: HeroSlide; index: number; active: boolean; padBottom: string }) {
  const Title = index === 0 ? 'h1' : 'h2'
  const shared = cn('transition-opacity duration-700 ease-out [grid-area:stack]', active ? 'opacity-100' : 'pointer-events-none opacity-0')
  const a11y = { 'aria-hidden': !active, inert: !active, role: 'group', 'aria-roledescription': 'diapositiva' } as const

  // Imagen completa: de borde a borde, sin recortes. Abajo queda la franja que tapa la barra de beneficios.
  if (slide.layout === 'image' && slide.fullImageUrl) {
    return (
      <div className={cn(shared, 'flex flex-col justify-center pb-[4.5rem]')} {...a11y}>
        {index === 0 && <h1 className="sr-only">{slide.title}</h1>}
        <FullImage slide={slide} eager={index === 0} />
      </div>
    )
  }

  const side = slide.card === 'image' ? <SideImage slide={slide} eager={index === 0} /> : slide.card === 'product' ? <ShipLabel slide={slide} /> : null
  return (
    <div className={shared} {...a11y}>
      <div className={cn('mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 lg:px-8 lg:pt-20', padBottom, side && 'lg:grid-cols-[1.1fr_.9fr]')}>
        <div>
          {slide.pill && (
            <p className="hero-pill">
              <span aria-hidden="true" className="hero-pill-dot" />
              {slide.pill}
            </p>
          )}
          <Title className="hero-title">{slide.title}</Title>
          {slide.description && <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">{slide.description}</p>}
          {(slide.primaryText || slide.secondaryText) && (
            <div className="mt-9 flex flex-wrap gap-3">
              {slide.primaryText && slide.primaryHref && (
                <SmartLink href={slide.primaryHref} className="btn-volt">
                  <Zap aria-hidden="true" className="size-4" /> {slide.primaryText}
                </SmartLink>
              )}
              {slide.secondaryText && slide.secondaryHref && (
                <SmartLink href={slide.secondaryHref} className="btn-ghost-light">{slide.secondaryText}</SmartLink>
              )}
            </div>
          )}
        </div>
        {side}
      </div>
    </div>
  )
}

/**
 * Portada del inicio. Con una sola diapositiva se ve exactamente como siempre;
 * con varias pasan solas cada 7 s (pausa al pasar el mouse o tocar), con puntos, flechas y deslizar.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0)
  const paused = useRef(false)
  const touchX = useRef<number | null>(null)
  const many = slides.length > 1

  const go = useCallback((i: number) => setActive((i + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (!many || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (!paused.current && document.visibilityState === 'visible') setActive((i) => (i + 1) % slides.length)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [many, slides.length])

  function hold() { paused.current = true }
  function release() { paused.current = false }
  function onTouchStart(e: TouchEvent) { hold(); touchX.current = e.touches[0].clientX }
  function onTouchEnd(e: TouchEvent) {
    const start = touchX.current
    touchX.current = null
    window.setTimeout(release, AUTOPLAY_MS)
    if (start === null) return
    const dx = e.changedTouches[0].clientX - start
    if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1))
  }

  // Con controles, las diapositivas de texto dejan sitio abajo para las flechas y los puntos.
  const padBottom = many ? 'pb-36' : 'pb-28 lg:pb-36'

  return (
    <div
      className="relative"
      role={many ? 'region' : undefined}
      aria-roledescription={many ? 'carrusel' : undefined}
      aria-label={many ? 'Portada' : undefined}
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocus={hold}
      onBlur={release}
      onTouchStart={many ? onTouchStart : undefined}
      onTouchEnd={many ? onTouchEnd : undefined}
    >
      {/* Todas las diapositivas ocupan la misma celda: la portada mide lo que la más alta y no salta al cambiar. */}
      <div className="grid [grid-template-areas:'stack']">
        {slides.map((slide, i) => <Slide key={slide.id} slide={slide} index={i} active={i === active} padBottom={padBottom} />)}
      </div>

      {many && (
        // Justo encima de la barra de beneficios, que se monta 4.5rem sobre la portada.
        <div className="absolute bottom-[5.25rem] left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#0E1A3A]/55 p-1.5 backdrop-blur-sm">
          <button type="button" onClick={() => go(active - 1)} aria-label="Diapositiva anterior" className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-[#FFC92E] hover:text-[#FFC92E]">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir a la diapositiva ${i + 1} de ${slides.length}`}
                aria-current={i === active}
                className={cn('h-2 rounded-full transition-all', i === active ? 'w-8 bg-[#FFC92E]' : 'w-2 bg-white/40 hover:bg-white/70')}
              />
            ))}
          </div>
          <button type="button" onClick={() => go(active + 1)} aria-label="Siguiente diapositiva" className="grid size-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-[#FFC92E] hover:text-[#FFC92E]">
            <ChevronRight className="size-5" />
          </button>
          <span className="sr-only" aria-live="polite">Diapositiva {active + 1} de {slides.length}</span>
        </div>
      )}
    </div>
  )
}
