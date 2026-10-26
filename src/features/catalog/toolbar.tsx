import {
  NFT_SORTS,
  NFT_SORT_LABELS,
  NFT_TABS,
  NFT_TAB_LABELS,
  type NftSort,
} from '@/entities/nft'
import type { ResolvedCatalogSearch } from '@/features/catalog/search-params'
import { cn } from '@/shared/lib/utils'

/**
 * Catalog toolbar: tabs on the left, sort on the right.
 *
 * In the Figma the three tab labels sit 20px apart with no padding and collide
 * on narrow viewports; here they are a scrollable tablist with real spacing and
 * roving semantics.
 */
export function CatalogToolbar({
  search,
  total,
  onChange,
}: {
  search: ResolvedCatalogSearch
  total: number | undefined
  onChange: (change: Partial<ResolvedCatalogSearch>) => void
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/*
        `min-w-0` lets the tablist scroll instead of pushing into the sort
        controls; without it the flex row shrinks the tabs and the two groups
        collide, which is what the Figma toolbar does at this width.
      */}
      <div
        role="tablist"
        aria-label="Filtrar catálogo por categoria"
        className="-mx-1 flex min-w-0 flex-1 gap-6 overflow-x-auto px-1 pb-1"
      >
        {NFT_TABS.map((tab) => {
          const active = search.tab === tab
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange({ tab })}
              className={cn(
                'relative shrink-0 rounded-sm pb-1.5 text-body-lg whitespace-nowrap transition-colors',
                active
                  ? 'font-bold text-text-accent'
                  : 'text-foreground hover:text-text-accent',
              )}
            >
              {NFT_TAB_LABELS[tab]}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-text-accent"
                />
              )}
            </button>
          )
        })}
      </div>

      {/*
        The sort group must be allowed to shrink. Pinning it with `shrink-0`
        pushed 109px of horizontal overflow onto the page at 1024px, which
        section 8 explicitly forbids.
      */}
      <div className="flex min-w-0 items-center gap-3">
        {total !== undefined && (
          <p className="hidden text-caption-lg whitespace-nowrap text-text-secondary tabular-nums xl:block">
            {total} {total === 1 ? 'resultado' : 'resultados'}
          </p>
        )}
        <label
          htmlFor="catalog-sort"
          className="hidden shrink-0 text-body-md whitespace-nowrap text-text-secondary xl:block"
        >
          Ordenar por:
        </label>
        <span className="sr-only" id="catalog-sort-hint">
          Ordenar catálogo por
        </span>
        <select
          id="catalog-sort"
          aria-labelledby="catalog-sort-hint"
          value={search.sort}
          onChange={(event) => onChange({ sort: event.target.value as NftSort })}
          className="h-9 min-w-0 flex-1 truncate rounded-md border border-border-soft bg-secondary px-2.5 text-body-md text-foreground focus-visible:outline-ring lg:max-w-[14rem]"
        >
          {NFT_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {NFT_SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export function CatalogSearchField({
  id,
  value,
  onSubmit,
  className,
}: {
  /**
   * The field is rendered twice — once in the mobile header, once in the
   * desktop sidebar — so the id must be supplied by the caller. A duplicated
   * id would break the label association for both.
   */
  id: string
  value: string
  onSubmit: (value: string) => void
  className?: string
}) {
  return (
    <form
      role="search"
      className={cn('relative w-full', className)}
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        onSubmit(String(data.get('q') ?? ''))
      }}
    >
      <label htmlFor={id} className="sr-only">
        Buscar NFTs por título, criador ou descrição
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={value}
        key={value}
        placeholder="Explorar coleções"
        className="h-12 w-full rounded-xl border border-border-soft bg-card pr-4 pl-11 text-body-lg text-foreground placeholder:text-brand-secondary focus-visible:outline-ring"
      />
      <SearchGlyph />
    </form>
  )
}

function SearchGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-text-secondary"
      fill="none"
    >
      <circle cx="9" cy="9" r="6.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m14 14 3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
