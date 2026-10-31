import type { Product } from './types'

/** Datos mínimos de un producto para las sugerencias del buscador del header. */
export type SearchItem = Pick<Product, 'id' | 'slug' | 'name' | 'brand' | 'category' | 'subcategory' | 'price'> & {
  image: string
  inStock: boolean
}

export function toSearchItems(products: Product[]): SearchItem[] {
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    price: p.price,
    image: p.images[0] ?? '/placeholder.svg',
    inStock: p.stock > 0,
  }))
}

/** Minúsculas y sin tildes: «Audífonos» y «audifonos» son lo mismo. */
export function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9+]+/g, ' ').trim()
}

/** Palabras que la gente escribe distinto a como aparecen en el catálogo. */
const SYNONYMS: Record<string, string[]> = {
  telefono: ['celular'],
  telefonos: ['celular'],
  movil: ['celular'],
  smartphone: ['celular'],
  audifono: ['audifonos'],
  auriculares: ['audifonos'],
  cascos: ['audifonos'],
  bafle: ['parlante'],
  altavoz: ['parlante'],
  bocina: ['parlante'],
  portatil: ['portatil', 'laptop'],
  computador: ['portatil'],
  laptop: ['portatil'],
  tv: ['televisor'],
  tele: ['televisor'],
  reloj: ['reloj', 'watch', 'band'],
  smartwatch: ['reloj', 'watch'],
  moto: ['moto', 'scooter'],
  patineta: ['scooter', 'patineta'],
  cargador: ['cargador'],
  cable: ['cable'],
  camara: ['camara'],
}

function tokens(query: string) {
  return normalize(query).split(' ').filter(Boolean)
}

function tokenMatches(haystack: string, token: string) {
  if (haystack.includes(token)) return true
  // Plurales y singulares: «parlantes» encuentra «parlante», «cargadores» encuentra «cargador».
  if (token.length > 4 && token.endsWith('es') && haystack.includes(token.slice(0, -2))) return true
  if (token.length > 3 && token.endsWith('s') && haystack.includes(token.slice(0, -1))) return true
  return (SYNONYMS[token] ?? []).some((alt) => haystack.includes(alt))
}

type Searchable = Pick<Product, 'name' | 'brand' | 'category' | 'subcategory'> & { description?: string }

function haystackOf(item: Searchable) {
  return normalize([item.name, item.brand ?? '', item.category, item.subcategory, item.description ?? ''].join(' '))
}

/** Todas las palabras de la búsqueda deben aparecer (en cualquier orden). */
export function matchesQuery(item: Searchable, query: string) {
  const words = tokens(query)
  if (words.length === 0) return true
  const haystack = haystackOf(item)
  return words.every((word) => tokenMatches(haystack, word))
}

/** Relevancia: primero coincidencias en el nombre y la marca, luego en la categoría. */
export function searchScore(item: Searchable, query: string) {
  const words = tokens(query)
  const name = normalize(item.name)
  const brand = normalize(item.brand ?? '')
  const section = normalize(`${item.category} ${item.subcategory}`)
  const full = normalize(query)
  let score = 0
  if (name.startsWith(full)) score += 40
  else if (name.includes(full)) score += 25
  for (const word of words) {
    if (name.split(' ').some((w) => w.startsWith(word))) score += 10
    else if (tokenMatches(name, word)) score += 6
    if (brand && tokenMatches(brand, word)) score += 8
    if (tokenMatches(section, word)) score += 4
  }
  return score
}

export function searchItems<T extends Searchable>(items: T[], query: string, limit = Infinity) {
  return items
    .filter((item) => matchesQuery(item, query))
    .map((item) => ({ item, score: searchScore(item, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item)
}
