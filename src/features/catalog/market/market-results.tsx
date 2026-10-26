import type { NftSummary } from '@/entities/nft'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'
import {
  CatalogBusyStrip,
  CatalogEmptyState,
  CatalogErrorState,
} from '@/features/catalog/catalog-states'
import { NftRow, NftRowSkeleton } from '@/features/catalog/market/nft-row'
import type { MarketView } from '@/features/catalog/market/market-search-params'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { SkeletonGroup } from '@/shared/ui/skeleton-primitives'

/**
 * The market's results, in whichever view is selected.
 *
 * The grid is denser than the home showcase — four columns on wide viewports
 * instead of three — and the list trades the artwork's size for comparable
 * columns. Both carry the favourite toggle: `NftCard` has always accepted a
 * `favoriteSlot`, but nothing passed one before, so the control was reachable
 * only from an NFT's own page.
 *
 * The error, empty and refetch states come from `catalog-states.tsx`, shared
 * with the home grid.
 */
export function MarketResults({
  nfts,
  view,
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
  view: MarketView
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
  const isList = view === 'list'
  const containerClass = isList ? LIST_CLASS : GRID_CLASS

  if (isPending) {
    return (
      <SkeletonGroup label="Carregando itens do mercado">
        <ul className={containerClass}>
          {Array.from({ length: skeletonCount }, (_, index) => (
            <li key={index}>{isList ? <NftRowSkeleton /> : <NftCardSkeleton />}</li>
          ))}
        </ul>
      </SkeletonGroup>
    )
  }

  if (error) return <CatalogErrorState error={error} onRetry={onRetry} />

  if (nfts.length === 0) {
    return <CatalogEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />
  }

  /** How many items are above the fold, which is view-dependent. */
  const priorityCount = isList ? 6 : 4

  return (
    <div className="relative">
      {isFetching && <CatalogBusyStrip />}
      <ul className={containerClass}>
        {nfts.map((nft, index) => {
          const favoriteSlot = <FavoriteButton nft={nft} onRequireAuth={onRequireAuth} />

          return (
            <li key={nft.id}>
              {isList ? (
                <NftRow
                  nft={nft}
                  priority={index < priorityCount}
                  favoriteSlot={favoriteSlot}
                />
              ) : (
                <NftCard
                  nft={nft}
                  priority={index < priorityCount}
                  favoriteSlot={favoriteSlot}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

const GRID_CLASS = 'grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 xl:grid-cols-4'
const LIST_CLASS = 'flex flex-col gap-2'
