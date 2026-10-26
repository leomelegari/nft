import { NETWORKS, NETWORK_LABELS, COLLECTION_LABELS } from '@/entities/nft'
import type { CollectionSlug, Network, NftFacets } from '@/entities/nft'
import type { ResolvedCatalogSearch } from '@/features/catalog/search-params'
import {
  FilterCheckboxRow,
  PriceRangeFields,
} from '@/features/catalog/filter-controls'
import {
  SORTED_COLLECTION_SLUGS,
  toggleValue,
} from '@/features/catalog/filter-options'

/**
 * Sidebar filters: collections, price range and networks.
 *
 * The controls themselves live in `filter-controls.tsx`, shared with the
 * market screen's filter bar. This file is only the vertical arrangement the
 * home screen's Figma frame specifies.
 */
export function FiltersPanel({
  idPrefix,
  search,
  facets,
  isLoading,
  onChange,
}: {
  /**
   * Namespaces the input ids. The desktop sidebar stays mounted while the
   * mobile filter dialog is open, so two copies of this panel can exist at
   * once and must not share ids.
   */
  idPrefix: string
  search: ResolvedCatalogSearch
  facets: NftFacets | undefined
  isLoading: boolean
  onChange: (change: Partial<ResolvedCatalogSearch>) => void
}) {
  const selectedCollections = search.collection
  const selectedNetworks = search.network

  return (
    <div className="flex flex-col gap-10 rounded-xl bg-card p-5">
      <fieldset>
        <legend className="text-body-2xl font-bold text-foreground">Coleções</legend>
        <ul className="mt-3 px-3">
          {SORTED_COLLECTION_SLUGS.map((slug) => (
            <li key={slug}>
              <FilterCheckboxRow
                label={COLLECTION_LABELS[slug]}
                count={facets?.collections[slug]}
                isLoading={isLoading}
                checked={selectedCollections.includes(slug)}
                onToggle={() =>
                  onChange({
                    collection: toggleValue<CollectionSlug>(selectedCollections, slug),
                  })
                }
              />
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="text-body-2xl font-bold text-foreground">
          Faixa de preço
        </legend>
        <div className="mt-3 pl-3">
          {/*
            Keyed on the URL values so back/forward navigation remounts the
            inputs with the restored range, instead of syncing props into state
            inside an effect.
          */}
          <PriceRangeFields
            key={`${search.minPrice ?? ''}|${search.maxPrice ?? ''}`}
            idPrefix={idPrefix}
            search={search}
            facets={facets}
            onChange={onChange}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-body-2xl font-bold text-foreground">Rede</legend>
        <ul className="mt-3 px-3">
          {NETWORKS.map((network) => (
            <li key={network}>
              <FilterCheckboxRow
                label={NETWORK_LABELS[network]}
                count={facets?.networks[network]}
                isLoading={isLoading}
                checked={selectedNetworks.includes(network)}
                onToggle={() =>
                  onChange({ network: toggleValue<Network>(selectedNetworks, network) })
                }
              />
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  )
}
