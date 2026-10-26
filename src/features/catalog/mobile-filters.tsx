import { useRef, useState } from 'react'
import type { NftFacets } from '@/entities/nft'
import type { ResolvedCatalogSearch } from '@/features/catalog/search-params'
import { FiltersPanel } from '@/features/catalog/filters-panel'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

/**
 * Mobile filter drawer, matching the filter button in the mobile Figma frame.
 *
 * Reuses the exact same `FiltersPanel` as desktop, so the two cannot drift
 * apart. Focus is trapped by the dialog and returned to the trigger on close.
 */
export function MobileFilters({
  search,
  facets,
  isLoading,
  onChange,
}: {
  search: ResolvedCatalogSearch
  facets: NftFacets | undefined
  isLoading: boolean
  onChange: (change: Partial<ResolvedCatalogSearch>) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const activeCount =
    (search.collection?.length ?? 0) +
    (search.network?.length ?? 0) +
    (search.minPrice || search.maxPrice ? 1 : 0)

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-11 gap-2 border-border-soft bg-card text-foreground"
      >
        <FilterGlyph />
        Filtros
        {activeCount > 0 && (
          <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-tiny font-bold text-primary-foreground">
            {activeCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            triggerRef.current?.focus()
          }}
          className="max-h-[85dvh] overflow-y-auto border-border-soft bg-background sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
            <DialogDescription className="text-text-secondary">
              As seleções são aplicadas imediatamente e ficam salvas no endereço da
              página.
            </DialogDescription>
          </DialogHeader>

          <FiltersPanel
            search={search}
            facets={facets}
            isLoading={isLoading}
            onChange={onChange}
          />

          <Button onClick={() => setOpen(false)} className="w-full">
            Ver resultados
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

function FilterGlyph() {
  return (
    <svg viewBox="0 0 22 22" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M3.5 6.5h15M6.5 11h9M9 15.5h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
