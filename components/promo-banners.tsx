import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Banner, BannerSection } from '@/lib/banners'
import { cn } from '@/lib/utils'
import { PromoProductRail } from './promo-product-rail'

/** Proporción típica de cada tamaño, por si WordPress no envía las medidas de la imagen. */
const FALLBACK_RATIO: Record<Banner['size'], number> = { large: 1200 / 940, tall: 600 / 940, small: 600 / 460, wide: 2400 / 450 }

function ratioOf(banner: Banner, mobile: boolean) {
  const [w, h] = mobile && banner.mobileImageUrl ? [banner.mobileWidth, banner.mobileHeight] : [banner.imageWidth, banner.imageHeight]
  return w && h ? w / h : FALLBACK_RATIO[banner.size]
}

/** Una celda de la fila: un banner, o dos «Pequeño» apilados. */
type Cell = { banners: Banner[]; ratios: number[]; ratio: number }

/**
 * Filas «justificadas»: todos los banners de una fila tienen la misma altura y cada uno
 * ocupa el ancho que pide su proporción, así la imagen se ve completa y sin recortes.
 */
function buildRows(banners: Banner[], perRow: number, mobile: boolean): Cell[][] {
  const rows: Cell[][] = []
  let row: Cell[] = []
  const flush = () => { if (row.length) rows.push(row); row = [] }
  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i]
    const r = ratioOf(banner, mobile)
    if (banner.size === 'wide') {
      flush()
      rows.push([{ banners: [banner], ratios: [r], ratio: r }])
      continue
    }
    const next = banners[i + 1]
    if (banner.size === 'small' && next?.size === 'small') {
      const r2 = ratioOf(next, mobile)
      row.push({ banners: [banner, next], ratios: [r, r2], ratio: 1 / (1 / r + 1 / r2) })
      i++
    } else {
      row.push({ banners: [banner], ratios: [r], ratio: r })
    }
    if (row.length === perRow) flush()
  }
  flush()
  return rows
}

function BannerLink({ banner, className, style, children }: { banner: Banner; className: string; style?: React.CSSProperties; children: React.ReactNode }) {
  if (!banner.href) return <div className={className} style={style}>{children}</div>
  if (/^https?:\/\//.test(banner.href)) {
    return <a href={banner.href} target="_blank" rel="noreferrer" className={className} style={style}>{children}</a>
  }
  return <Link href={banner.href} className={className} style={style}>{children}</Link>
}

const TILE = 'promo-tile group relative block overflow-hidden rounded-2xl bg-[#E8ECF4] shadow-[0_10px_30px_rgba(14,26,58,.08)] outline-none ring-[#2F5BFF] ring-offset-2 focus-visible:ring-2'

function BannerImage({ banner, mobile, eager, fit }: { banner: Banner; mobile: boolean; eager: boolean; fit: 'contain' | 'cover' }) {
  return (
    <img
      src={mobile && banner.mobileImageUrl ? banner.mobileImageUrl : banner.imageUrl}
      alt={banner.title}
      loading={eager ? 'eager' : 'lazy'}
      className={cn('absolute inset-0 size-full transition duration-500 group-hover:scale-[1.02]', fit === 'contain' ? 'object-contain' : 'object-cover')}
    />
  )
}

function Mosaic({ banners, mobile, perRow, eager, className }: { banners: Banner[]; mobile: boolean; perRow: number; eager: boolean; className: string }) {
  const rows = buildRows(banners, perRow, mobile)
  const typical = rows.flat().reduce((sum, c) => sum + c.ratio, 0) / Math.max(rows.flat().length, 1)
  const firstId = eager ? rows[0]?.[0]?.banners[0].id : undefined
  return (
    <div className={className}>
      {rows.map((row, ri) => {
        const singles = row.some((c) => c.banners.length === 1)
        const missing = row[0].banners[0].size === 'wide' ? 0 : perRow - row.length
        // Una fila incompleta (ej. la última) mantiene la altura de las demás y queda centrada.
        const spacer = missing > 0 && rows.length > 1 ? <div aria-hidden="true" style={{ flex: `${(missing * typical) / 2} 1 0%` }} /> : null
        return (
          <div key={ri} className="flex items-stretch gap-[inherit]">
            {spacer}
            {row.map((cell) => {
              if (cell.banners.length === 1) {
                const [banner] = cell.banners
                return (
                  <div key={banner.id} className="min-w-0" style={{ flex: `${cell.ratio} 1 0%` }}>
                    <BannerLink banner={banner} className={TILE}>
                      <span className="block" style={{ aspectRatio: String(cell.ratio) }} />
                      <BannerImage banner={banner} mobile={mobile} eager={banner.id === firstId} fit="contain" />
                    </BannerLink>
                  </div>
                )
              }
              // Dos pequeños apilados: juntos miden lo mismo que la fila.
              return (
                <div key={cell.banners[0].id} className="flex min-w-0 flex-col gap-[inherit]" style={{ flex: `${cell.ratio} 1 0%` }}>
                  {cell.banners.map((banner, bi) => (
                    <BannerLink
                      key={banner.id}
                      banner={banner}
                      className={TILE}
                      // Si en la fila solo hay pilas, cada imagen usa su propia proporción.
                      style={singles ? { flex: `${1 / cell.ratios[bi]} 1 0%` } : { aspectRatio: String(cell.ratios[bi]) }}
                    >
                      <BannerImage banner={banner} mobile={mobile} eager={false} fit={singles ? 'cover' : 'contain'} />
                    </BannerLink>
                  ))}
                </div>
              )
            })}
            {spacer}
          </div>
        )
      })}
    </div>
  )
}

export function PromoBannerSection({ section, index }: { section: BannerSection; index: number }) {
  const titleId = `promo-${section.id}`
  return (
    <section className="py-16" aria-labelledby={titleId}>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 id={titleId}>{section.title}</h2>
          {section.subtitle && <p className="mt-2 text-sm text-[#5B6478]">{section.subtitle}</p>}
        </div>
        {section.viewAllHref && (
          <Link href={section.viewAllHref} className="link-arrow shrink-0">Ver todo <ArrowRight aria-hidden="true" className="size-4" /></Link>
        )}
      </div>

      <Mosaic banners={section.banners} mobile={false} perRow={4} eager={index === 0} className="hidden flex-col gap-4 md:flex" />
      <Mosaic banners={section.banners} mobile perRow={2} eager={index === 0} className="flex flex-col gap-3 md:hidden" />

      {section.products.length > 0 && <PromoProductRail products={section.products} label={section.title} />}
    </section>
  )
}
