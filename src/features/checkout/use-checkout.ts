import { useCallback, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CollectorInput, CreateOrderInput, Order } from '@/entities/order'
import type { Quote } from '@/entities/cart'
import { ApiError, isApiError } from '@/shared/api'
import { queryKeys } from '@/shared/api/query-keys'
import { useOwnerKey } from '@/features/auth/queries'
import { requestQuote } from '@/features/cart/api'
import { createOrder } from '@/features/orders/api'

export type CheckoutBlock =
  | { kind: 'none' }
  /** The quote moved between review and submit; the user must re-confirm. */
  | { kind: 'quote-stale'; quote: Quote; message: string }
  | { kind: 'availability'; message: string }
  | { kind: 'error'; message: string }

/**
 * Checkout submission.
 *
 * The sequence is deliberately: re-quote → inspect → submit.
 *
 * 1. A fresh quote is requested immediately before submitting, so price,
 *    availability, coupon and fees are revalidated against the server at the
 *    last possible moment.
 * 2. If that quote carries any issue, submission is blocked and the user is
 *    shown what changed. Confirming again is a separate, deliberate action —
 *    the brief requires changes to demand a new confirmation.
 * 3. Only a clean quote is submitted, carrying the idempotency key.
 *
 * The idempotency key is generated once per checkout attempt and reused across
 * retries, which is what makes a double click, a timeout retry and a reconnect
 * all resolve to the same order instead of three purchases.
 */
export function useCheckout(couponCode: string | undefined) {
  const queryClient = useQueryClient()
  const ownerKey = useOwnerKey()

  const [block, setBlock] = useState<CheckoutBlock>({ kind: 'none' })
  const [acknowledgedQuoteId, setAcknowledgedQuoteId] = useState<string | null>(null)

  // Stable for the whole attempt, including retries after a timeout.
  const idempotencyKey = useRef<string>(crypto.randomUUID())

  /**
   * The exact body already sent under the current key.
   *
   * An idempotency key is only meaningful together with the payload it was
   * used for: the server treats the same key with different content as a
   * conflict, by design. So a retry after a timeout has to resend the
   * *identical* request — re-quoting first would produce a new quote id and
   * turn the recovery into an IDEMPOTENCY_CONFLICT instead of returning the
   * order that was already created.
   */
  const inFlightPayload = useRef<CreateOrderInput | null>(null)

  /** Starts a new attempt: used after a terminal failure, never after a timeout. */
  const resetAttempt = useCallback(() => {
    idempotencyKey.current = crypto.randomUUID()
    inFlightPayload.current = null
    setAcknowledgedQuoteId(null)
    setBlock({ kind: 'none' })
  }, [])

  const mutation = useMutation({
    mutationFn: async (input: {
      collector: CollectorInput
      walletId: string
      network: Order['wallet']['network']
    }): Promise<Order> => {
      // Recovery path: a request already went out under this key, so resend it
      // byte for byte and let the server replay the original order.
      if (inFlightPayload.current) {
        return createOrder(inFlightPayload.current, idempotencyKey.current)
      }

      // Final revalidation: price, availability, coupon and fees are checked
      // against the server at the last possible moment before submitting.
      const fresh = await requestQuote(couponCode ? { couponCode } : {})

      queryClient.setQueryData([...queryKeys.cart(ownerKey), 'quote', 'latest'], fresh)

      if (fresh.issues.length > 0 && acknowledgedQuoteId !== fresh.id) {
        throw new StaleQuoteError(fresh)
      }

      const payload: CreateOrderInput = {
        quoteId: fresh.id,
        walletId: input.walletId,
        network: input.network,
        collector: input.collector,
      }

      inFlightPayload.current = payload
      return createOrder(payload, idempotencyKey.current)
    },

    onSuccess: async () => {
      setBlock({ kind: 'none' })
      // Stock and cart both moved server-side; drop the private caches so the
      // next read reflects the purchase.
      await queryClient.invalidateQueries({ queryKey: queryKeys.cart(ownerKey) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all() })
    },

    onError: (error) => {
      /**
       * Keep the attempt alive only for failures a retry can actually fix. A
       * business rejection means this payload will never succeed, so the next
       * attempt must start from a fresh quote and a fresh key.
       */
      if (!(isApiError(error) && error.isRetryable)) {
        inFlightPayload.current = null
        idempotencyKey.current = crypto.randomUUID()
      }

      if (error instanceof StaleQuoteError) {
        setBlock({
          kind: 'quote-stale',
          quote: error.quote,
          message:
            'Os valores mudaram desde a sua revisão. Confira o resumo atualizado e confirme novamente.',
        })
        return
      }

      if (isApiError(error)) {
        if (error.code === 'QUOTE_STALE') {
          setBlock({
            kind: 'error',
            message: `${error.message} Atualize o resumo e tente novamente.`,
          })
          return
        }
        if (error.code === 'AVAILABILITY_CONFLICT') {
          setBlock({ kind: 'availability', message: error.message })
          return
        }
        setBlock({ kind: 'error', message: error.message })
        return
      }

      setBlock({
        kind: 'error',
        message: 'Não foi possível concluir a compra. Tente novamente.',
      })
    },
  })

  /** Accepts the changed numbers so the next submit is allowed through. */
  const acknowledge = useCallback(() => {
    if (block.kind === 'quote-stale') {
      setAcknowledgedQuoteId(block.quote.id)
      setBlock({ kind: 'none' })
    }
  }, [block])

  return {
    submit: mutation.mutate,
    isSubmitting: mutation.isPending,
    order: mutation.data,
    block,
    acknowledge,
    resetAttempt,
  }
}

class StaleQuoteError extends Error {
  readonly quote: Quote

  constructor(quote: Quote) {
    super('quote stale')
    this.name = 'StaleQuoteError'
    this.quote = quote
  }
}

export { ApiError }
