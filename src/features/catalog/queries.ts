import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchFacets, fetchNfts } from '@/features/catalog/api'

/**
 * Catalog listing.
 *
 * The API params are part of the query key, so a response that arrives late for
 * a superseded set of filters is written to *its own* cache entry and never
 * rendered — the out-of-order requirement is satisfied structurally rather than
 * by tracking request ids. `signal` additionally aborts the in-flight request,
 * so a superseded page does not keep occupying a connection.
 *
 * `keepPreviousData` holds the previous page visible while the next one loads,
 * which avoids the grid collapsing to skeletons on every pagination click.
 *
 * Params are passed in rather than derived here, because the home and market
 * screens send different ones (the market adds page size and availability)
 * while sharing this one query.
 */
export function useCatalogQuery(params: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.nfts.list(params),
    queryFn: ({ signal }) => fetchNfts(params, signal),
    placeholderData: keepPreviousData,
  })
}

/**
 * Facet counts.
 *
 * Callers pass only the dimensions that should narrow the counts — the text
 * query, the tab, and on the market the availability filter. The collection
 * and network selections are deliberately left out, so picking one collection
 * does not zero out every other row.
 */
export function useFacetsQuery(params: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.nfts.facets(params),
    queryFn: ({ signal }) => fetchFacets(params, signal),
    staleTime: 60_000,
  })
}
