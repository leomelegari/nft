import { Link } from '@tanstack/react-router'
import type { Cart, Quote, QuoteIssue } from '@/entities/cart'
import { formatEthExact } from '@/shared/money'
import { Artwork } from '@/shared/ui/artwork'
import { SkeletonBlock } from '@/shared/ui/skeleton-primitives'

/**
 * "Seus NFTs" — the review panel.
 *
 * Every figure comes from the quote, at full precision so the parts reconcile
 * with the total (see the cart summary for why).
 */
export function ReviewSummary({
  cart,
  quote,
  isLoading,
}: {
  cart: Cart | undefined
  quote: Quote | undefined
  isLoading: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-body-xl font-bold text-foreground">Seus NFTs</h2>

      <div className="flex items-center justify-between text-body-lg text-foreground">
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>
      <hr className="border-border" />

      <ul className="flex flex-col gap-3">
        {cart?.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-md bg-card p-1 pr-4"
          >
            <Artwork
              src={item.image}
              alt={item.imageAlt}
              className="size-[70px] rounded-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-lg font-bold text-foreground">
                {item.title}
              </p>
              <p className="truncate text-body text-brand-secondary">
                {item.editionLabel}
              </p>
            </div>
            <span className="shrink-0 text-body text-text-secondary">
              (x {item.quantity})
            </span>
            <span className="shrink-0 text-body-2xl font-bold text-text-accent">
              {formatEthExact(item.lineTotalEth)}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-center text-body text-foreground">
        Tem um código promocional?{' '}
        <Link to="/carrinho" className="text-text-accent underline">
          Aplique no carrinho
        </Link>
      </p>

      <dl className="flex flex-col gap-3">
        <Row
          label="Subtotal"
          value={quote && formatEthExact(quote.subtotalEth)}
          isLoading={isLoading}
        />
        <Row
          label="Desconto do lançamento"
          value={quote && `(-) ${formatEthExact(quote.discountEth)}`}
          isLoading={isLoading}
        />
        <Row
          label="Taxa de rede"
          value={quote && formatEthExact(quote.networkFeeEth)}
          isLoading={isLoading}
        />
      </dl>

      <p className="text-center text-caption text-text-accent">Taxa estimada</p>
      <hr className="border-border" />

      <div className="flex items-center justify-between gap-3">
        <span className="text-body-lg font-bold text-foreground">Total</span>
        <span className="text-body-2xl font-bold text-text-accent">
          {isLoading && !quote ? (
            <SkeletonBlock className="h-5 w-24" rounded="sm" />
          ) : (
            ((quote && formatEthExact(quote.totalEth)) ?? '—')
          )}
        </span>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  isLoading,
}: {
  label: string
  value: string | undefined
  isLoading: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-body-md text-foreground">{label}</dt>
      <dd className="text-right text-body-2xl text-foreground tabular-nums">
        {isLoading && !value ? (
          <SkeletonBlock className="h-5 w-20" rounded="sm" />
        ) : (
          (value ?? '—')
        )}
      </dd>
    </div>
  )
}

/**
 * What changed between review and submit.
 *
 * Shown when the final revalidation finds a difference. Confirming again is a
 * separate action, which is what the brief means by requiring a new
 * confirmation after a change.
 */
export function QuoteIssuesNotice({
  issues,
  message,
  onAcknowledge,
}: {
  issues: QuoteIssue[]
  message: string
  onAcknowledge: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-md border border-warning/50 bg-warning/10 p-4"
    >
      <h3 className="text-body-lg font-bold text-warning">O pedido mudou</h3>
      <p className="text-body text-foreground">{message}</p>

      <ul className="flex flex-col gap-2">
        {issues.map((issue, index) => (
          <li
            key={`${issue.cartItemId}-${index}`}
            className="text-body text-text-secondary"
          >
            <strong className="text-foreground">{issue.title}</strong>:{' '}
            {issue.kind === 'price-changed' &&
              `preço alterado de ${formatEthExact(issue.previousPriceEth ?? ('0' as never))} para ${formatEthExact(issue.currentPriceEth ?? ('0' as never))}`}
            {issue.kind === 'availability-reduced' &&
              `restam apenas ${issue.currentQuantity} unidades (você pediu ${issue.previousQuantity})`}
            {issue.kind === 'sold-out' && 'esgotado'}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAcknowledge}
        className="self-start rounded-md bg-primary px-4 py-2 text-body font-bold text-primary-foreground focus-visible:outline-ring"
      >
        Revisei os novos valores
      </button>
    </div>
  )
}
