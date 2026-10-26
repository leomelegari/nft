import { useEffect, useState } from 'react'
import {
  NFT_SORTS,
  NFT_SORT_LABELS,
  NFT_TABS,
  NFT_TAB_LABELS,
  type NftSort,
} from '@/entities/nft'
import type { ResolvedCatalogSearch } from '@/features/catalog/search-params'
import { useDebouncedValue } from '@/shared/lib/use-debounced-value'
import { cn } from '@/shared/lib/utils'

/**
 * Catalog toolbar: tabs on the left, sort on the right — matching the Figma.
 *
 * The result count used to live here too, competing with the tabs for space
 * and forcing them into a horizontally scrollable strip even on wide desktop
 * viewports (an unintentional scroll affordance nothing in the design calls
 * for). It now renders next to the pagination controls instead, where it has
 * room and reads naturally as "N resultados" beside the page buttons.
 *
 * Tabs keep roving tablist semantics and wrap instead of scrolling once their
 * own three labels no longer have to share the row with anything else.
 */
export function CatalogToolbar({
  search,
  onChange,
}: {
  search: ResolvedCatalogSearch
  onChange: (change: Partial<ResolvedCatalogSearch>) => void
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="tablist"
        aria-label="Filtrar catálogo por categoria"
        className="flex flex-wrap gap-x-6 gap-y-2"
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

      <div className="flex shrink-0 items-center gap-3">
        <label
          htmlFor="catalog-sort"
          className="hidden shrink-0 text-body-md whitespace-nowrap text-text-secondary lg:block"
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
          className="h-9 max-w-[14rem] min-w-0 rounded-md border border-border-soft bg-secondary px-2.5 text-body-md text-foreground focus-visible:outline-ring"
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

/** How long the field waits after the last keystroke before searching. */
const SEARCH_DEBOUNCE_MS = 300

export function CatalogSearchField({
  id,
  value,
  onSearch,
  className,
}: {
  /**
   * The field is rendered twice — once in the mobile header, once in the
   * desktop sidebar — so the id must be supplied by the caller. A duplicated
   * id would break the label association for both.
   */
  id: string
  value: string
  /**
   * `replace` is true while the user is typing, so a search term does not
   * leave one history entry per keystroke and the back button stays usable.
   * Submitting with Enter pushes a real entry: that is the user marking a
   * search worth returning to.
   */
  onSearch: (value: string, options: { replace: boolean }) => void
  className?: string
}) {
  /** What the input shows; the user owns it while typing. */
  const [draft, setDraft] = useState(value)
  /** The last `value` this component reacted to. */
  const [lastSynced, setLastSynced] = useState(value)

  const debounced = useDebouncedValue(draft, SEARCH_DEBOUNCE_MS)

  // Adjusting state during render rather than in an effect — the documented
  // way to react to a prop change. The field must not remount: it previously
  // used `key={value}`, which was harmless when the value only changed on
  // submit but would destroy focus and caret position on every keystroke now.
  if (value !== lastSynced) {
    setLastSynced(value)
    // Adopt only changes that came from somewhere else — cleared filters, or
    // back/forward — never this field's own echo returning through the URL.
    // The echo always equals the debounced value that caused it, so anything
    // typed while it was in flight survives.
    if (value !== debounced) setDraft(value)
  }

  useEffect(() => {
    // Still settling: pushing a stale value here would undo a submit that
    // beat the timer.
    if (debounced !== draft) return
    // Already applied, which is also the loop guard — `onSearch` gets a new
    // identity on every navigation, including the one it just caused.
    if (debounced === value) return

    onSearch(debounced, { replace: true })
  }, [debounced, draft, value, onSearch])

  return (
    <form
      role="search"
      className={cn('relative w-full', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(draft, { replace: false })
      }}
    >
      <label htmlFor={id} className="sr-only">
        Buscar NFTs por título, criador ou descrição
      </label>
      <input
        id={id}
        name="q"
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
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
