import type { NftSummary } from '@/entities/nft'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'
import {
  CatalogBusyStrip,
  CatalogEmptyState,
  CatalogErrorState,
} from '@/features/catalog/catalog-states'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { SkeletonGroup } from '@/shared/ui/skeleton-primitives'

/**
 * The market's result grid.
 *
 * Denser than the home showcase — four columns on wide viewports instead of
 * three — and every card carries the favourite toggle. `NftCard` has always
 * accepted a `favoriteSlot`; until now nothing passed one, so the control was
 * reachable only from an NFT's own page.
 */
export function MarketGrid({
  nfts,
  isPending,
  isFetching,
  error,
  skeletonCount,
  onRetry,
  onClearFilters,
  hasFilters,
  onRequireAuth,
}: {
  nfts: NftSummary[]
  isPending: boolean
  isFetching: boolean
  error: unknown
  /** Matches the requested page size so the skeleton does not reflow. */
  skeletonCount: number
  onRetry: () => void
  onClearFilters: () => void
  hasFilters: boolean
  onRequireAuth: () => void
}) {
  if (isPending) {
    return (
      <SkeletonGroup label="Carregando itens do mercado">
        <ul className={GRID_CLASS}>
          {Array.from({ length: skeletonCount }, (_, index) => (
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
    return <CatalogEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
  }

  return (
    <div className="relative">
      {isFetching && <CatalogBusyStrip />}
      <ul className={GRID_CLASS}>
        {nfts.map((nft, index) => (
          <li key={nft.id}>
            <NftCard
              nft={nft}
              /* First row is above the fold on most viewports. */
              priority={index < 4}
              favoriteSlot={<FavoriteButton nft={nft} onRequireAuth={onRequireAuth} />}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

const GRID_CLASS = 'grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 xl:grid-cols-4'
