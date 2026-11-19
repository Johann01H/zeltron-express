'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Banner } from '@/lib/banners'
import { cn } from '@/lib/utils'

/** Proporción típica de cada tamaño, por si WordPress no envía las medidas de la imagen. */
const FALLBACK_RATIO: Record<Banner['size'], number> = { large: 1200 / 940, tall: 600 / 940, small: 600 / 460, wide: 2400 / 450 }

function ratioOf(banner: Banner, mobile: boolean) {
  const [w, h] = mobile && banner.mobileImageUrl ? [banner.mobileWidth, banner.mobileHeight] : [banner.imageWidth, banner.imageHeight]
  return w && h ? w / h : FALLBACK_RATIO[banner.size]
}

/** Una diapositiva: un banner, o dos «Pequeño» seguidos apilados. */
type Cell = { banners: Banner[]; desktop: number[]; mobile: number[] }

const stackRatio = (r: number[]) => (r.length === 1 ? r[0] : 1 / r.reduce((s, x) => s + 1 / x, 0))

function buildCells(banners: Banner[]): Cell[] {
  const cells: Cell[] = []
  for (let i = 0; i < banners.length; i++) {
    const group = banners[i].size === 'small' && banners[i + 1]?.size === 'small' ? [banners[i], banners[++i]] : [banners[i]]
    cells.push({ banners: group, desktop: group.map((b) => ratioOf(b, false)), mobile: group.map((b) => ratioOf(b, true)) })
  }
  return cells
}

const TILE = 'promo-tile group relative block overflow-hidden rounded-2xl bg-[#E8ECF4] shadow-[0_10px_30px_rgba(14,26,58,.08)] outline-none ring-[#2F5BFF] ring-offset-2 focus-visible:ring-2'

function BannerLink({ banner, className, style, children }: { banner: Banner; className: string; style?: CSSProperties; children: ReactNode }) {
  if (!banner.href) return <div className={className} style={style}>{children}</div>
  if (/^https?:\/\//.test(banner.href)) {
    return <a href={banner.href} target="_blank" rel="noreferrer" className={className} style={style}>{children}</a>
  }
  return <Link href={banner.href} className={className} style={style} draggable={false}>{children}</Link>
}

function BannerImage({ banner, eager, fit }: { banner: Banner; eager: boolean; fit: 'contain' | 'cover' }) {
  return (
    <picture>
      {banner.mobileImageUrl && <source media="(max-width: 767px)" srcSet={banner.mobileImageUrl} />}
      <img
        src={banner.imageUrl}
        alt={banner.title}
        loading={eager ? 'eager' : 'lazy'}
        draggable={false}
        className={cn('absolute inset-0 size-full transition duration-500 group-hover:scale-[1.02]', fit === 'contain' ? 'object-contain' : 'object-cover')}
      />
    </picture>
  )
}

const AUTOPLAY_MS = 5000

/**
 * Slider de banners: mismas tarjetas del mosaico, imágenes completas (sin recortes) y todas a la misma altura.
 * Se ven 4 a la vez en computador y 2 en celular (o 1 para los «Ancho completo»), pasan solas cada 5 s
 * y se pueden deslizar con el dedo, con las flechas o con los puntos.
 */
