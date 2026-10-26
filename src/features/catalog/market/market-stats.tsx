import type { NftFacets } from '@/entities/nft'
import { formatEth } from '@/shared/money'
import { SkeletonBlock } from '@/shared/ui/skeleton-primitives'

/**
 * Stats strip: the market's headline numbers.
 *
 * Everything here is derived from data the screen already has — the list
 * response's `meta.total` and the facet counts — so it costs no extra request.
 */
export function MarketStats({
  total,
  facets,
  isLoading,
}: {
  total: number | undefined
  facets: NftFacets | undefined
  isLoading: boolean
}) {
  const activeCollections = facets
    ? Object.values(facets.collections).filter((count) => count > 0).length
    : undefined

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat
        label="Itens no mercado"
        value={total === undefined ? undefined : String(total)}
        isLoading={isLoading}
      />
      <Stat
        label="Menor preço"
        value={facets ? formatEth(facets.priceRange.min) : undefined}
        isLoading={isLoading}
      />
      <Stat
        label="Maior preço"
        value={facets ? formatEth(facets.priceRange.max) : undefined}
        isLoading={isLoading}
      />
      <Stat
        label="Coleções ativas"
        value={activeCollections === undefined ? undefined : String(activeCollections)}
        isLoading={isLoading}
      />
    </dl>
  )
}

function Stat({
  label,
  value,
  isLoading,
}: {
  label: string
  value: string | undefined
  isLoading: boolean
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border-soft bg-card px-4 py-3">
      <dt className="text-caption tracking-label text-text-secondary uppercase">
        {label}
      </dt>
      <dd className="text-body-lg font-bold text-foreground tabular-nums">
        {value === undefined ? (
          isLoading ? (
            <SkeletonBlock className="h-5 w-20" rounded="sm" />
          ) : (
            '—'
          )
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
