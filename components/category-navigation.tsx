'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { Category } from '@/lib/types'

type CategoryNavigationProps = {
  variant: 'desktop' | 'mobile'
  categories: Category[]
  onNavigate?: () => void
}

function categoryHref(category: string) {
  return `/productos?categoria=${encodeURIComponent(category)}`
}

function subcategoryHref(category: string, subcategory: string) {
  return `${categoryHref(category)}&subcategoria=${encodeURIComponent(subcategory)}`
}

export function CategoryNavigation({ variant, categories, onNavigate }: CategoryNavigationProps) {
  if (variant === 'mobile') {
    return (
      <nav className="mobile-category-navigation" aria-label="Categorías de productos">
        <Link className="mobile-category-all" href="/productos" onClick={onNavigate}>
          Todos los productos
        </Link>
        {categories.map(({ name: category, subcategories }) => (
          <details key={category} name="mobile-category" className="mobile-category-group">
            <summary>
              <span>{category}</span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className="mobile-subcategory-list">
              <Link className="mobile-subcategory-parent" href={categoryHref(category)} onClick={onNavigate}>
                Ver todo {category}
              </Link>
              {subcategories.map((subcategory) => (
                <Link key={subcategory} href={subcategoryHref(category, subcategory)} onClick={onNavigate}>
                  {subcategory}
                </Link>
              ))}
            </div>
          </details>
        ))}
        <Link className="mobile-category-offers" href="/productos?oferta=true" onClick={onNavigate}>
          Ofertas de la semana
        </Link>
      </nav>
    )
  }

  return <DesktopNavigation categories={categories} />
}

/** Menú de escritorio: solo una categoría abierta a la vez; se cierra al elegir, al hacer clic fuera o con Escape. */
function DesktopNavigation({ categories }: { categories: Category[] }) {
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!openCategory) return
    const onPointer = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenCategory(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenCategory(null)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [openCategory])

  const close = () => setOpenCategory(null)

  return (
    <nav ref={navRef} className="category-nav" aria-label="Categorías de productos">
      <Link className="category-nav-all" href="/productos" onClick={close}>
        Todo
      </Link>
      {categories.map(({ name: category, subcategories }) => (
        <details key={category} className="category-menu" open={openCategory === category}>
          <summary
            className="category-menu-trigger"
            onClick={(event) => {
              event.preventDefault()
              setOpenCategory((current) => (current === category ? null : category))
            }}
          >
            <span>{category}</span>
            <ChevronDown aria-hidden="true" />
          </summary>
          <div className="category-menu-panel">
            <div className="category-menu-heading">
              <h3>{category}</h3>
              <span>{subcategories.length} {subcategories.length === 1 ? 'opción' : 'opciones'}</span>
            </div>
            <Link className="category-menu-parent" href={categoryHref(category)} onClick={close}>
              Ver todo {category} <ArrowRight aria-hidden="true" />
            </Link>
            <div className="category-menu-links">
              {subcategories.map((subcategory) => (
                <Link key={subcategory} href={subcategoryHref(category, subcategory)} onClick={close}>
                  {subcategory}
                </Link>
              ))}
            </div>
          </div>
        </details>
      ))}
      <Link className="category-nav-offers" href="/productos?oferta=true" onClick={close}>
        Ofertas
      </Link>
    </nav>
  )
}
