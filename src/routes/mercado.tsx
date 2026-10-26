import { useCallback } from 'react'
import { createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchNfts } from '@/features/catalog/api'
import { useCatalogQuery, useFacetsQuery } from '@/features/catalog/queries'
import {
  DEFAULT_PAGE_SIZE,
  buildSearch,
  catalogSearchSchema,
  EMPTY_SEARCH,
  hasActiveFilters,
  resolveSearch,
  toApiParams,
  withFilterChange,
  type CatalogSearch,
  type ResolvedCatalogSearch,
} from '@/features/catalog/search-params'
import { CatalogPagination } from '@/features/catalog/pagination'
import { CatalogToolbar } from '@/features/catalog/toolbar'
import { ActiveFilterChips } from '@/features/catalog/market/active-chips'
import { MarketFilterBar } from '@/features/catalog/market/filter-bar'
import { MarketGrid } from '@/features/catalog/market/market-grid'
import { MarketStats } from '@/features/catalog/market/market-stats'

/**
 * Mercado: the dense browsing surface over the same catalog the home screen
 * shows off.
 *
 * It deliberately shares the whole data layer with `/` — same endpoint, same
 * query, same URL-state helpers — and differs only in presentation: filters
 * sit in a horizontal bar instead of a 310px sidebar, the freed width buys a
 * fourth column of results, and a stats strip plus a removable-chip row make
 * the current slice of the market legible at a glance.
 */
export const Route = createFileRoute('/mercado')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    const params = toApiParams(resolveSearch(deps.search))
    return context.queryClient.ensureQueryData({
      queryKey: queryKeys.nfts.list(params),
      queryFn: ({ signal }) => fetchNfts(params, signal),
    })
  },
  component: MarketPage,
})

function MarketPage() {
  const search = resolveSearch(Route.useSearch())
  const navigate = useNavigate({ from: '/mercado' })
  const href = useRouterState({ select: (state) => state.location.href })

  const catalog = useCatalogQuery(search)
  const facets = useFacetsQuery(search)

  const applySearch = useCallback(
    (next: CatalogSearch) => {
      void navigate({ search: next as never, resetScroll: false })
    },
    [navigate],
  )

  /** Any filter change resets pagination; see `withFilterChange`. */
  const changeFilter = useCallback(
    (change: Partial<ResolvedCatalogSearch>) =>
      applySearch(withFilterChange(search, change)),
    [applySearch, search],
  )

  const changePage = useCallback(
    (page: number) => {
      applySearch(buildSearch({ ...search, page }))
      document.getElementById('resultados')?.scrollIntoView({ block: 'start' })
    },
    [applySearch, search],
  )

  const clearFilters = useCallback(() => applySearch(EMPTY_SEARCH), [applySearch])

  /** Favouriting needs a session; send the visitor back here afterwards. */
  const requireAuth = useCallback(() => {
    void navigate({ to: '/entrar', search: { redirect: href } })
  }, [navigate, href])

  const hasFilters = hasActiveFilters(search)
  const meta = catalog.data?.meta

  return (
    <div className="mx-auto flex w-full max-w-shell flex-col gap-6 px-5 py-6 lg:py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-body-2xl font-bold text-foreground uppercase lg:text-[34px]">
          Mercado
        </h1>
        <p className="max-w-prose text-body text-text-secondary">
          Todo o acervo da Kurio em um só lugar. Filtre, ordene e compare antes de
          colecionar.
        </p>
      </div>

      <MarketStats
        total={meta?.total}
        facets={facets.data}
        isLoading={facets.isPending}
      />

      <MarketFilterBar
        search={search}
        facets={facets.data}
        isLoading={facets.isPending}
        onChange={changeFilter}
      />

      <ActiveFilterChips
        search={search}
        onChange={changeFilter}
        onClearAll={clearFilters}
      />

      <section id="resultados" className="flex scroll-mt-24 flex-col gap-6">
        <h2 className="sr-only">Resultados</h2>

        <CatalogToolbar search={search} onChange={changeFilter} />

        <MarketGrid
          nfts={catalog.data?.data ?? []}
          isPending={catalog.isPending}
          isFetching={catalog.isFetching && !catalog.isPending}
          error={catalog.error}
          skeletonCount={DEFAULT_PAGE_SIZE}
          onRetry={() => void catalog.refetch()}
          onClearFilters={clearFilters}
          hasFilters={hasFilters}
          onRequireAuth={requireAuth}
        />

        {meta && (
          <CatalogPagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            onChange={changePage}
          />
        )}
      </section>
    </div>
  )
}
