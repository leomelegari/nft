import { isApiError } from '@/shared/api'
import { Button } from '@/shared/ui/button'

/**
 * The non-populated states of a catalog result set, shared by the home grid
 * and the market screen.
 *
 * Both surfaces lay out *results* differently but fail, come back empty and
 * refetch identically, so only the populated layout is theirs to own.
 */

export function CatalogErrorState({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
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

export function CatalogEmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean
  onClearFilters: () => void
}) {
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

/**
 * Background-refetch indicator.
 *
 * A subtle strip over live content rather than replacing it with skeletons, so
 * a refetch or a page change does not blank the screen the user is reading.
 */
export function CatalogBusyStrip() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute -top-2 left-0 h-0.5 w-full animate-pulse rounded-full bg-primary/70"
    >
      <span className="sr-only">Atualizando resultados</span>
    </div>
  )
}
