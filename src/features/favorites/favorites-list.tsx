import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/entities/nft'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'
import { CatalogBusyStrip, CatalogErrorState } from '@/features/catalog/catalog-states'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { Button } from '@/shared/ui/button'
import { SkeletonGroup } from '@/shared/ui/skeleton-primitives'

/** Matches the market grid so the two surfaces read as the same catalog. */
const GRID_CLASS = 'grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 xl:grid-cols-4'

/** Enough placeholders to fill the fold without inventing a page size. */
const SKELETON_COUNT = 8

/**
 * The collector's saved NFTs.
 *
 * The heart stays on every card, which makes removal the obvious gesture: the
 * toggle is optimistic, so a card leaves the list the moment it is unfavourited
 * rather than after a round trip. The empty state is its own — "nenhum NFT
 * encontrado" would be wrong here, because nothing was searched for.
 */
export function FavoritesList({
  nfts,
  isPending,
  isFetching,
  error,
  onRetry,
}: {
  nfts: NftSummary[]
  isPending: boolean
  isFetching: boolean
  error: unknown
  onRetry: () => void
}) {
  if (isPending) {
    return (
      <SkeletonGroup label="Carregando sua lista de interesse">
        <ul className={GRID_CLASS}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
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
      <div className="flex flex-col items-start gap-4 rounded-xl border border-border-soft bg-card p-8">
        <h2 className="text-body-xl font-bold text-foreground">
          Sua lista de interesse está vazia
        </h2>
        <p className="max-w-prose text-body text-text-secondary">
          Toque no coração de um NFT para guardá-lo aqui e acompanhar preço e
          disponibilidade.
        </p>
        <Button asChild>
          <Link to="/mercado">Explorar o mercado</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      {isFetching && <CatalogBusyStrip />}
      <ul className={GRID_CLASS}>
        {nfts.map((nft, index) => (
          <li key={nft.id}>
            <NftCard
              nft={nft}
              priority={index < 4}
              favoriteSlot={<FavoriteButton nft={nft} />}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
