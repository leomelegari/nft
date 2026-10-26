import { ChevronDownIcon } from 'lucide-react'
import {
  COLLECTION_LABELS,
  NETWORKS,
  NETWORK_LABELS,
  type CollectionSlug,
  type Network,
  type NftFacets,
} from '@/entities/nft'
import { FilterCheckboxRow, PriceRangeFields } from '@/features/catalog/filter-controls'
import { SORTED_COLLECTION_SLUGS, toggleValue } from '@/features/catalog/filter-options'
import { CatalogSearchField } from '@/features/catalog/toolbar'
import type { ResolvedCatalogSearch } from '@/features/catalog/search-params'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { cn } from '@/shared/lib/utils'

/**
 * The market's filter bar: search plus one popover per filter dimension.
 *
 * This is the main thing that makes the market screen read differently from
 * the home catalog. The home screen devotes a 310px column to an always-open
 * sidebar, which suits a showcase; the market trades that column for result
 * width and puts the same controls one click away, horizontally. The controls
 * themselves are the shared ones from `filter-controls.tsx`, so the two
 * surfaces cannot drift apart in behaviour.
 */
export function MarketFilterBar({
  searchFieldId,
  search,
  facets,
  isLoading,
  onChange,
  onSearch,
  trailing,
}: {
  /** Owned by the route, which also binds the "/" shortcut to it. */
  searchFieldId: string
  search: ResolvedCatalogSearch
  facets: NftFacets | undefined
  isLoading: boolean
  onChange: (change: Partial<ResolvedCatalogSearch>) => void
  onSearch: (value: string, options: { replace: boolean }) => void
  /** Controls that belong on the bar but are not filters, e.g. the view toggle. */
  trailing?: React.ReactNode
}) {
  const priceActive = Boolean(search.minPrice || search.maxPrice)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-soft bg-card p-3 lg:flex-row lg:items-center">
      <div className="min-w-0 lg:flex-1">
        <CatalogSearchField id={searchFieldId} value={search.q} onSearch={onSearch} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterPopover label="Coleções" count={search.collection.length} className="w-72">
          <fieldset>
            <legend className="text-body-md font-bold text-foreground">
              Filtrar por coleção
            </legend>
            <ul className="mt-2 max-h-72 overflow-y-auto">
              {SORTED_COLLECTION_SLUGS.map((slug) => (
                <li key={slug}>
                  <FilterCheckboxRow
                    label={COLLECTION_LABELS[slug]}
                    count={facets?.collections[slug]}
                    isLoading={isLoading}
                    checked={search.collection.includes(slug)}
                    onToggle={() =>
                      onChange({
                        collection: toggleValue<CollectionSlug>(search.collection, slug),
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          </fieldset>
        </FilterPopover>

        <FilterPopover label="Rede" count={search.network.length} className="w-60">
          <fieldset>
            <legend className="text-body-md font-bold text-foreground">
              Filtrar por rede
            </legend>
            <ul className="mt-2">
              {NETWORKS.map((network) => (
                <li key={network}>
                  <FilterCheckboxRow
                    label={NETWORK_LABELS[network]}
                    count={facets?.networks[network]}
                    isLoading={isLoading}
                    checked={search.network.includes(network)}
                    onToggle={() =>
                      onChange({
                        network: toggleValue<Network>(search.network, network),
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          </fieldset>
        </FilterPopover>

        <FilterPopover label="Preço" count={priceActive ? 1 : 0} className="w-72">
          <fieldset>
            <legend className="text-body-md font-bold text-foreground">
              Faixa de preço
            </legend>
            <div className="mt-2">
              {/*
                Keyed on the URL values so back/forward navigation remounts the
                inputs with the restored range instead of syncing props into
                state inside an effect.
              */}
              <PriceRangeFields
                key={`${search.minPrice ?? ''}|${search.maxPrice ?? ''}`}
                idPrefix="market-bar"
                search={search}
                facets={facets}
                onChange={onChange}
              />
            </div>
          </fieldset>
        </FilterPopover>

        {trailing}
      </div>
    </div>
  )
}

/**
 * A filter dimension behind a popover.
 *
 * The count badge is what keeps the collapsed state honest: a popover that
 * hides three active selections behind the word "Coleções" would otherwise
 * give no hint that the results are narrowed. The chips row below the bar is
 * the other half of that answer.
 */
function FilterPopover({
  label,
  count,
  className,
  children,
}: {
  label: string
  count: number
  className?: string
  children: React.ReactNode
}) {
  const active = count > 0

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'flex h-11 items-center gap-2 rounded-xl border px-3.5 text-body-md transition-colors focus-visible:outline-ring',
          active
            ? 'border-primary bg-primary/10 font-bold text-text-accent'
            : 'border-border-soft bg-secondary text-foreground hover:text-text-accent',
        )}
      >
        {label}
        {active && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-tiny font-bold text-primary-foreground tabular-nums">
            {count}
          </span>
        )}
        <ChevronDownIcon className="size-4" aria-hidden="true" />
        <span className="sr-only">
          {active
            ? `, ${count} ${count === 1 ? 'filtro ativo' : 'filtros ativos'}`
            : ', nenhum filtro ativo'}
        </span>
      </PopoverTrigger>
      <PopoverContent className={className}>{children}</PopoverContent>
    </Popover>
  )
}
