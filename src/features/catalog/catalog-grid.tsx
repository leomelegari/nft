import type { NftSummary } from '@/entities/nft'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'
import {
  CatalogBusyStrip,
  CatalogEmptyState,
  CatalogErrorState,
} from '@/features/catalog/catalog-states'
import { DEFAULT_PAGE_SIZE } from '@/features/catalog/search-params'
import { SkeletonGroup } from '@/shared/ui/skeleton-primitives'

/**
 * The home screen's showcase grid with its four data states: loading, error,
 * empty and populated. The error, empty and busy states are shared with the
 * market screen (`catalog-states.tsx`); the 2/3-column layout is this
 * screen's own.
 */
export function CatalogGrid({
  nfts,
  isPending,
  isFetching,
  error,
  onRetry,
  onClearFilters,
  hasFilters,
}: {
  nfts: NftSummary[]
  isPending: boolean
  isFetching: boolean
  error: unknown
  onRetry: () => void
  onClearFilters: () => void
  hasFilters: boolean
}) {
  if (isPending) {
    return (
      <SkeletonGroup label="Carregando catálogo de NFTs">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3">
          {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      </SkeletonGroup>
    )
  }

  if (error) return <CatalogErrorState error={error} onRetry={onRetry} />

  if (nfts.length === 0) {
    return (
      <CatalogEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
    )
  }

  return (
    <div className="relative">
      {isFetching && <CatalogBusyStrip />}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3">
        {nfts.map((nft, index) => (
          <li key={nft.id}>
            {/* First row is above the fold on most viewports. */}
            <NftCard nft={nft} priority={index < 3} />
          </li>
        ))}
      </ul>
    </div>
  )
}
