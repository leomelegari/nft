import { useCallback } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchNfts } from '@/features/catalog/api'
import { useCatalogQuery, useFacetsQuery } from '@/features/catalog/queries'
import {
  buildSearch,
  catalogSearchSchema,
  hasActiveFilters,
  resolveSearch,
  toApiParams,
  withFilterChange,
  type CatalogSearch,
  type ResolvedCatalogSearch,
} from '@/features/catalog/search-params'
import { CatalogGrid } from '@/features/catalog/catalog-grid'
import { CatalogPagination } from '@/features/catalog/pagination'
import { FiltersPanel } from '@/features/catalog/filters-panel'
import { CatalogSearchField, CatalogToolbar } from '@/features/catalog/toolbar'
import { MobileFilters } from '@/features/catalog/mobile-filters'

/**
 * Mercado: the dense browsing surface over the same catalog the home screen
 * shows off.
 *
 * It deliberately shares the whole data layer with `/` — same endpoint, same
 * query, same URL-state helpers — and differs only in presentation. There is
 * no second catalog API, no parallel hook, and no duplicated filter logic.
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

  const catalog = useCatalogQuery(search)
  const facets = useFacetsQuery(search)

  const applySearch = useCallback(
    (next: CatalogSearch) => {
      void navigate({ search: next as never, resetScroll: false })
    },
    [navigate],
  )

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

  const hasFilters = hasActiveFilters(search)
  const meta = catalog.data?.meta

  return (
    <div className="mx-auto flex w-full max-w-shell flex-col gap-8 px-5 py-6 lg:py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-body-2xl font-bold text-foreground uppercase lg:text-[34px]">
          Mercado
        </h1>
        <p className="max-w-prose text-body text-text-secondary">
          Todo o acervo da Kurio em um só lugar. Filtre, ordene e compare antes de
          colecionar.
        </p>
      </div>

      <CatalogSearchField
        id="market-search-mobile"
        value={search.q}
        onSubmit={(value) => changeFilter({ q: value })}
        className="lg:hidden"
      />

      <section id="resultados" className="scroll-mt-24">
        <h2 className="sr-only">Resultados do mercado</h2>

        <div className="grid gap-8 lg:grid-cols-[310px_1fr]">
          <div className="hidden flex-col gap-6 lg:flex">
            <CatalogSearchField
              id="market-search-desktop"
              value={search.q}
              onSubmit={(value) => changeFilter({ q: value })}
            />
            <FiltersPanel
              search={search}
              facets={facets.data}
              isLoading={facets.isPending}
              onChange={changeFilter}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex items-center gap-3 lg:hidden">
              <MobileFilters
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
              onClearFilters={() => applySearch({} as CatalogSearch)}
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
