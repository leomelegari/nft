import {
  COLLECTION_LABELS,
  NETWORK_LABELS,
  NFT_TAB_LABELS,
  type CollectionSlug,
  type Network,
} from '@/entities/nft'
import type { ResolvedCatalogSearch } from '@/features/catalog/search-params'

/**
 * One removable filter.
 *
 * `change` is the partial search update that removes *just* this filter, so
 * the chip never has to know how the rest of the state is assembled.
 */
export interface FilterChip {
  key: string
  label: string
  change: Partial<ResolvedCatalogSearch>
}

/**
 * Describes the active filters as chips, in the order a reader scans them.
 *
 * Kept as a pure function over the resolved search state: the whole point of
 * holding catalog state in the URL is that what is active is derivable, never
 * tracked separately.
 */
export function buildActiveFilterChips(search: ResolvedCatalogSearch): FilterChip[] {
  const chips: FilterChip[] = []

  if (search.tab !== 'all') {
    chips.push({
      key: 'tab',
      label: NFT_TAB_LABELS[search.tab],
      change: { tab: 'all' },
    })
  }

  if (search.q) {
    chips.push({ key: 'q', label: `"${search.q}"`, change: { q: '' } })
  }

  for (const slug of search.collection) {
    chips.push({
      key: `collection:${slug}`,
      label: COLLECTION_LABELS[slug],
      change: {
        collection: search.collection.filter((item: CollectionSlug) => item !== slug),
      },
    })
  }

  for (const network of search.network) {
    chips.push({
      key: `network:${network}`,
      label: NETWORK_LABELS[network],
      change: { network: search.network.filter((item: Network) => item !== network) },
    })
  }

  if (search.minPrice || search.maxPrice) {
    chips.push({
      key: 'price',
      label: priceLabel(search.minPrice, search.maxPrice),
      change: { minPrice: undefined, maxPrice: undefined },
    })
  }

  return chips
}

function priceLabel(min: string | undefined, max: string | undefined): string {
  if (min && max) return `${min} – ${max} ETH`
  if (min) return `a partir de ${min} ETH`
  return `até ${max} ETH`
}
