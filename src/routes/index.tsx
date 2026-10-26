import { useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchNfts } from '@/features/catalog/api'
import { useCatalogQuery, useFacetsQuery } from '@/features/catalog/queries'
import {
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
import { CatalogHero } from '@/features/catalog/hero'
import { HomePending } from '@/features/catalog/catalog-pending'
import { CatalogGrid } from '@/features/catalog/catalog-grid'
import { CatalogPagination } from '@/features/catalog/pagination'
import { FiltersPanel } from '@/features/catalog/filters-panel'
import { CatalogSearchField, CatalogToolbar } from '@/features/catalog/toolbar'
import { MobileFilters } from '@/features/catalog/mobile-filters'

export const Route = createFileRoute('/')({
  // Validated search params are the single source of catalog state. An invalid
  // or hand-edited URL falls back to the schema defaults instead of crashing.
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) => {
    const params = toApiParams(resolveSearch(deps.search))
    // Warm the cache so a direct hit renders data on first paint rather than
    // flashing skeletons.
    return context.queryClient.ensureQueryData({
      queryKey: queryKeys.nfts.list(params),
      queryFn: ({ signal }) => fetchNfts(params, signal),
    })
  },
  pendingComponent: HomePending,
  component: HomePage,
})

function HomePage() {
  const search = resolveSearch(Route.useSearch())
  const navigate = useNavigate({ from: '/' })

  const catalog = useCatalogQuery(toApiParams(search))
  const facets = useFacetsQuery({ q: search.q, tab: search.tab })

  const applySearch = useCallback(
    (next: CatalogSearch, { replace = false }: { replace?: boolean } = {}) => {
      void navigate({ search: next as never, resetScroll: false, replace })
    },
    [navigate],
  )

  /** Any filter change resets pagination; see `withFilterChange`. */
  const changeFilter = useCallback(
    (change: Partial<ResolvedCatalogSearch>, options?: { replace?: boolean }) =>
      applySearch(withFilterChange(search, change), options),
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

  const changePage = useCallback(
    (page: number) => {
      applySearch(buildSearch({ ...search, page }))
      document.getElementById('catalogo')?.scrollIntoView({ block: 'start' })
    },
    [applySearch, search],
  )

  const scrollToCatalog = useCallback(() => {
    document
      .getElementById('catalogo')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const hasFilters = hasActiveFilters(search)

  const meta = catalog.data?.meta

  return (
    <div className="mx-auto flex w-full max-w-shell flex-col gap-10 px-5 py-6 lg:py-8">
      <CatalogSearchField
        id="catalog-search-mobile"
        value={search.q}
        onSearch={changeQuery}
        className="lg:hidden"
      />

      <CatalogHero onExplore={scrollToCatalog} />

      <section id="catalogo" className="scroll-mt-24">
        <h2 className="sr-only">Catálogo de NFTs</h2>

        <div className="grid gap-8 lg:grid-cols-[310px_1fr]">
          <div className="hidden flex-col gap-6 lg:flex">
            <CatalogSearchField
              id="catalog-search-desktop"
              value={search.q}
              onSearch={changeQuery}
            />
            <FiltersPanel
              idPrefix="catalog-desktop"
              search={search}
              facets={facets.data}
              isLoading={facets.isPending}
              onChange={changeFilter}
            />
          </div>

          {/*
            `min-w-0` on the grid child: a `1fr` track still refuses to shrink
            below its content's min-content width, which let the toolbar push
            past the content column.
          */}
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex items-center gap-3 lg:hidden">
              <MobileFilters
                idPrefix="catalog-mobile"
                search={search}
                facets={facets.data}
                isLoading={facets.isPending}
                onChange={changeFilter}
              />
            </div>

            <CatalogToolbar search={search} onChange={changeFilter} />

            <CatalogGrid
              nfts={catalog.data?.data ?? []}
              isPending={catalog.isPending}
              isFetching={catalog.isFetching && !catalog.isPending}
              error={catalog.error}
              onRetry={() => void catalog.refetch()}
              onClearFilters={() => applySearch(EMPTY_SEARCH)}
              hasFilters={hasFilters}
            />

            {meta && (
              <CatalogPagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                onChange={changePage}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
