'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, MessageCircle, Pause, Play, Volume2, VolumeX, X } from 'lucide-react'
import { whatsappLink } from '@/lib/config'
import { formatCOP } from '@/lib/format'
import type { Short } from '@/lib/shorts'
import { cn } from '@/lib/utils'

/* ---------- Tarjeta (portada 9:16) ---------- */

function ShortCover({ short, playing }: { short: Short; playing: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const video = ref.current
    if (!video) return
    if (playing) video.play().catch(() => {})
    else { video.pause(); try { video.currentTime = 0.5 } catch { /* aún sin datos */ } }
  }, [playing])

  if (short.videoUrl) {
    return (
      <>
        {short.posterUrl && <img src={short.posterUrl} alt="" loading="lazy" className={cn('absolute inset-0 size-full object-cover transition-opacity', playing && 'opacity-0')} />}
        <video ref={ref} src={`${short.videoUrl}#t=0.5`} muted playsInline loop preload="metadata" className="absolute inset-0 -z-0 size-full object-cover" />
      </>
    )
  }
  return short.posterUrl ? <img src={short.posterUrl} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} className="absolute inset-0 size-full object-cover" /> : null
}

function ShortCard({ short, onOpen, className }: { short: Short; onOpen: () => void; className?: string }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Ver video: ${short.title}`}
      className={cn('group relative isolate aspect-[9/16] overflow-hidden rounded-2xl bg-[#0E1A3A] text-left text-white shadow-[0_10px_30px_rgba(14,26,58,.18)] outline-none ring-[#2F5BFF] ring-offset-2 transition hover:-translate-y-0.5 focus-visible:ring-2', className)}
    >
      <ShortCover short={short} playing={hover} />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0E1A3A]/95 via-[#0E1A3A]/15 to-transparent" />
      <span aria-hidden="true" className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/20 backdrop-blur-sm transition group-hover:scale-110 group-hover:opacity-0">
        <Play className="ml-0.5 size-5 fill-white" />
      </span>
      <span className="absolute inset-x-0 bottom-0 p-3">
        <span className="line-clamp-2 text-sm font-bold leading-snug">{short.caption || short.title}</span>
        {short.product && (
          <span className="mt-2 inline-flex items-center rounded-full bg-[#FFC92E] px-2 py-0.5 text-xs font-extrabold tabular-nums text-[#0E1A3A]">
            {formatCOP(short.product.price)}
          </span>
        )}
      </span>
    </button>
  )
}

/* ---------- Visor a pantalla completa ---------- */

function ShortsViewer({ shorts, index, onIndex, onClose }: { shorts: Short[]; index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const short = shorts[index]
  const videoRef = useRef<HTMLVideoElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchY = useRef<number | null>(null)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  const go = useCallback((delta: number) => {
    const next = index + delta
    if (next < 0 || next >= shorts.length) return
    setPaused(false)
    setProgress(0)
    onIndex(next)
  }, [index, shorts.length, onIndex])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => { document.body.style.overflow = overflow; previous?.focus?.() }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go(1) }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
      else if (e.key === 'm') setMuted((m) => !m)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) { video.play().catch(() => {}); setPaused(false) } else { video.pause(); setPaused(true) }
  }

  function onTouchEnd(e: TouchEvent) {
    if (touchY.current === null) return
    const dy = e.changedTouches[0].clientY - touchY.current
    touchY.current = null
    if (Math.abs(dy) > 60) go(dy < 0 ? 1 : -1)
  }

  if (!short) return null
  const product = short.product

  // Portal al <body>: así el visor queda por encima del header fijo y del botón de WhatsApp.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={short.title} className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050A18]/95 animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="relative h-[100dvh] w-full max-w-[min(100vw,calc(100dvh*9/16))] overflow-hidden bg-black sm:h-[min(92dvh,52rem)] sm:max-w-[calc(min(92dvh,52rem)*9/16)] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { touchY.current = e.touches[0].clientY }}
        onTouchEnd={onTouchEnd}
      >
        {short.videoUrl ? (
          <video
            key={short.id}
            ref={videoRef}
            src={short.videoUrl}
            poster={short.posterUrl ?? undefined}
            autoPlay
            muted={muted}
            playsInline
            loop
            onClick={togglePlay}
            onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
            className="size-full cursor-pointer object-cover"
          />
        ) : short.youtubeId ? (
          <iframe
            key={short.id}
            src={`https://www.youtube-nocookie.com/embed/${short.youtubeId}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${short.youtubeId}&rel=0&modestbranding=1`}
            title={short.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="size-full border-0"
          />
        ) : null}

        {/* Barras de avance: una por video */}
        <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1">
          {shorts.map((s, i) => (
            <span key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <span className="block h-full bg-white" style={{ width: i < index ? '100%' : i === index ? `${(short.videoUrl ? progress : 1) * 100}%` : '0%' }} />
            </span>
          ))}
        </div>

        <div className="absolute inset-x-3 top-6 flex items-center justify-between">
          <span className="rounded-full bg-black/35 px-2.5 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur">{index + 1} / {shorts.length}</span>
          <div className="flex gap-2">
            {short.videoUrl && (
              <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Activar sonido' : 'Silenciar'} className="grid size-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55">
                {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
            )}
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar" className="grid size-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55">
              <X className="size-5" />
            </button>
          </div>
        </div>

        {paused && short.videoUrl && (
          <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white backdrop-blur">
            <Pause className="size-7 fill-white" />
          </span>
        )}

        <div className={cn('absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-16 text-white', short.youtubeId && 'pointer-events-none [&_a]:pointer-events-auto')}>
          {short.caption && <p className="mb-3 text-sm font-semibold leading-snug">{short.caption}</p>}
          {product ? (
            <div className="rounded-2xl bg-white p-2.5 text-[#0E1A3A] shadow-xl">
              <Link href={`/producto/${product.slug}`} onClick={onClose} className="flex items-center gap-3">
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F3F5FA]">
                  <img src={product.image} alt="" className="size-full object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-bold">{product.name}</span>
                  <span className="flex items-baseline gap-2">
                    <strong className="font-extrabold tabular-nums">{formatCOP(product.price)}</strong>
                    {product.compareAtPrice && <del className="text-xs text-[#5B6478]">{formatCOP(product.compareAtPrice)}</del>}
                    {!product.inStock && <span className="text-xs font-semibold text-[#B42318]">Agotado</span>}
                  </span>
                </span>
              </Link>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <Link href={`/producto/${product.slug}`} onClick={onClose} className="inline-flex items-center justify-center rounded-xl bg-[#2F5BFF] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#244be0]">
                  Ver producto
                </Link>
                <a
                  href={whatsappLink(`Hola, vi el video de ${product.name} (${formatCOP(product.price)}) y quiero más información.`)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Preguntar por WhatsApp"
                  className="grid size-11 place-items-center rounded-xl bg-[#16A34A] text-white hover:bg-[#12843d]"
                >
                  <MessageCircle className="size-5" />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-base font-bold">{short.title}</p>
          )}
        </div>
      </div>

      {/* Navegación en escritorio */}
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 sm:flex" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => go(-1)} disabled={index === 0} aria-label="Video anterior" className="grid size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30">
          <ChevronUp className="size-6" />
        </button>
        <button type="button" onClick={() => go(1)} disabled={index === shorts.length - 1} aria-label="Siguiente video" className="grid size-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30">
          <ChevronDown className="size-6" />
        </button>
      </div>
    </div>,
    document.body,
  )
}

/* ---------- Secciones ---------- */

function useViewer() {
  const [open, setOpen] = useState<number | null>(null)
  return { open, setOpen, close: useCallback(() => setOpen(null), []) }
}

/** Fila horizontal deslizable (inicio y página de producto). */
export function ShortsShelf({ shorts }: { shorts: Short[] }) {
  const { open, setOpen, close } = useViewer()
  if (shorts.length === 0) return null
  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
        {shorts.map((short, i) => (
          <ShortCard key={short.id} short={short} onOpen={() => setOpen(i)} className="w-[42vw] max-w-[13.5rem] shrink-0 snap-start sm:w-52" />
        ))}
      </div>
      {open !== null && <ShortsViewer shorts={shorts} index={open} onIndex={setOpen} onClose={close} />}
    </>
  )
}

/** Cuadrícula de la página /shorts. */
export function ShortsGrid({ shorts }: { shorts: Short[] }) {
  const { open, setOpen, close } = useViewer()
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shorts.map((short, i) => <ShortCard key={short.id} short={short} onOpen={() => setOpen(i)} />)}
      </div>
      {open !== null && <ShortsViewer shorts={shorts} index={open} onIndex={setOpen} onClose={close} />}
    </>
  )
}
