import { z } from 'zod'
import { AVAILABILITY_FILTERS, type AvailabilityFilter } from '@/entities/nft'
import {
  CATALOG_DEFAULTS,
  buildSearchWith,
  catalogSearchSchema,
  resolveSearch,
  toApiParams,
  type ResolvedCatalogSearch,
} from '@/features/catalog/search-params'

/**
 * The market screen's URL state: the catalog's, plus the three things this
 * screen lets the user decide for themselves.
 *
 * They are search params rather than component state for the same reason the
 * filters are — the view survives a refresh, is restored by back/forward, and
 * travels in a shared link. Someone who sends "the cheap, available ones as a
 * list" sends exactly that.
 */

/** How results are laid out. */
export const MARKET_VIEWS = ['grid', 'list'] as const
export type MarketView = (typeof MARKET_VIEWS)[number]

export const MARKET_VIEW_LABELS: Record<MarketView, string> = {
  grid: 'Grade',
  list: 'Lista',
}

/**
 * Results per page. All three divide evenly into the grid's column counts, so
 * no page ends on a ragged row, and the top of the range stays under the
 * mock API's own 48-item ceiling.
 */
export const MARKET_PAGE_SIZES = [12, 24, 48] as const
export type MarketPageSize = (typeof MARKET_PAGE_SIZES)[number]

export const DEFAULT_MARKET_PAGE_SIZE: MarketPageSize = 12
const DEFAULT_MARKET_VIEW: MarketView = 'grid'
const DEFAULT_AVAILABILITY: AvailabilityFilter = 'all'

export const marketSearchSchema = catalogSearchSchema.extend({
  view: z.enum(MARKET_VIEWS).optional().catch(undefined),
  pageSize: z.coerce
    .number()
    .refine((value): value is MarketPageSize =>
      (MARKET_PAGE_SIZES as readonly number[]).includes(value),
    )
    .optional()
    .catch(undefined),
  availability: z.enum(AVAILABILITY_FILTERS).optional().catch(undefined),
})

export type MarketSearch = z.infer<typeof marketSearchSchema>

export interface ResolvedMarketSearch extends ResolvedCatalogSearch {
  view: MarketView
  pageSize: MarketPageSize
  availability: AvailabilityFilter
}

export function resolveMarketSearch(search: MarketSearch): ResolvedMarketSearch {
  return {
    ...resolveSearch(search),
    view: search.view ?? DEFAULT_MARKET_VIEW,
    pageSize: search.pageSize ?? DEFAULT_MARKET_PAGE_SIZE,
    availability: search.availability ?? DEFAULT_AVAILABILITY,
  }
}

const MARKET_DEFAULTS: Record<string, unknown> = {
  ...CATALOG_DEFAULTS,
  view: DEFAULT_MARKET_VIEW,
  pageSize: DEFAULT_MARKET_PAGE_SIZE,
  availability: DEFAULT_AVAILABILITY,
}

export function buildMarketSearch(next: Partial<ResolvedMarketSearch>): MarketSearch {
  return buildSearchWith<MarketSearch>(next, MARKET_DEFAULTS)
}

/** "Nothing selected" on the market: see `EMPTY_SEARCH`. */
export const EMPTY_MARKET_SEARCH = {} as MarketSearch

/**
 * Any change to a filtering dimension resets pagination — otherwise someone on
 * page 7 who narrows the results lands on an empty page. Page size counts as
 * one: page 7 of 12-per-page does not exist at 48 per page.
 */
export function withMarketFilterChange(
  current: ResolvedMarketSearch,
  change: Partial<ResolvedMarketSearch>,
): MarketSearch {
  return buildMarketSearch({ ...current, ...change, page: 1 })
}

/**
 * Changing how results are laid out is not a filter change, so it keeps the
 * current page: switching to the list view should not send the reader back to
 * page 1 of what they were already reading.
 */
export function withViewChange(
  current: ResolvedMarketSearch,
  view: MarketView,
): MarketSearch {
  return buildMarketSearch({ ...current, view })
}

/** The query string actually sent to the API. */
export function toMarketApiParams(search: ResolvedMarketSearch) {
  return toApiParams(search, {
    pageSize: search.pageSize,
    availability: search.availability,
  })
}
