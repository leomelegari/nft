import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { Quote } from '@/entities/cart'
import { formatEthExact } from '@/shared/money'
import { isApiError } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { SkeletonBlock } from '@/shared/ui/skeleton-primitives'

/**
 * Wallet summary.
 *
 * Every figure comes from the API quote — subtotal, discount, network fee and
 * total are never recomputed on the client. The brief is explicit that the
 * API response is the reference for finalising the order, so deriving them
 * here would risk showing a total the server would not honour.
 *
 * All lines are rendered at full precision rather than rounded to two
 * decimals. Rounding only the parts makes the summary fail to reconcile: a
 * 10% discount on 1.98 is 0.198, and showing it as "0.20" invites the user to
 * compute a total 0.002 ETH away from the one they will be charged.
 */
export function CartSummary({
  quote,
  isLoading,
  error,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  checkoutDisabled,
}: {
  quote: Quote | undefined
  isLoading: boolean
  error: unknown
  appliedCoupon: string | undefined
  onApplyCoupon: (code: string) => void
  onRemoveCoupon: () => void
  checkoutDisabled: boolean
}) {
  const [code, setCode] = useState(appliedCoupon ?? '')

  // A coupon failure arrives as a quote error; the rest of the summary is then
  // unavailable, so the message belongs next to the field that caused it.
  const couponError =
    isApiError(error) &&
    (error.code === 'COUPON_INVALID' || error.code === 'COUPON_EXPIRED')
      ? error.message
      : null

  const otherError =
    error && !couponError
      ? isApiError(error)
        ? error.message
        : 'Não foi possível calcular o resumo.'
      : null

  return (
    <aside aria-labelledby="summary-heading" className="flex flex-col gap-6">
      <div>
        <h2 id="summary-heading" className="text-body-2xl font-bold text-foreground">
          Resumo da carteira
        </h2>
        <hr className="mt-3 border-border" />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          onApplyCoupon(code.trim())
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor="coupon" className="text-body font-bold text-foreground">
          Código promocional
        </label>
        <div className="flex items-stretch">
          <input
            id="coupon"
            name="coupon"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Digite o código promocional..."
            aria-invalid={Boolean(couponError)}
            aria-describedby={couponError ? 'coupon-error' : undefined}
            className="h-10 min-w-0 flex-1 rounded-l-[3px] border border-r-0 border-primary bg-card px-3 text-caption text-foreground placeholder:text-brand-secondary focus-visible:outline-ring aria-invalid:border-danger"
          />
          <Button type="submit" className="h-10 shrink-0 rounded-l-none px-4 font-bold">
            Aplicar
          </Button>
        </div>

        {couponError && (
          <p id="coupon-error" role="alert" className="text-caption text-danger">
            {couponError}
          </p>
        )}

        {quote?.coupon && (
          <p className="flex flex-wrap items-center gap-2 text-caption text-success">
            {quote.coupon.code} aplicado — {quote.coupon.description}
            <button
              type="button"
              onClick={() => {
                setCode('')
                onRemoveCoupon()
              }}
              className="rounded-sm text-text-accent underline"
            >
              Remover
            </button>
          </p>
        )}
      </form>

      <dl className="flex flex-col gap-3">
        <Row
          label="Subtotal"
          isLoading={isLoading}
          value={quote && formatEthExact(quote.subtotalEth)}
        />
        <Row
          label="Desconto do lançamento"
          isLoading={isLoading}
          value={quote && `(-) ${formatEthExact(quote.discountEth)}`}
        />
        <div>
          <Row
            label="Taxa de rede"
            isLoading={isLoading}
            value={quote && formatEthExact(quote.networkFeeEth)}
          />
          <p className="mt-1.5 text-right text-caption text-text-accent">Taxa estimada</p>
        </div>
      </dl>

      <div className="flex items-start justify-between gap-3">
        <dt className="text-body-lg font-bold text-foreground">Total</dt>
        <dd className="text-body-2xl font-bold text-text-accent">
          {isLoading && !quote ? (
            <SkeletonBlock className="h-5 w-24" rounded="sm" />
          ) : (
            ((quote && formatEthExact(quote.totalEth)) ?? '—')
          )}
        </dd>
      </div>

      {otherError && (
        <p role="alert" className="text-caption-lg text-danger">
          {otherError}
        </p>
      )}

      <div className="flex flex-col items-center gap-3">
        <Button
          asChild={!checkoutDisabled}
          disabled={checkoutDisabled}
          className="h-10 w-full font-bold"
        >
          {checkoutDisabled ? (
            <span>Conectar e finalizar</span>
          ) : (
            <Link to="/pagamento">Conectar e finalizar</Link>
          )}
        </Button>
        <Link to="/" hash="catalogo" className="rounded-sm text-body-md text-text-accent">
          Continuar explorando
        </Link>
      </div>
    </aside>
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
    <div className="flex items-start justify-between gap-3">
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
