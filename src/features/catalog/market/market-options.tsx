import { useState } from 'react'
import { CheckIcon, LayoutGridIcon, LinkIcon, ListIcon } from 'lucide-react'
import { AVAILABILITY_LABELS } from '@/entities/nft'
import {
  MARKET_PAGE_SIZES,
  MARKET_VIEWS,
  MARKET_VIEW_LABELS,
  type MarketPageSize,
  type MarketView,
  type ResolvedMarketSearch,
} from '@/features/catalog/market/market-search-params'
import { cn } from '@/shared/lib/utils'

const VIEW_ICONS: Record<MarketView, typeof LayoutGridIcon> = {
  grid: LayoutGridIcon,
  list: ListIcon,
}

/**
 * Grid/list switch.
 *
 * Two buttons with `aria-pressed` rather than a styled checkbox: the state is
 * "which of these two is on", and the icons alone would communicate the
 * current view by colour, which section 8 forbids as a sole indicator — hence
 * the labels for assistive technology.
 */
export function MarketViewToggle({
  view,
  onChange,
}: {
  view: MarketView
  onChange: (view: MarketView) => void
}) {
  return (
    <div
      role="group"
      aria-label="Modo de exibição"
      className="flex h-11 items-center gap-1 rounded-xl border border-border-soft bg-secondary p-1"
    >
      {MARKET_VIEWS.map((option) => {
        const Icon = VIEW_ICONS[option]
        const active = view === option

        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className={cn(
              'flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-ring',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-text-secondary hover:text-foreground',
            )}
          >
            <Icon className="size-4.5" aria-hidden="true" />
            <span className="sr-only">{MARKET_VIEW_LABELS[option]}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * The options row: what to show, how many at a time, and a way to take the
 * current view with you.
 *
 * All three are URL state, which is what makes the copy-link button worth
 * having at all — the address already describes the exact slice on screen.
 */
export function MarketOptions({
  search,
  onChange,
}: {
  search: ResolvedMarketSearch
  onChange: (change: Partial<ResolvedMarketSearch>) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
      <label className="flex cursor-pointer items-center gap-2 text-body-md text-text-secondary transition-colors hover:text-foreground">
        <input
          type="checkbox"
          checked={search.availability === 'available'}
          onChange={(event) =>
            onChange({ availability: event.target.checked ? 'available' : 'all' })
          }
          className="size-4 shrink-0 rounded-sm border-border-soft accent-primary focus-visible:outline-ring"
        />
        {AVAILABILITY_LABELS.available}
      </label>

      <div className="flex items-center gap-2">
        <label
          htmlFor="market-page-size"
          className="text-body-md whitespace-nowrap text-text-secondary"
        >
          Por página:
        </label>
        <select
          id="market-page-size"
          value={search.pageSize}
          onChange={(event) =>
            onChange({ pageSize: Number(event.target.value) as MarketPageSize })
          }
          className="h-9 rounded-md border border-border-soft bg-secondary px-2.5 text-body-md text-foreground tabular-nums focus-visible:outline-ring"
        >
          {MARKET_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <CopyLinkButton />
    </div>
  )
}

/**
 * Copies the current address.
 *
 * Every filter, the sort, the view and the page are already in the URL, so
 * this shares the exact screen the user is looking at. The Clipboard API can
 * reject — denied permission, or a non-secure context — so the failure is
 * reported instead of leaving the button silently doing nothing.
 */
function CopyLinkButton() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void copy()}
        className="flex items-center gap-2 rounded-md px-1 text-body-md text-text-secondary transition-colors hover:text-text-accent focus-visible:outline-ring"
      >
        {state === 'copied' ? (
          <CheckIcon className="size-4" aria-hidden="true" />
        ) : (
          <LinkIcon className="size-4" aria-hidden="true" />
        )}
        Copiar link
      </button>

      <span role="status" aria-live="polite" className="text-caption-lg text-text-accent">
        {state === 'copied' && 'Link copiado'}
        {state === 'failed' && (
          <span className="text-danger">Não foi possível copiar</span>
        )}
      </span>
    </div>
  )
}
