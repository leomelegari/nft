import { useState } from 'react'
import {
  COLLECTION_LABELS,
  COLLECTION_SLUGS,
  NETWORKS,
  NETWORK_LABELS,
  type CollectionSlug,
  type Network,
  type NftFacets,
} from '@/entities/nft'
import { formatEthLocale } from '@/shared/money'
import { toEth } from '@/shared/money/eth'
import type { ResolvedCatalogSearch } from '@/features/catalog/search-params'
import { Button } from '@/shared/ui/button'
import { SkeletonBlock } from '@/shared/ui/skeleton-primitives'
import { cn } from '@/shared/lib/utils'

/**
 * Sidebar filters: collections, price range and networks.
 *
 * Collection and network rows are real checkboxes rather than the plain text of
 * the Figma, so they are reachable by keyboard and announce their checked state
 * — the design communicates selection by colour alone, which section 8 forbids.
 * The accent colour is kept as an additional, not sole, indicator.
 */
export function FiltersPanel({
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
  const selectedCollections = search.collection
  const selectedNetworks = search.network

  function toggle<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  }

  return (
    <div className="flex flex-col gap-10 rounded-xl bg-card p-5">
      <fieldset>
        <legend className="text-body-2xl font-bold text-foreground">Coleções</legend>
        <ul className="mt-3 px-3">
          {COLLECTION_SLUGS.map((slug) => (
            <li key={slug}>
              <FilterRow
                label={COLLECTION_LABELS[slug]}
                count={facets?.collections[slug]}
                isLoading={isLoading}
                checked={selectedCollections.includes(slug)}
                onToggle={() =>
                  onChange({
                    collection: toggle<CollectionSlug>(selectedCollections, slug),
                  })
                }
              />
            </li>
          ))}
        </ul>
      </fieldset>

      {/*
        Keyed on the URL values so back/forward navigation remounts the inputs
        with the restored range, instead of syncing props into state inside an
        effect.
      */}
      <PriceRangeFilter
        key={`${search.minPrice ?? ''}|${search.maxPrice ?? ''}`}
        search={search}
        facets={facets}
        onChange={onChange}
      />

      <fieldset>
        <legend className="text-body-2xl font-bold text-foreground">Rede</legend>
        <ul className="mt-3 px-3">
          {NETWORKS.map((network) => (
            <li key={network}>
              <FilterRow
                label={NETWORK_LABELS[network]}
                count={facets?.networks[network]}
                isLoading={isLoading}
                checked={selectedNetworks.includes(network)}
                onToggle={() =>
                  onChange({ network: toggle<Network>(selectedNetworks, network) })
                }
              />
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  )
}

function FilterRow({
  label,
  count,
  checked,
  isLoading,
  onToggle,
}: {
  label: string
  count: number | undefined
  checked: boolean
  isLoading: boolean
  onToggle: () => void
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 py-1.5 text-body-md transition-colors',
        checked
          ? 'font-bold text-text-accent'
          : 'text-text-secondary hover:text-foreground',
      )}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="size-4 shrink-0 rounded-sm border-border-soft text-text-accent accent-primary focus-visible:outline-ring"
        />
        {label}
      </span>
      {isLoading && count === undefined ? (
        <SkeletonBlock className="h-3.5 w-8" rounded="sm" />
      ) : (
        <span className="font-bold tabular-nums">({count ?? 0})</span>
      )}
    </label>
  )
}

/**
 * Price range.
 *
 * The Figma shows a two-handle slider with an Apply button. Two number inputs
 * plus Apply express the same state, are operable by keyboard and screen reader
 * without a custom widget, and keep the explicit "Aplicar" step the design
 * specifies — a dual-handle slider was not worth the accessibility cost here.
 */
function PriceRangeFilter({
  search,
  facets,
  onChange,
}: {
  search: ResolvedCatalogSearch
  facets: NftFacets | undefined
  onChange: (change: Partial<ResolvedCatalogSearch>) => void
}) {
  const bounds = facets?.priceRange
  const [min, setMin] = useState(search.minPrice ?? '')
  const [max, setMax] = useState(search.maxPrice ?? '')

  const placeholderMin = bounds ? formatEthLocale(bounds.min) : '0,00'
  const placeholderMax = bounds ? formatEthLocale(bounds.max) : '0,00'

  function apply(event: React.FormEvent) {
    event.preventDefault()
    onChange({
      minPrice: min.trim() === '' ? undefined : toEth(min.replace(',', '.')),
      maxPrice: max.trim() === '' ? undefined : toEth(max.replace(',', '.')),
    })
  }

  return (
    <form onSubmit={apply}>
      <fieldset>
        <legend className="text-body-2xl font-bold text-foreground">
          Faixa de preço
        </legend>
        <div className="mt-3 flex flex-col gap-3 pl-3">
          <div className="flex items-center gap-2">
            <PriceInput
              id="price-min"
              label="Preço mínimo em ETH"
              placeholder={placeholderMin}
              value={min}
              onChange={setMin}
            />
            <span aria-hidden="true" className="text-text-secondary">
              –
            </span>
            <PriceInput
              id="price-max"
              label="Preço máximo em ETH"
              placeholder={placeholderMax}
              value={max}
              onChange={setMax}
            />
          </div>
          <p className="text-body-md text-foreground">
            Preço: {min === '' ? placeholderMin : min} -{' '}
            {max === '' ? placeholderMax : max} ETH
          </p>
          <Button type="submit" size="sm" className="self-start px-3">
            Aplicar
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

function PriceInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-md border border-border-soft bg-secondary px-2.5 text-body-md text-foreground placeholder:text-brand-secondary focus-visible:outline-ring"
      />
    </>
  )
}
