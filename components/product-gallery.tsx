'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ProductGallery({ images, name, children }: { images: string[]; name: string; children?: React.ReactNode }) {
  const [active, setActive] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[#DCE1EC] bg-white p-10">
        <img src={images[active]} alt={name} className="size-full object-contain" />
        {children}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Fotos del producto">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Foto ${i + 1}`}
              onClick={() => setActive(i)}
              className={cn('size-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1.5 transition', active === i ? 'border-[#2F5BFF]' : 'border-transparent hover:border-[#DCE1EC]')}
            >
              <img src={src} alt="" className="size-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
