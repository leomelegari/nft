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
import { ETH_AMOUNT_PATTERN } from '@/shared/money'

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

export function csv<T extends string>(allowed: readonly T[]) {
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

/**
 * A text param the router may have already turned into a number.
 *
 * `parseSearch` runs `JSON.parse`, while `stringifySearch` writes plain
 * strings unquoted — so `?q=395` is read back as the number 395 and
 * `?minPrice=5` as 5. `z.string()` rejected both and `.catch(undefined)`
 * swallowed them without a trace: searching for "395" silently returned the
 * whole catalog, and a price filter appeared in the URL and changed nothing.
 *
 * Writing them quoted would round-trip, but `?q=%22395%22` is not a URL
 * anyone wants to read or hand-edit, and readable URLs are the point. So the
 * schema accepts what the address actually carries and normalises it back.
 */
function textParam() {
  return z.union([z.string(), z.number()]).transform((value) => String(value))
}

/** A price bound: a decimal string, however `JSON.parse` delivered it. */
const priceParam = textParam()
  .transform((value) => value.trim())
  .refine((value) => ETH_AMOUNT_PATTERN.test(value))
  .optional()
  .catch(undefined)

export const catalogSearchSchema = z.object({
  q: textParam()
    .transform((value) => value.trim())
    .refine((value) => value.length <= 80)
    .optional()
    .catch(undefined),
  collection: csv(COLLECTION_SLUGS).catch(undefined),
  network: csv(NETWORKS).catch(undefined),
  minPrice: priceParam,
  maxPrice: priceParam,
  tab: z.enum(NFT_TABS).optional().catch(undefined),
  sort: z.enum(NFT_SORTS).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
})

/** What the URL carries. Every field is optional. */
export type CatalogSearch = z.infer<typeof catalogSearchSchema>

/**
 * "Nothing selected" — the canonical cleared state, which is a bare path.
 *
 * The cast is needed because `csv()` transforms make the inferred *output*
 * type's array fields required (as `T[] | undefined`), while the URL itself is
 * allowed to omit them entirely. An empty object is exactly what the router
 * should receive, so this is asserted once here rather than at each call site.
 */
export const EMPTY_SEARCH = {} as CatalogSearch

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

/** Values that are never written to the URL, because reading applies them. */
export const CATALOG_DEFAULTS: Record<string, unknown> = {
  tab: 'all',
  sort: 'recent',
  page: 1,
}

/**
 * Produces the next search object: defaults removed, arrays joined, empties
 * dropped. The result is what gets pushed to the router.
 *
 * `defaults` is a parameter because the market screen adds params of its own
 * (view, page size, availability) with their own default values, and they have
 * to be omitted from the URL by the same rule.
 */
export function buildSearchWith<TSearch>(
  next: Record<string, unknown>,
  defaults: Record<string, unknown>,
): TSearch {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(next)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      out[key] = value.join(',')
      continue
    }
    if (defaults[key] === value) continue
    out[key] = value
  }

  return out as TSearch
}

export function buildSearch(next: Partial<ResolvedCatalogSearch>): CatalogSearch {
  return buildSearchWith<CatalogSearch>(next, CATALOG_DEFAULTS)
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
export function toApiParams(
  search: ResolvedCatalogSearch,
  overrides: Record<string, unknown> = {},
) {
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
    ...overrides,
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
