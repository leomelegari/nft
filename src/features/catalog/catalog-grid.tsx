import type { NftSummary } from '@/entities/nft'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'
import { DEFAULT_PAGE_SIZE } from '@/features/catalog/search-params'
import { SkeletonGroup } from '@/shared/ui/skeleton-primitives'
import { Button } from '@/shared/ui/button'
import { isApiError } from '@/shared/api'

/**
 * Grid with its four data states: loading, error, empty and populated.
 *
 * `isFetching` renders a subtle busy strip over live content rather than
 * replacing it with skeletons, so a background refetch or a page change does
 * not blank the screen the user is reading.
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

  if (error) {
    const message = isApiError(error)
      ? error.message
      : 'Não foi possível carregar o catálogo.'

    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-4 rounded-xl border border-border-soft bg-card p-10 text-center"
      >
        <h3 className="text-body-2xl font-bold text-foreground">
          Não foi possível carregar o catálogo
        </h3>
        <p className="max-w-prose text-body text-text-secondary">{message}</p>
        <Button onClick={onRetry}>Tentar novamente</Button>
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border-soft bg-card p-10 text-center">
        <h3 className="text-body-2xl font-bold text-foreground">Nenhum NFT encontrado</h3>
        <p className="max-w-prose text-body text-text-secondary">
          {hasFilters
            ? 'Nenhum item corresponde aos filtros selecionados. Ajuste a busca ou limpe os filtros.'
            : 'Ainda não há NFTs publicados neste catálogo.'}
        </p>
        {hasFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {isFetching && (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-2 left-0 h-0.5 w-full animate-pulse rounded-full bg-primary/70"
        >
          <span className="sr-only">Atualizando resultados</span>
        </div>
      )}
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
