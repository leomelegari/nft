import { useState } from 'react'
import type { NftFacets } from '@/entities/nft'
import { formatEthLocale, toEth } from '@/shared/money'
import type { ResolvedCatalogSearch } from '@/features/catalog/search-params'
import { Button } from '@/shared/ui/button'
import { SkeletonBlock } from '@/shared/ui/skeleton-primitives'
import { cn } from '@/shared/lib/utils'

/**
 * The individual filter controls, shared by the home sidebar (`FiltersPanel`)
 * and the market screen's filter bar.
 *
 * The two surfaces arrange filtering very differently — a vertical sidebar
 * versus horizontal popovers — but a checkbox row and a price range mean the
 * same thing in both. Keeping the controls here is what lets the market look
 * different without forking the behaviour.
 */

/**
 * A single filter option.
 *
 * A real checkbox rather than the plain text of the Figma, so it is reachable
 * by keyboard and announces its checked state — the design communicates
 * selection by colour alone, which section 8 forbids. The accent colour is
 * kept as an additional, not sole, indicator.
 */
export function FilterCheckboxRow({
  label,
  count,
  checked,
  isLoading,
  onToggle,
}: {
  label: string
  count: number | undefined
  checked: boolean
  isLoading: boolean
  onToggle: () => void
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 py-1.5 text-body-md transition-colors',
        checked
          ? 'font-bold text-text-accent'
          : 'text-text-secondary hover:text-foreground',
      )}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="size-4 shrink-0 rounded-sm border-border-soft text-text-accent accent-primary focus-visible:outline-ring"
        />
        {label}
      </span>
      {isLoading && count === undefined ? (
        <SkeletonBlock className="h-3.5 w-8" rounded="sm" />
      ) : (
        <span className="font-bold tabular-nums">({count ?? 0})</span>
      )}
    </label>
  )
}

/**
 * Price range inputs plus the explicit "Aplicar" step.
 *
 * The Figma shows a two-handle slider with an Apply button. Two number inputs
 * plus Apply express the same state, are operable by keyboard and screen
 * reader without a custom widget, and keep the explicit apply step the design
 * specifies — a dual-handle slider was not worth the accessibility cost here.
 *
 * `idPrefix` is required because this renders on more than one surface at a
 * time (the desktop sidebar stays mounted while the mobile filter dialog is
 * open). Hard-coded input ids would collide and break the label association
 * for every copy.
 */
export function PriceRangeFields({
  idPrefix,
  search,
  facets,
  onChange,
}: {
  idPrefix: string
  search: ResolvedCatalogSearch
  facets: NftFacets | undefined
  onChange: (change: Partial<ResolvedCatalogSearch>) => void
}) {
  const bounds = facets?.priceRange
  const [min, setMin] = useState(search.minPrice ?? '')
  const [max, setMax] = useState(search.maxPrice ?? '')

  const placeholderMin = bounds ? formatEthLocale(bounds.min) : '0,00'
  const placeholderMax = bounds ? formatEthLocale(bounds.max) : '0,00'

  function apply(event: React.FormEvent) {
    event.preventDefault()
    onChange({
      minPrice: min.trim() === '' ? undefined : toEth(min.replace(',', '.')),
      maxPrice: max.trim() === '' ? undefined : toEth(max.replace(',', '.')),
    })
  }

  return (
    <form onSubmit={apply} className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <PriceInput
          id={`${idPrefix}-price-min`}
          label="Preço mínimo em ETH"
          placeholder={placeholderMin}
          value={min}
          onChange={setMin}
        />
        <span aria-hidden="true" className="text-text-secondary">
          –
        </span>
        <PriceInput
          id={`${idPrefix}-price-max`}
          label="Preço máximo em ETH"
          placeholder={placeholderMax}
          value={max}
          onChange={setMax}
        />
      </div>
      <p className="text-body-md text-foreground">
        Preço: {min === '' ? placeholderMin : min} - {max === '' ? placeholderMax : max}{' '}
        ETH
      </p>
      <Button type="submit" size="sm" className="self-start px-3">
        Aplicar
      </Button>
    </form>
  )
}

function PriceInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-md border border-border-soft bg-secondary px-2.5 text-body-md text-foreground placeholder:text-brand-secondary focus-visible:outline-ring"
      />
    </>
  )
}
