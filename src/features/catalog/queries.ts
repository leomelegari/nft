import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchFacets, fetchNfts } from '@/features/catalog/api'
import { toApiParams, type ResolvedCatalogSearch } from '@/features/catalog/search-params'

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
 */
export function useCatalogQuery(search: ResolvedCatalogSearch) {
  const params = toApiParams(search)

  return useQuery({
    queryKey: queryKeys.nfts.list(params),
    queryFn: ({ signal }) => fetchNfts(params, signal),
    placeholderData: keepPreviousData,
  })
}

/** Facets depend only on the text query; selections do not narrow the counts. */
export function useFacetsQuery(search: ResolvedCatalogSearch) {
  const params = { q: search.q, tab: search.tab }

  return useQuery({
    queryKey: queryKeys.nfts.facets(params),
    queryFn: ({ signal }) => fetchFacets(params, signal),
    staleTime: 60_000,
  })
}
