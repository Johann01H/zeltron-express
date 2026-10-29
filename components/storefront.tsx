'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Heart, Menu, MessageCircle, Minus, Plus, Search, ShoppingCart, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryNavigation } from '@/components/category-navigation'
import { AccountMenu, type HeaderAccount } from '@/components/account-menu'
import { FavoriteButton } from '@/components/favorite-button'
import { FREE_SHIPPING_FROM, whatsappLink } from '@/lib/config'
import { discount, formatCOP, isOnSale } from '@/lib/format'
import type { CartItem, Category, Product } from '@/lib/types'
import { useHydrated } from '@/lib/use-hydrated'
import { cartCount, cartSubtotal, useCart } from '@/store/cart'
import { useFavorites } from '@/store/favorites'

const announcements = [
  `Envío gratis desde ${formatCOP(FREE_SHIPPING_FROM)}`,
  'Pago contra entrega',
  'Retracto de 5 días hábiles',
]

function CountBadge({ value }: { value: number }) {
  if (value <= 0) return null
  return (
    <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#FFC92E] text-[11px] font-bold text-[#0E1A3A]">
      {value}
    </span>
  )
}

export function Header({ categories, account }: { categories: Category[]; account: HeaderAccount }) {
  const hydrated = useHydrated()
  const items = useCart((s) => s.items)
  const favoritesCount = useFavorites((s) => s.ids.length)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(0)
  const count = hydrated ? cartCount(items) : 0
  const total = hydrated ? cartSubtotal(items) : 0

  useEffect(() => {
    const id = window.setInterval(() => setMessage((v) => (v + 1) % announcements.length), 4000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <>
      <div className="announcement" aria-live="polite">{announcements[message]}</div>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0E1A3A] shadow-lg">
        <div className="header-main">
          <Button variant="ghost" size="icon" className="text-white lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </Button>
          <Link href="/" className="logo">ZELTRON <span>Express</span></Link>
          <form action="/productos" method="get" role="search" className="header-search">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6478]" />
            <input type="search" name="q" aria-label="Buscar productos" placeholder="¿Qué estás buscando?" className="input-light w-full pl-10" />
          </form>
          <Link href="/rastrear" className="hidden text-sm text-white transition hover:text-[#FFC92E] lg:block">Rastrear pedido</Link>
          <a href={whatsappLink()} target="_blank" rel="noreferrer" className="hidden text-sm text-white transition hover:text-[#FFC92E] xl:block">Ayuda</a>
          <AccountMenu account={account} />
          <Link href="/favoritos" className="relative flex items-center gap-1.5 rounded-lg p-1.5 text-white transition hover:text-[#FFC92E]" aria-label={`Favoritos (${hydrated ? favoritesCount : 0})`}>
            <Heart className="size-5" />
            <span className="hidden text-xs font-semibold lg:inline">Favoritos</span>
            <CountBadge value={hydrated ? favoritesCount : 0} />
          </Link>
          <Link href="/carrito" className="relative flex items-center gap-1.5 rounded-lg p-2 text-white" aria-label={`Carrito (${count} productos)`}>
            <ShoppingCart />
            <CountBadge value={count} />
            {total > 0 && <span className="hidden text-xs lg:inline">{formatCOP(total)}</span>}
          </Link>
        </div>
        <form action="/productos" method="get" role="search" className="mobile-search">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6478]" />
            <input type="search" name="q" aria-label="Buscar productos" placeholder="¿Qué estás buscando?" className="input-light search-input w-full pl-10" />
          </div>
        </form>
        <CategoryNavigation variant="desktop" categories={categories} />
        {open && (
          <div className="mobile-navigation border-t border-white/10 p-4 lg:hidden">
            <CategoryNavigation variant="mobile" categories={categories} onNavigate={() => setOpen(false)} />
            <Link href="/rastrear" className="mobile-navigation-help" onClick={() => setOpen(false)}>Rastrear pedido</Link>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="mobile-navigation-help" onClick={() => setOpen(false)}>
              Ayuda por WhatsApp
            </a>
          </div>
        )}
      </header>
    </>
  )
}