export function BannerSlider({ banners, perView, eager, label }: { banners: Banner[]; perView: { mobile: number; desktop: number }; eager: boolean; label: string }) {
  const cells = buildCells(banners)
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  // Posiciones donde puede detenerse el slider (una por banner, sin pasarse del final).
  const [state, setState] = useState({ stops: [0], active: 0 })
  const avg = (key: 'desktop' | 'mobile') => cells.reduce((s, c) => s + stackRatio(c[key]), 0) / Math.max(cells.length, 1)
  // Si caben todos (ej. 3 banners en computador), ocupan el ancho completo como el mosaico, sin deslizar.
  const vars = {
    '--avg-d': avg('desktop'),
    '--avg-m': avg('mobile'),
    '--per-d': Math.min(perView.desktop, cells.length),
    '--per-m': Math.min(perView.mobile, cells.length),
  } as CSSProperties

  const measure = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const stops = max <= 4 ? [0] : [...new Set((([...el.children] as HTMLElement[]).map((c) => Math.min(c.offsetLeft - el.offsetLeft, max))).map(Math.round))]
    let active = 0
    stops.forEach((stop, i) => { if (Math.abs(stop - el.scrollLeft) < Math.abs(stops[active] - el.scrollLeft)) active = i })
    setState((prev) => (prev.active === active && prev.stops.join() === stops.join() ? prev : { stops, active }))
  }, [])

  useEffect(() => {
    measure()
    const el = trackRef.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  /** Avanza una diapositiva (y vuelve al inicio al llegar al final). */
  const step = useCallback((dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const stops = [...new Set((([...el.children] as HTMLElement[]).map((c) => Math.min(c.offsetLeft - el.offsetLeft, max))).map(Math.round))]
    const left = el.scrollLeft
    const target = dir === 1
      ? (left >= max - 4 ? 0 : stops.find((x) => x > left + 4) ?? max)
      : (left <= 4 ? max : [...stops].reverse().find((x) => x < left - 4) ?? 0)
    el.scrollTo({ left: target, behavior: 'smooth' })
  }, [])

  const scrollable = state.stops.length > 1

  useEffect(() => {
    if (!scrollable || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (!pausedRef.current && document.visibilityState === 'visible') step(1)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [scrollable, step])

  function hold() { pausedRef.current = true }
  function release() { pausedRef.current = false }
  function releaseLater() { window.setTimeout(release, AUTOPLAY_MS) }

  return (
    <div
      className="relative [--gap:.75rem] [--per:var(--per-m)] [--avg:var(--avg-m)] md:[--gap:1rem] md:[--per:var(--per-d)] md:[--avg:var(--avg-d)]"
      style={{ ...vars, containerType: 'inline-size' }}
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocus={hold}
      onBlur={release}
      onTouchStart={hold}
      onTouchEnd={releaseLater}
    >
      <div
        ref={trackRef}
        onScroll={measure}
        role="region"
        aria-roledescription="carrusel"
        aria-label={label}
        className="flex snap-x snap-mandatory gap-[var(--gap)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        // Altura común: el ancho visible repartido entre los que caben, según la proporción promedio.
        style={{ '--unit': 'calc((100cqw - (var(--per) - 1) * var(--gap)) / var(--per) / var(--avg))' } as CSSProperties}
      >
        {cells.map((cell, ci) => {
          const style = {
            '--rd': stackRatio(cell.desktop),
            '--rm': stackRatio(cell.mobile),
            width: 'calc(var(--unit) * var(--r))',
            height: 'var(--unit)',
          } as CSSProperties
          return (
            <div key={cell.banners[0].id} className="flex shrink-0 snap-start flex-col gap-[var(--gap)] [--r:var(--rm)] md:[--r:var(--rd)]" style={style}>
              {cell.banners.map((banner, bi) => (
                <BannerLink
                  key={banner.id}
                  banner={banner}
                  className={cn(TILE, 'min-h-0')}
                  // En una pila, cada banner ocupa la parte de la altura que pide su proporción.
                  style={{ flex: `${(1 / cell.desktop[bi]) / cell.desktop.reduce((sum, r) => sum + 1 / r, 0)} 1 0%` }}
                >
                  <BannerImage banner={banner} eager={eager && ci === 0} fit={cell.banners.length > 1 ? 'cover' : 'contain'} />
                </BannerLink>
              ))}
            </div>
          )
        })}
      </div>

      {scrollable && (
        <>
          <button type="button" onClick={() => step(-1)} aria-label="Banner anterior" className="absolute -left-4 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-[#DCE1EC] bg-white text-[#0E1A3A] shadow-lg transition hover:text-[#2F5BFF] lg:grid">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Siguiente banner" className="absolute -right-4 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-[#DCE1EC] bg-white text-[#0E1A3A] shadow-lg transition hover:text-[#2F5BFF] lg:grid">
            <ChevronRight className="size-5" />
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {state.stops.map((stop, i) => (
              <button
                key={stop}
                type="button"
                aria-label={`Ir al banner ${i + 1} de ${state.stops.length}`}
                aria-current={i === state.active}
                onClick={() => trackRef.current?.scrollTo({ left: stop, behavior: 'smooth' })}
                className={cn('h-2 rounded-full transition-all', i === state.active ? 'w-6 bg-[#2F5BFF]' : 'w-2 bg-[#C9CFDD] hover:bg-[#8A94AD]')}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
