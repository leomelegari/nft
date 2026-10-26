import { useCallback } from 'react'
import { createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchNfts } from '@/features/catalog/api'
import { useCatalogQuery, useFacetsQuery } from '@/features/catalog/queries'
import { CatalogPagination } from '@/features/catalog/pagination'
import { CatalogToolbar } from '@/features/catalog/toolbar'
import { ActiveFilterChips } from '@/features/catalog/market/active-chips'
import { MarketFilterBar } from '@/features/catalog/market/filter-bar'
import { MarketOptions, MarketViewToggle } from '@/features/catalog/market/market-options'
import { MarketResults } from '@/features/catalog/market/market-results'
import { MarketStats } from '@/features/catalog/market/market-stats'
import { MarketPending } from '@/features/catalog/catalog-pending'
import {
  EMPTY_MARKET_SEARCH,
  buildMarketSearch,
  marketSearchSchema,
  resolveMarketSearch,
  toMarketApiParams,
  withMarketFilterChange,
  withViewChange,
  type MarketSearch,
  type ResolvedMarketSearch,
} from '@/features/catalog/market/market-search-params'
import {
  useFocusSearchRequest,
  useSearchShortcut,
} from '@/features/catalog/market/use-search-focus'

/** The search field lives in the filter bar; the shortcut needs its id. */
const SEARCH_FIELD_ID = 'market-search'

/**
 * Mercado: the dense browsing surface over the same catalog the home screen
 * shows off.
 *
 * It deliberately shares the whole data layer with `/` — same endpoint, same
 * query, same URL-state helpers — and differs in presentation and in what it
 * lets the user decide: filters sit in a horizontal bar of popovers instead of
 * a 310px sidebar, the width that frees up buys a fourth column, and the view,
 * page size and availability filter are the reader's to choose.
 *
 * All of it is URL state, which is why "copiar link" is worth offering: the
 * address already describes the exact slice on screen.
 */
export const Route = createFileRoute('/mercado')({
  validateSearch: marketSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    const params = toMarketApiParams(resolveMarketSearch(deps.search))
    return context.queryClient.ensureQueryData({
      queryKey: queryKeys.nfts.list(params),
      queryFn: ({ signal }) => fetchNfts(params, signal),
    })
  },
  pendingComponent: MarketPending,
  component: MarketPage,
})

function MarketPage() {
  const search = resolveMarketSearch(Route.useSearch())
  const navigate = useNavigate({ from: '/mercado' })
  const href = useRouterState({ select: (state) => state.location.href })

  useSearchShortcut(SEARCH_FIELD_ID)
  useFocusSearchRequest(SEARCH_FIELD_ID)

  const catalog = useCatalogQuery(toMarketApiParams(search))
  const facets = useFacetsQuery({
    q: search.q,
    tab: search.tab,
    availability: search.availability,
  })

  const applySearch = useCallback(
    (next: MarketSearch, { replace = false }: { replace?: boolean } = {}) => {
      void navigate({ search: next as never, resetScroll: false, replace })
    },
    [navigate],
  )

  /** Any filter change resets pagination; see `withMarketFilterChange`. */
  const changeFilter = useCallback(
    (change: Partial<ResolvedMarketSearch>, options?: { replace?: boolean }) =>
      applySearch(withMarketFilterChange(search, change), options),
    [applySearch, search],
  )

  /**
   * Typing replaces the current history entry rather than pushing one; see
   * `CatalogSearchField`.
   */
  const changeQuery = useCallback(
    (q: string, options: { replace: boolean }) => changeFilter({ q }, options),
    [changeFilter],
  )

  /** Changing the layout is not a filter change, so it keeps the page. */
  const changeView = useCallback(
    (view: ResolvedMarketSearch['view']) => applySearch(withViewChange(search, view)),
    [applySearch, search],
  )

  const changePage = useCallback(
    (page: number) => {
      applySearch(buildMarketSearch({ ...search, page }))
      document.getElementById('resultados')?.scrollIntoView({ block: 'start' })
    },
    [applySearch, search],
  )

  const clearFilters = useCallback(() => applySearch(EMPTY_MARKET_SEARCH), [applySearch])

  /** Favouriting needs a session; send the visitor back here afterwards. */
  const requireAuth = useCallback(() => {
    void navigate({ to: '/entrar', search: { redirect: href } })
  }, [navigate, href])

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
        searchFieldId={SEARCH_FIELD_ID}
        search={search}
        facets={facets.data}
        isLoading={facets.isPending}
        onChange={changeFilter}
        onSearch={changeQuery}
        trailing={<MarketViewToggle view={search.view} onChange={changeView} />}
      />

      <ActiveFilterChips
        search={search}
        onChange={changeFilter}
        onClearAll={clearFilters}
      />

      <section id="resultados" className="flex scroll-mt-24 flex-col gap-6">
        <h2 className="sr-only">Resultados</h2>

        <CatalogToolbar search={search} onChange={changeFilter} />

        <MarketOptions search={search} onChange={changeFilter} />

        <MarketResults
          nfts={catalog.data?.data ?? []}
          view={search.view}
          isPending={catalog.isPending}
          isFetching={catalog.isFetching && !catalog.isPending}
          error={catalog.error}
          skeletonCount={search.pageSize}
          onRetry={() => void catalog.refetch()}
          onClearFilters={clearFilters}
          hasFilters={hasMarketFilters(search)}
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

/**
 * Whether the empty state should offer "limpar filtros".
 *
 * Availability counts: narrowing to what is buyable can empty the results on
 * its own, and the offer has to be able to undo it.
 */
function hasMarketFilters(search: ResolvedMarketSearch): boolean {
  return (
    Boolean(
      search.q ||
      search.collection.length ||
      search.network.length ||
      search.minPrice ||
      search.maxPrice,
    ) ||
    search.tab !== 'all' ||
    search.availability !== 'all'
  )
}
