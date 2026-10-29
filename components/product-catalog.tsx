'use client'

import { useMemo, useState } from 'react'
import { Filter, RotateCcw, Search, Truck, X } from 'lucide-react'
import { ProductCard } from '@/components/storefront'
import { discount, formatCOP, isOnSale } from '@/lib/format'
import type { Category, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'discount' | 'newest'

type ProductCatalogProps = {
  products: Product[]
  categories: Category[]
  initialCategory?: string
  initialSubcategory?: string
  initialQuery?: string
  initialSaleOnly?: boolean
}

type CheckOptionProps = {
  label: string
  checked: boolean
  count?: number
  onChange: () => void
}

function CheckOption({ label, checked, count, onChange }: CheckOptionProps) {
  return (
    <label className="catalog-filter-option">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
      {count !== undefined && <span className="catalog-filter-count">{count}</span>}
    </label>
  )
}

type RadioOptionProps = CheckOptionProps & { name: string }

function RadioOption({ label, checked, count, name, onChange }: RadioOptionProps) {
  return (
    <label className="catalog-filter-option">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>
      {count !== undefined && <span className="catalog-filter-count">{count}</span>}
    </label>
  )
}

export function ProductCatalog({
  products,
  categories,
  initialCategory,
  initialSubcategory,
  initialQuery = '',
  initialSaleOnly = false,
}: ProductCatalogProps) {
  const prices = products.length ? products.map((product) => product.price) : [0]
  const catalogMinPrice = Math.min(...prices)
  const catalogMaxPrice = Math.max(...prices)
  const categoryNames = categories.map((category) => category.name)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState(() =>
    initialCategory && categoryNames.includes(initialCategory) ? initialCategory : 'Todos',
  )
  const [selectedSubcategory, setSelectedSubcategory] = useState(() =>
    initialSubcategory && products.some((product) => product.subcategory === initialSubcategory)
      ? initialSubcategory
      : 'Todas',
  )
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [minimumPrice, setMinimumPrice] = useState(catalogMinPrice)
  const [maximumPrice, setMaximumPrice] = useState(catalogMaxPrice)
  const [minimumDiscount, setMinimumDiscount] = useState(0)
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [onlyFreeShipping, setOnlyFreeShipping] = useState(false)
  const [onlyOffers, setOnlyOffers] = useState(initialSaleOnly)
  const [onlyBestSellers, setOnlyBestSellers] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const allSubcategories = useMemo(
    () => Array.from(new Set(products.map((product) => product.subcategory))).sort((a, b) => a.localeCompare(b, 'es')),
    [products],
  )
  const subcategoryOptions = selectedCategory === 'Todos'
    ? allSubcategories
    : categories.find((category) => category.name === selectedCategory)?.subcategories ?? []
  const brandOptions = useMemo(
    () => Array.from(new Set(products.flatMap((product) => (product.brand ? [product.brand] : [])))).sort((a, b) => a.localeCompare(b, 'es')),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('es')
    const filtered = products.filter((product) => {
      const searchableText = [product.name, product.brand ?? '', product.category, product.subcategory, product.description]
        .join(' ')
        .toLocaleLowerCase('es')

      return (
        (!query || searchableText.includes(query)) &&
        (selectedCategory === 'Todos' || product.category === selectedCategory) &&
        (selectedSubcategory === 'Todas' || product.subcategory === selectedSubcategory) &&
        (selectedBrands.length === 0 || (product.brand !== null && selectedBrands.includes(product.brand))) &&
        product.price >= minimumPrice &&
        product.price <= maximumPrice &&
        discount(product) >= minimumDiscount &&
        (!onlyAvailable || product.stock > 0) &&
        (!onlyFreeShipping || product.freeShipping) &&
        (!onlyOffers || isOnSale(product)) &&
        (!onlyBestSellers || product.isBestSeller)
      )
    })

    return filtered.sort((first, second) => {
      if (sortBy === 'price-asc') return first.price - second.price
      if (sortBy === 'price-desc') return second.price - first.price
      if (sortBy === 'discount') return discount(second) - discount(first)
      if (sortBy === 'newest') return Number(second.id) - Number(first.id)
      return Number(second.isBestSeller) - Number(first.isBestSeller) || Number(second.stock > 0) - Number(first.stock > 0)
    })
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedBrands,
    minimumPrice,
    maximumPrice,
    minimumDiscount,
    onlyAvailable,
    onlyFreeShipping,
    onlyOffers,
    onlyBestSellers,
    sortBy,
  ])

  const activeFiltersCount =
    Number(Boolean(searchQuery.trim())) +
    Number(selectedCategory !== 'Todos') +
    Number(selectedSubcategory !== 'Todas') +
    selectedBrands.length +
    Number(minimumPrice > catalogMinPrice) +
    Number(maximumPrice < catalogMaxPrice) +
    Number(minimumDiscount > 0) +
    Number(onlyAvailable) +
    Number(onlyFreeShipping) +
    Number(onlyOffers) +
    Number(onlyBestSellers)

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('Todos')
    setSelectedSubcategory('Todas')
    setSelectedBrands([])
    setMinimumPrice(catalogMinPrice)
    setMaximumPrice(catalogMaxPrice)
    setMinimumDiscount(0)
    setOnlyAvailable(false)
    setOnlyFreeShipping(false)
    setOnlyOffers(false)
    setOnlyBestSellers(false)
    setSortBy('recommended')
  }

  const toggleBrand = (brand: string) => {
    setSelectedBrands((current) => current.includes(brand)
      ? current.filter((item) => item !== brand)
      : [...current, brand],
    )
  }

  const categoryCount = (category: string) => products.filter((product) => product.category === category).length
  const subcategoryCount = (subcategory: string) => products.filter((product) => product.subcategory === subcategory).length
  const brandCount = (brand: string) => products.filter((product) => product.brand === brand).length

  const activeChips: { key: string; label: string; onRemove: () => void }[] = []
  if (searchQuery.trim()) activeChips.push({ key: 'search', label: `Búsqueda: ${searchQuery}`, onRemove: () => setSearchQuery('') })
  if (selectedCategory !== 'Todos') activeChips.push({ key: 'category', label: selectedCategory, onRemove: () => { setSelectedCategory('Todos'); setSelectedSubcategory('Todas') } })
  if (selectedSubcategory !== 'Todas') activeChips.push({ key: 'subcategory', label: selectedSubcategory, onRemove: () => setSelectedSubcategory('Todas') })
  selectedBrands.forEach((brand) => activeChips.push({ key: `brand-${brand}`, label: brand, onRemove: () => toggleBrand(brand) }))
  if (minimumPrice > catalogMinPrice || maximumPrice < catalogMaxPrice) {
    activeChips.push({ key: 'price', label: `${formatCOP(minimumPrice)} – ${formatCOP(maximumPrice)}`, onRemove: () => { setMinimumPrice(catalogMinPrice); setMaximumPrice(catalogMaxPrice) } })
  }
  if (minimumDiscount > 0) activeChips.push({ key: 'discount', label: `${minimumDiscount}% o más`, onRemove: () => setMinimumDiscount(0) })
  if (onlyAvailable) activeChips.push({ key: 'stock', label: 'Disponibles', onRemove: () => setOnlyAvailable(false) })
  if (onlyFreeShipping) activeChips.push({ key: 'shipping', label: 'Envío gratis', onRemove: () => setOnlyFreeShipping(false) })
  if (onlyOffers) activeChips.push({ key: 'offers', label: 'En oferta', onRemove: () => setOnlyOffers(false) })
  if (onlyBestSellers) activeChips.push({ key: 'best-sellers', label: 'Más vendidos', onRemove: () => setOnlyBestSellers(false) })

  return (
    <section className="catalog-shell" aria-labelledby="catalog-title">
      <div className="catalog-hero">
        <div>
          <h1 id="catalog-title">Catálogo</h1>
          <p className="catalog-intro">Filtra por categoría, precio o descuento. Todo con pago contra entrega.</p>
        </div>
        <div className="catalog-promise">
          <span className="catalog-promise-icon"><Truck aria-hidden="true" /></span>
          <div>
            <strong>Pagas al recibir</strong>
            <span>Y tienes 5 días hábiles para retractarte</span>
          </div>
        </div>
      </div>

      <div className="catalog-toolbar">
        <label className="catalog-search-box">
          <Search aria-hidden="true" />
          <span className="sr-only">Buscar productos</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Busca por producto, marca o categoría"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label="Limpiar búsqueda">
              <X aria-hidden="true" />
            </button>
          )}
        </label>
        <label className="catalog-sort-control">
          <span>Ordenar por</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
            <option value="recommended">Recomendados</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="discount">Mayor descuento</option>
            <option value="newest">Novedades</option>
          </select>
        </label>
      </div>

      <div className="catalog-mobile-toolbar">
        <button
          type="button"
          className="catalog-filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="catalog-filter-panel"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <Filter aria-hidden="true" />
          Filtros
          {activeFiltersCount > 0 && <span>{activeFiltersCount}</span>}
        </button>
        <p aria-live="polite"><strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'producto' : 'productos'}</p>
      </div>

      <div className="catalog-layout">
        <aside
          id="catalog-filter-panel"
          className={cn('catalog-sidebar', filtersOpen && 'is-open')}
          aria-label="Filtros del catálogo"
        >
          <div className="catalog-filter-header">
            <h2>Filtros</h2>
            <div className="catalog-filter-actions">
              {activeFiltersCount > 0 && (
                <button type="button" className="catalog-clear-button" onClick={clearFilters}>
                  Limpiar
                </button>
              )}
              <button
                type="button"
                className="catalog-filter-close"
                onClick={() => setFiltersOpen(false)}
                aria-label="Cerrar filtros"
              >
                <X aria-hidden="true" />
              </button>
            </div>
          </div>

          <fieldset className="catalog-filter-group">
            <legend>Categoría</legend>
            <RadioOption
              name="catalog-category"
              label="Todas las categorías"
              count={products.length}
              checked={selectedCategory === 'Todos'}
              onChange={() => { setSelectedCategory('Todos'); setSelectedSubcategory('Todas') }}
            />
            {categoryNames.map((category) => (
              <RadioOption
                key={category}
                name="catalog-category"
                label={category}
                count={categoryCount(category)}
                checked={selectedCategory === category}
                onChange={() => { setSelectedCategory(category); setSelectedSubcategory('Todas') }}
              />
            ))}
          </fieldset>

          <fieldset className="catalog-filter-group">
            <legend>Subcategoría</legend>
            <div className="catalog-filter-scroll">
              <RadioOption
                name="catalog-subcategory"
                label="Todas las subcategorías"
                checked={selectedSubcategory === 'Todas'}
                onChange={() => setSelectedSubcategory('Todas')}
              />
              {subcategoryOptions.map((subcategory) => (
                <RadioOption
                  key={subcategory}
                  name="catalog-subcategory"
                  label={subcategory}
                  count={subcategoryCount(subcategory)}
                  checked={selectedSubcategory === subcategory}
                  onChange={() => setSelectedSubcategory(subcategory)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="catalog-filter-group">
            <legend>Precio</legend>
            <div className="catalog-price-inputs">
              <label>
                <span>Mínimo</span>
                <input
                  type="number"
                  min={catalogMinPrice}
                  max={maximumPrice}
                  step={5000}
                  value={minimumPrice}
                  onChange={(event) => setMinimumPrice(Math.min(Math.max(Number(event.target.value) || catalogMinPrice, catalogMinPrice), maximumPrice))}
                />
              </label>
              <label>
                <span>Máximo</span>
                <input
                  type="number"
                  min={minimumPrice}
                  max={catalogMaxPrice}
                  step={5000}
                  value={maximumPrice}
                  onChange={(event) => setMaximumPrice(Math.max(Math.min(Number(event.target.value) || catalogMaxPrice, catalogMaxPrice), minimumPrice))}
                />
              </label>
            </div>
            <input
              className="catalog-price-range"
              type="range"
              min={catalogMinPrice}
              max={catalogMaxPrice}
              step={5000}
              value={maximumPrice}
              aria-label="Ajustar precio máximo"
              onChange={(event) => setMaximumPrice(Math.max(Number(event.target.value), minimumPrice))}
            />
            <p className="catalog-price-caption">{formatCOP(minimumPrice)} <span>—</span> {formatCOP(maximumPrice)}</p>
          </fieldset>

          {brandOptions.length > 0 && <fieldset className="catalog-filter-group">
            <legend>Marca</legend>
            <div className="catalog-filter-scroll">
              {brandOptions.map((brand) => (
                <CheckOption
                  key={brand}
                  label={brand}
                  count={brandCount(brand)}
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                />
              ))}
            </div>
          </fieldset>}


          <fieldset className="catalog-filter-group">
            <legend>Descuento mínimo</legend>
            {[0, 10, 20, 30].map((amount) => (
              <RadioOption
                key={amount}
                name="catalog-discount"
                label={amount === 0 ? 'Cualquier descuento' : `${amount}% o más`}
                checked={minimumDiscount === amount}
                onChange={() => setMinimumDiscount(amount)}
              />
            ))}
          </fieldset>

          <fieldset className="catalog-filter-group">
            <legend>Disponibilidad y beneficios</legend>
            <CheckOption label="Productos disponibles" checked={onlyAvailable} onChange={() => setOnlyAvailable((value) => !value)} />
            <CheckOption label="Envío gratis" checked={onlyFreeShipping} onChange={() => setOnlyFreeShipping((value) => !value)} />
            <CheckOption label="En oferta" checked={onlyOffers} onChange={() => setOnlyOffers((value) => !value)} />
            <CheckOption label="Más vendidos" checked={onlyBestSellers} onChange={() => setOnlyBestSellers((value) => !value)} />
          </fieldset>
        </aside>

        <div className="catalog-results">
          <div className="catalog-results-heading">
            <div>
              <h2>{filteredProducts.length === 1 ? '1 producto encontrado' : `${filteredProducts.length} productos encontrados`}</h2>
            </div>
            {activeFiltersCount > 0 && (
              <button type="button" className="catalog-clear-button catalog-clear-desktop" onClick={clearFilters}>
                <RotateCcw aria-hidden="true" /> Limpiar filtros
              </button>
            )}
          </div>

          {activeChips.length > 0 && (
            <div className="catalog-active-filters" aria-label="Filtros activos">
              {activeChips.map((chip) => (
                <button key={chip.key} type="button" onClick={chip.onRemove}>
                  {chip.label}<X aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          {filteredProducts.length > 0 ? (
            <div className="catalog-grid">
              {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="catalog-empty-state">
              <span><Search aria-hidden="true" /></span>
              <p className="catalog-eyebrow">Sin coincidencias</p>
              <h3>No encontramos productos con esos filtros.</h3>
              <p>Prueba con otra categoría, marca o rango de precio.</p>
              <button type="button" onClick={clearFilters}>Limpiar filtros</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