export function WhatsApp({ product }: { product?: Product }) {
  const message = product
    ? `Hola, estoy interesado en ${product.name} por ${formatCOP(product.price)}.`
    : 'Hola, quiero conocer las ofertas de ZELTRON Express.'
  return (
    <a
      aria-label="Escribir por WhatsApp"
      href={whatsappLink(message)}
      target="_blank"
      rel="noreferrer"
      className={`whatsapp-float ${product ? 'product-whatsapp' : ''} grid size-14 place-items-center rounded-full bg-[#16A34A] text-white shadow-xl`}
    >
      <MessageCircle />
    </a>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.addItem)
  const outOfStock = product.stock <= 0
  return (
    <article className="product-card group relative">
      <Link href={`/producto/${product.slug}`}>
        <div className="product-image relative aspect-square bg-[#F4F6FB] p-5">
          <img src={product.images[0]} alt={product.name} loading="lazy" className="size-full object-contain transition duration-200 group-hover:scale-105" />
          {isOnSale(product) && (
            <span className="absolute left-3 top-3 rounded-full bg-[#FFC92E] px-2 py-1 text-xs font-bold text-[#0E1A3A]">-{discount(product)}%</span>
          )}
        </div>
        <div className="p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            {product.brand && <p className="truncate text-[10px] font-bold uppercase tracking-[.12em] text-[#2F5BFF]">{product.brand}</p>}
            {product.freeShipping && <span className="ml-auto shrink-0 text-[10px] font-semibold text-[#167A53]">Envío gratis</span>}
          </div>
          <p className="text-[11px] text-[#5B6478]">
            {product.category} <span aria-hidden="true">·</span> {product.subcategory}
          </p>
          <h3 className="min-h-10 text-sm font-semibold text-[#0E1A3A]">{product.name}</h3>
          <div className="mt-2 flex items-end gap-2">
            <strong className="tabular-nums text-lg text-[#0E1A3A]">{formatCOP(product.price)}</strong>
            {isOnSale(product) && <del className="text-xs text-[#5B6478]">{formatCOP(product.compareAtPrice!)}</del>}
          </div>
        </div>
      </Link>
      <FavoriteButton productId={product.id} productName={product.name} className="absolute right-3 top-3 z-10" />
      <Button onClick={() => add(product)} disabled={outOfStock} className="mx-4 mb-4 w-[calc(100%-2rem)] bg-[#2F5BFF] text-white">
        {outOfStock ? 'Agotado' : 'Agregar al carrito'}
      </Button>
    </article>
  )
}

export function CartLine({ item }: { item: CartItem }) {
  const update = useCart((s) => s.updateQuantity)
  const remove = useCart((s) => s.removeItem)
  return (
    <div className="flex gap-4 border-b border-[#DDE2EE] py-4">
      <img src={item.images[0]} alt="" className="size-20 rounded-lg bg-[#F4F6FB] object-contain p-2" />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <Link href={`/producto/${item.slug}`} className="block truncate text-sm font-semibold text-[#0E1A3A]">{item.name}</Link>
            <p className="text-xs text-[#5B6478]">{item.selectedVariant}</p>
          </div>
          <button onClick={() => remove(item.id, item.selectedVariant)} className="text-xs text-[#5B6478] hover:text-[#B42318]">Eliminar</button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center rounded-lg border border-[#DDE2EE]">
            <button className="p-1.5" aria-label="Reducir cantidad" onClick={() => update(item.id, item.selectedVariant, item.quantity - 1)}><Minus className="size-3" /></button>
            <span className="w-7 text-center text-xs tabular-nums">{item.quantity}</span>
            <button className="p-1.5" aria-label="Aumentar cantidad" onClick={() => update(item.id, item.selectedVariant, item.quantity + 1)}><Plus className="size-3" /></button>
          </div>
          <strong className="tabular-nums">{formatCOP(item.price * item.quantity)}</strong>
        </div>
      </div>
    </div>
  )
}
