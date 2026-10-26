import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { CartItem } from '@/entities/cart'
import { formatEth } from '@/shared/money'
import { isApiError } from '@/shared/api'
import { Artwork } from '@/shared/ui/artwork'
import { QuantityStepper } from '@/features/nft/quantity-stepper'
import { useRemoveCartItem, useUpdateCartItem } from '@/features/cart/queries'

/**
 * One cart line.
 *
 * Rendered as a table row on desktop and a stacked card on mobile by the same
 * component, so the two can never drift. Quantity and removal both go through
 * the server, which can reject them — the error is shown on the line rather
 * than as a page-level banner, so the user knows which item it refers to.
 */
export function CartRow({ item }: { item: CartItem }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const [error, setError] = useState<string | null>(null)

  const max = Math.min(item.available, item.maxPerOrder)
  const busy = update.isPending || remove.isPending

  function changeQuantity(quantity: number) {
    setError(null)
    update.mutate(
      { itemId: item.id, quantity },
      {
        onError: (mutationError) =>
          setError(
            isApiError(mutationError)
              ? mutationError.message
              : 'Não foi possível alterar a quantidade.',
          ),
      },
    )
  }

  function removeItem() {
    setError(null)
    remove.mutate(item.id, {
      onError: (mutationError) =>
        setError(
          isApiError(mutationError)
            ? mutationError.message
            : 'Não foi possível remover este item.',
        ),
    })
  }

  return (
    <li className="rounded-md bg-card">
      <div className="grid grid-cols-[70px_minmax(0,1fr)] items-center gap-4 p-3 lg:grid-cols-[70px_minmax(0,1fr)_7rem_9rem_7rem_2.5rem] lg:gap-5 lg:p-0 lg:pr-6">
        <Artwork
          src={item.image}
          alt={item.imageAlt}
          className="size-[70px] rounded-md"
        />

        <div className="min-w-0">
          <h3 className="truncate text-body-lg font-bold text-foreground">
            <Link
              to="/nft/$slug"
              params={{ slug: item.nftSlug }}
              className="rounded-sm transition-colors hover:text-text-accent"
            >
              {item.title}
            </Link>
          </h3>
          <p className="truncate text-body text-brand-secondary">{item.editionLabel}</p>
        </div>

        {/* Mobile: price and totals stack under the title. */}
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 lg:hidden">
          <span className="text-body-lg font-bold text-text-secondary">
            {formatEth(item.unitPriceEth)}
          </span>
          <QuantityStepper
            value={item.quantity}
            max={Math.max(1, max)}
            disabled={busy}
            onChange={changeQuantity}
            label={`Quantidade de ${item.title}`}
          />
          <span className="text-body-lg font-bold text-text-accent">
            {formatEth(item.lineTotalEth)}
          </span>
          <RemoveButton title={item.title} disabled={busy} onClick={removeItem} />
        </div>

        <span className="hidden text-body-lg font-bold text-text-secondary lg:block">
          {formatEth(item.unitPriceEth)}
        </span>

        <div className="hidden lg:block">
          <QuantityStepper
            value={item.quantity}
            max={Math.max(1, max)}
            disabled={busy}
            onChange={changeQuantity}
            label={`Quantidade de ${item.title}`}
          />
        </div>

        <span className="hidden text-body-lg font-bold text-text-accent lg:block">
          {formatEth(item.lineTotalEth)}
        </span>

        <div className="hidden lg:block">
          <RemoveButton title={item.title} disabled={busy} onClick={removeItem} />
        </div>
      </div>

      {(error || item.available < item.quantity) && (
        <p
          role="alert"
          className="px-3 pb-3 text-caption-lg text-danger lg:px-0 lg:pl-[90px]"
        >
          {error ??
            `Restam apenas ${item.available} unidades desta edição. Ajuste a quantidade para continuar.`}
        </p>
      )}
    </li>
  )
}

function RemoveButton({
  title,
  disabled,
  onClick,
}: {
  title: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Remover ${title} do carrinho`}
      className="rounded-sm p-1 text-text-secondary transition-colors hover:text-danger focus-visible:outline-ring disabled:opacity-40"
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
        <path
          d="M4.5 6.5h15M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5M6.5 6.5l.8 11.3A2 2 0 0 0 9.3 19.7h5.4a2 2 0 0 0 2-1.9l.8-11.3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
