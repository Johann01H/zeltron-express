'use client'

import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFavorites } from '@/store/favorites'

type FavoriteButtonProps = {
  productId: string
  productName: string
  className?: string
}

export function FavoriteButton({ productId, productName, className }: FavoriteButtonProps) {
  const isFavorite = useFavorites((state) => state.ids.includes(productId))
  const toggleFavorite = useFavorites((state) => state.toggleFavorite)

  return (
    <button
      type="button"
      aria-label={isFavorite ? `Quitar ${productName} de favoritos` : `Guardar ${productName} en favoritos`}
      aria-pressed={isFavorite}
      data-favorite={isFavorite}
      className={cn(
        'grid size-10 place-items-center rounded-full border border-[#DDE2EE] bg-white/95 text-[#0E1A3A] shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:border-[#2F5BFF] hover:text-[#2F5BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC92E] data-[favorite=true]:border-[#2F5BFF] data-[favorite=true]:text-[#2F5BFF]',
        className,
      )}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleFavorite(productId)
      }}
    >
      <Heart
        aria-hidden="true"
        className={cn('size-4 transition', isFavorite && 'fill-current')}
      />
    </button>
  )
}
