import { z } from 'zod'
import {
  COLLECTION_SLUGS,
  NETWORKS,
  NFT_SORTS,
  NFT_TABS,
  type CollectionSlug,
  type Network,
  type NftSort,
  type NftTab,
} from '@/entities/nft'

/**
 * Catalog state lives in the URL, not in component state.
 *
 * Search, filters, sort, tab and page are all search params, so the view
 * survives a refresh, is restored correctly by back/forward, and can be shared
 * as a link — the requirement in section 3 of the brief.
 *
 * Two deliberate choices keep those URLs usable:
 *
 * - **Defaults are never written.** The schema leaves them out and `resolve()`
 *   applies them when reading, so the canonical "nothing selected" state is a
 *   bare `/` rather than `/?tab=all&sort=recent&page=1`.
 * - **Multi-selects are comma separated.** `?collection=musica,jogos` instead
 *   of a JSON-encoded array, which is readable, shorter, and what a person
 *   would expect to be able to hand-edit.
 */
export const DEFAULT_PAGE_SIZE = 9

function csv<T extends string>(allowed: readonly T[]) {
  return z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      }
      return value
    }, z.array(z.string()).optional())
    .transform((list) =>
      list?.filter((item): item is T => (allowed as readonly string[]).includes(item)),
    )
    .transform((list) => (list && list.length > 0 ? list : undefined))
}

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  collection: csv(COLLECTION_SLUGS).catch(undefined),
  network: csv(NETWORKS).catch(undefined),
  minPrice: z.string().optional().catch(undefined),
  maxPrice: z.string().optional().catch(undefined),
  tab: z.enum(NFT_TABS).optional().catch(undefined),
  sort: z.enum(NFT_SORTS).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
})

/** What the URL carries. Every field is optional. */
export type CatalogSearch = z.infer<typeof catalogSearchSchema>

/** The same state with defaults applied, which is what the UI reads. */
export interface ResolvedCatalogSearch {
  q: string
  collection: CollectionSlug[]
  network: Network[]
  minPrice: string | undefined
  maxPrice: string | undefined
  tab: NftTab
  sort: NftSort
  page: number
}

export function resolveSearch(search: CatalogSearch): ResolvedCatalogSearch {
  return {
    q: search.q ?? '',
    collection: search.collection ?? [],
    network: search.network ?? [],
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    tab: search.tab ?? 'all',
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
  }
}

const DEFAULTS: Record<string, unknown> = { tab: 'all', sort: 'recent', page: 1 }

/**
 * Produces the next search object: defaults removed, arrays joined, empties
 * dropped. The result is what gets pushed to the router.
 */
export function buildSearch(next: Partial<ResolvedCatalogSearch>): CatalogSearch {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(next)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      out[key] = value.join(',')
      continue
    }
    if (DEFAULTS[key] === value) continue
    out[key] = value
  }

  return out as CatalogSearch
}

/**
 * Any change to a filtering dimension resets pagination — otherwise a user on
 * page 7 who narrows the results lands on an empty page.
 */
export function withFilterChange(
  current: ResolvedCatalogSearch,
  change: Partial<ResolvedCatalogSearch>,
): CatalogSearch {
  return buildSearch({ ...current, ...change, page: 1 })
}

/** The query string actually sent to the API. */
export function toApiParams(search: ResolvedCatalogSearch) {
  return {
    q: search.q,
    collection: search.collection.join(','),
    network: search.network.join(','),
    minPrice: search.minPrice ?? '',
    maxPrice: search.maxPrice ?? '',
    tab: search.tab,
    sort: search.sort,
    page: search.page,
    pageSize: DEFAULT_PAGE_SIZE,
  }
}

export function hasActiveFilters(search: ResolvedCatalogSearch): boolean {
  return Boolean(
    search.q ||
    search.collection.length ||
    search.network.length ||
    search.minPrice ||
    search.maxPrice ||
    search.tab !== 'all',
  )
}
