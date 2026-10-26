import { XIcon } from 'lucide-react'
import type { ResolvedCatalogSearch } from '@/features/catalog/search-params'
import { buildActiveFilterChips } from '@/features/catalog/market/filter-chips'

/**
 * The active-filter row.
 *
 * The sidebar on the home screen shows what is selected by the state of its
 * own checkboxes. The market puts its filters behind popovers, so without
 * this row a narrowed result set would have no visible explanation — and no
 * way to undo one filter without opening the popover it came from.
 */
export function ActiveFilterChips({
  search,
  onChange,
  onClearAll,
}: {
  search: ResolvedCatalogSearch
  onChange: (change: Partial<ResolvedCatalogSearch>) => void
  onClearAll: () => void
}) {
  const chips = buildActiveFilterChips(search)

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <h2 className="sr-only">Filtros ativos</h2>

      <ul className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li key={chip.key}>
            <button
              type="button"
              onClick={() => onChange(chip.change)}
              className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 py-1 pr-2 pl-3 text-caption-lg font-medium text-text-accent transition-colors hover:bg-primary/20 focus-visible:outline-ring"
            >
              {chip.label}
              <XIcon className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Remover filtro</span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClearAll}
        className="rounded-sm px-1 text-caption-lg text-text-secondary underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-ring"
      >
        Limpar tudo
      </button>
    </div>
  )
}
