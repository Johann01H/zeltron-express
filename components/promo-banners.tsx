import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Banner, BannerSection } from '@/lib/banners'
import { cn } from '@/lib/utils'
import { PromoProductRail } from './promo-product-rail'

/** Lugar de cada tamaño en el mosaico (2 columnas en celular, 4 en escritorio). */
const SIZE_CLASS: Record<Banner['size'], string> = {
  large: 'col-span-2 row-span-2',
  tall: 'col-span-1 row-span-2',
  small: 'col-span-1 row-span-1',
  wide: 'col-span-2 row-span-1 lg:col-span-4',
}

function BannerTile({ banner, eager }: { banner: Banner; eager: boolean }) {
  const image = (
    <picture>
      {banner.mobileImageUrl && <source media="(max-width: 767px)" srcSet={banner.mobileImageUrl} />}
      <img
        src={banner.imageUrl}
        alt={banner.title}
        loading={eager ? 'eager' : 'lazy'}
        className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
    </picture>
  )
  const className = cn(
    'promo-tile group relative block overflow-hidden rounded-2xl bg-[#E8ECF4] shadow-[0_10px_30px_rgba(14,26,58,.08)] outline-none ring-[#2F5BFF] ring-offset-2 focus-visible:ring-2',
    SIZE_CLASS[banner.size],
  )
  if (!banner.href) return <div className={className}>{image}</div>
  if (/^https?:\/\//.test(banner.href)) {
    return <a href={banner.href} target="_blank" rel="noreferrer" className={className}>{image}</a>
  }
  return <Link href={banner.href} className={className}>{image}</Link>
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

      <div className="grid grid-flow-row-dense auto-rows-[9.5rem] grid-cols-2 gap-3 sm:auto-rows-[12.5rem] lg:auto-rows-[14.5rem] lg:grid-cols-4 lg:gap-4">
        {section.banners.map((banner, i) => <BannerTile key={banner.id} banner={banner} eager={index === 0 && i === 0} />)}
      </div>

      {section.products.length > 0 && <PromoProductRail products={section.products} label={section.title} />}
    </section>
  )
}
