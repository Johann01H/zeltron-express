/** Esqueletos de carga con la forma real de cada pantalla. */

function Bone({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#DCE1EC] bg-white">
      <Bone className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <Bone className="h-2.5 w-2/5" />
        <Bone className="h-3.5 w-4/5" />
        <Bone className="h-5 w-1/3" />
        <Bone className="mt-2 h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

export function CatalogSkeleton() {
  return (
    <div role="status" data-skeleton aria-label="Cargando productos" className="catalog-shell">
      <div className="relative overflow-hidden rounded-3xl bg-[#0E1A3A] p-8 sm:p-12">
        <Bone className="skeleton-dark h-12 w-56" />
        <Bone className="skeleton-dark mt-4 h-4 w-80 max-w-full" />
      </div>
      <div className="mt-6 flex gap-4">
        <Bone className="h-12 flex-1 rounded-xl" />
        <Bone className="hidden h-12 w-64 rounded-xl sm:block" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="hidden flex-col gap-3 rounded-2xl border border-[#DCE1EC] bg-white p-5 lg:flex">
          <Bone className="h-6 w-24" />
          {Array.from({ length: 7 }, (_, i) => <Bone key={i} className="h-3.5 w-full" />)}
          <Bone className="mt-3 h-5 w-28" />
          {Array.from({ length: 5 }, (_, i) => <Bone key={i} className="h-3.5 w-4/5" />)}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
      <span className="sr-only">Cargando productos…</span>
    </div>
  )
}

export function ProductSkeleton() {
  return (
    <main role="status" data-skeleton aria-label="Cargando producto" className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        <Bone className="aspect-square rounded-2xl" />
        <div className="flex flex-col justify-center gap-4">
          <Bone className="h-3 w-48" />
          <Bone className="h-10 w-4/5" />
          <Bone className="h-10 w-2/5" />
          <Bone className="h-3.5 w-full" />
          <Bone className="h-3.5 w-11/12" />
          <Bone className="h-3.5 w-3/4" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Bone className="h-12 rounded-xl" />
            <Bone className="h-12 rounded-xl" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }, (_, i) => <Bone key={i} className="h-14 rounded-xl" />)}
          </div>
        </div>
      </div>
      <span className="sr-only">Cargando producto…</span>
    </main>
  )
}

export function PanelSkeleton({ label }: { label: string }) {
  return (
    <div role="status" data-skeleton aria-label={label} className="mx-auto max-w-2xl px-4 py-16">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#DCE1EC] bg-white p-8">
        <Bone className="h-3 w-28" />
        <Bone className="h-9 w-2/3" />
        <Bone className="h-3.5 w-1/2" />
        <Bone className="mt-4 h-24 w-full rounded-xl" />
        <Bone className="h-12 w-full rounded-xl" />
      </div>
      <span className="sr-only">{label}…</span>
    </div>
  )
}
