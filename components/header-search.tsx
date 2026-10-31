'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ArrowRight, Clock, Search, TrendingUp, X } from 'lucide-react'
import { formatCOP } from '@/lib/format'
import { searchItems, matchesQuery, normalize, type SearchItem } from '@/lib/search'
import { cn } from '@/lib/utils'

const RECENT_KEY = 'zx-recent-searches'
const MAX_RECENT = 5
const POPULAR = ['Celulares', 'Audífonos', 'Parlantes', 'Portátiles', 'Televisores', 'Cargadores']

function readRecent(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((v) => typeof v === 'string').slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

function saveRecent(term: string) {
  try {
    const next = [term, ...readRecent().filter((t) => normalize(t) !== normalize(term))].slice(0, MAX_RECENT)
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

type Option =
  | { kind: 'product'; key: string; href: string; item: SearchItem }
  | { kind: 'section'; key: string; href: string; label: string; hint: string }
  | { kind: 'term'; key: string; href: string; label: string; recent: boolean }
  | { kind: 'all'; key: string; href: string; label: string }

const resultsHref = (term: string) => `/productos?q=${encodeURIComponent(term)}`

export function HeaderSearch({ items, variant }: { items: SearchItem[]; variant: 'desktop' | 'mobile' }) {
  const router = useRouter()
  const listId = useId()
  const rootRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState<string[]>([])
  const term = query.trim()

  // Categorías y subcategorías que coinciden con lo escrito («audif» → Audífonos).
  const sections = useMemo(() => {
    const map = new Map<string, { label: string; hint: string; href: string; count: number }>()
    for (const item of items) {
      map.set(`s:${item.subcategory}`, {
        label: item.subcategory,
        hint: item.category,
        href: `/productos?categoria=${encodeURIComponent(item.category)}&subcategoria=${encodeURIComponent(item.subcategory)}`,
        count: (map.get(`s:${item.subcategory}`)?.count ?? 0) + 1,
      })
    }
    return [...map.values()]
  }, [items])

  const total = useMemo(() => (term ? searchItems(items, term).length : 0), [items, term])

  const options: Option[] = useMemo(() => {
    if (!term) {
      const recentOptions: Option[] = recent.map((t) => ({ kind: 'term', key: `r:${t}`, href: resultsHref(t), label: t, recent: true }))
      const popular: Option[] = POPULAR.filter((p) => !recent.some((r) => normalize(r) === normalize(p))).map((p) => ({ kind: 'term', key: `p:${p}`, href: resultsHref(p), label: p, recent: false }))
      return [...recentOptions, ...popular]
    }
    const matchedSections: Option[] = sections
      .filter((s) => matchesQuery({ name: s.label, brand: null, category: s.hint, subcategory: s.label }, term) && normalize(s.label).includes(normalize(term).split(' ')[0]))
      .slice(0, 3)
      .map((s) => ({ kind: 'section', key: `s:${s.label}`, href: s.href, label: s.label, hint: `${s.hint} · ${s.count} ${s.count === 1 ? 'producto' : 'productos'}` }))
    const products: Option[] = searchItems(items, term, 6).map((item) => ({ kind: 'product', key: `p:${item.id}`, href: `/producto/${item.slug}`, item }))
    return [...matchedSections, ...products, { kind: 'all', key: 'all', href: total ? resultsHref(term) : '/productos', label: term }]
  }, [term, recent, sections, items, total])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  function go(href: string, remember?: string) {
    if (remember) saveRecent(remember)
    setOpen(false)
    setActive(-1)
    inputRef.current?.blur()
    router.push(href)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const option = options[active]
    if (option) return go(option.href, option.kind === 'product' || option.kind === 'section' ? term || undefined : option.kind === 'all' ? term : option.label)
    if (term) go(resultsHref(term), term)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % Math.max(options.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1))
    } else if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  const showPanel = open && options.length > 0
  const activeId = active >= 0 && options[active] ? `${listId}-${active}` : undefined

  return (
    <form
      ref={rootRef}
      action="/productos"
      method="get"
      role="search"
      onSubmit={submit}
      className={cn('relative', variant === 'desktop' ? 'header-search' : 'mobile-search')}
    >
      <div className="relative w-full">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#5B6478]" />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1) }}
          onFocus={() => { setRecent(readRecent()); setOpen(true) }}
          onKeyDown={onKeyDown}
          aria-label="Buscar productos"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="¿Qué estás buscando?"
          className="input-light search-input w-full pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onClick={() => { setQuery(''); setActive(-1); inputRef.current?.focus() }}
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-[#5B6478] hover:bg-[#F3F5FA] hover:text-[#0E1A3A]"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute inset-x-0 top-[calc(100%+.5rem)] z-50 overflow-hidden rounded-2xl border border-[#DCE1EC] bg-white text-[#0E1A3A] shadow-[0_24px_60px_rgba(14,26,58,.22)] animate-in fade-in slide-in-from-top-1 duration-150">
          {!term && (
            <p className="px-4 pb-1 pt-3 text-[11px] font-semibold text-[#8A8C95]">
              {recent.length ? 'Búsquedas recientes y populares' : 'Lo más buscado'}
            </p>
          )}
          {term && total === 0 && (
            <div className="px-4 py-5 text-sm">
              <p className="font-semibold">No encontramos «{term}».</p>
              <p className="mt-1 text-xs text-[#5B6478]">Prueba con otra palabra, la marca o la categoría. También puedes preguntarnos por WhatsApp.</p>
            </div>
          )}
          <ul id={listId} role="listbox" aria-label="Sugerencias" className="max-h-[min(75vh,34rem)] overflow-y-auto p-1.5">
            {options.map((option, index) => {
              const selected = index === active
              const base = cn('flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition', selected ? 'bg-[#EAF0FF]' : 'hover:bg-[#F3F5FA]')
              const remember = option.kind === 'term' ? option.label : term || undefined
              return (
                <li key={option.key} id={`${listId}-${index}`} role="option" aria-selected={selected} onMouseEnter={() => setActive(index)}>
                  <Link
                    href={option.href}
                    onClick={(e) => { e.preventDefault(); go(option.href, remember) }}
                    className={base}
                  >
                    {option.kind === 'product' && (
                      <>
                        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F3F5FA]">
                          <img src={option.item.image} alt="" className="size-full object-contain" loading="lazy" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 font-semibold">{option.item.name}</span>
                          <span className="text-xs text-[#5B6478]">{option.item.subcategory}{option.item.inStock ? '' : ' · Agotado'}</span>
                        </span>
                        <span className="shrink-0 text-sm font-extrabold tabular-nums">{formatCOP(option.item.price)}</span>
                      </>
                    )}
                    {option.kind === 'section' && (
                      <>
                        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#FFF7DB] text-[#8A5A00]"><Search className="size-4" /></span>
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold">Ver {option.label}</span>
                          <span className="block text-xs text-[#5B6478]">{option.hint}</span>
                        </span>
                      </>
                    )}
                    {option.kind === 'term' && (
                      <>
                        {option.recent ? <Clock aria-hidden="true" className="size-4 text-[#8A8C95]" /> : <TrendingUp aria-hidden="true" className="size-4 text-[#2F5BFF]" />}
                        <span className="flex-1 font-medium">{option.label}</span>
                      </>
                    )}
                    {option.kind === 'all' && total > 0 && (
                      <span className="flex flex-1 items-center justify-between gap-3 font-bold text-[#2F5BFF]">
                        Ver {total === 1 ? 'el resultado' : `los ${total} resultados`} para «{option.label}»
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </span>
                    )}
                    {option.kind === 'all' && total === 0 && (
                      <span className="flex flex-1 items-center justify-between gap-3 font-bold text-[#2F5BFF]">
                        Ver todo el catálogo <ArrowRight aria-hidden="true" className="size-4" />
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </form>
  )
}
