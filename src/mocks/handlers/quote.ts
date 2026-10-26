import { http, HttpResponse } from 'msw'
import { quoteInputSchema, type Cart, type QuoteIssue } from '@/entities/cart'
import { addEth, mulEth, percentOfEth, subEth, toEth, eqEth } from '@/shared/money'
import { getDb, mutateDb, nextId } from '@/mocks/db/store'
import { buildCart, cartSubtotal } from '@/mocks/db/cart'
import { findCoupon, isExpired } from '@/mocks/db/coupons'
import { getScenario } from '@/mocks/scenarios'
import type { MockQuote } from '@/mocks/db/types'
import { fail, handler, ownerKeyFor, parseBody } from '@/mocks/handlers/support'
import { emitNftUpdated } from '@/mocks/socket/events'

/** Deterministic fee so totals are stable across runs and visual baselines. */
const FEE_BASE = '0.0035'
const FEE_PER_ITEM = '0.0009'
const QUOTE_TTL_MS = 5 * 60 * 1000

function networkFeeFor(cart: Cart) {
  return addEth(toEth(FEE_BASE), mulEth(toEth(FEE_PER_ITEM), cart.items.length))
}

/**
 * Applies the scenario-driven mutations that simulate the catalog moving under
 * the user's feet. The NFT version is bumped so the change is indistinguishable
 * from one delivered by a `nft.updated` socket event.
 */
function applyScenarioDrift(cart: Cart): void {
  const { behavior } = getScenario()
  if (!behavior.priceChangeOnQuote && !behavior.soldOutOnQuote) return
  if (cart.items.length === 0) return

  const changed = mutateDb((draft) => {
    const touched: typeof draft.nfts = []
    for (const [index, line] of cart.items.entries()) {
      const nft = draft.nfts.find((item) => item.id === line.nftId)
      const edition = nft?.editions.find((item) => item.id === line.editionId)
      if (!nft || !edition) continue

      if (behavior.priceChangeOnQuote) {
        // +12%, enough to be unmistakable in the summary.
        edition.priceEth = toEth((Number(edition.priceEth) * 1.12).toFixed(4))
      }

      if (behavior.soldOutOnQuote && index === 0) {
        edition.available = 0
      }

      nft.available = nft.editions.reduce((sum, item) => sum + item.available, 0)
      const cheapest = nft.editions.reduce((low, item) =>
        Number(item.priceEth) < Number(low.priceEth) ? item : low,
      )
      nft.priceEth = cheapest.priceEth
      nft.version += 1
      touched.push(nft)
    }

    return touched
  })

  // The REST change and the event announcing it are published together, so
  // they cannot disagree.
  for (const nft of changed) emitNftUpdated(nft)
}

/**
 * Compares the cart against the baseline the user last saw. Any difference is
 * an issue, and a quote carrying issues cannot be used to create an order.
 */
function diffIssues(baseline: MockQuote['snapshot'], cart: Cart): QuoteIssue[] {
  const issues: QuoteIssue[] = []

  for (const entry of baseline) {
    const line = cart.items.find((item) => item.id === entry.cartItemId)

    if (!line) {
      issues.push({
        kind: 'sold-out',
        cartItemId: entry.cartItemId,
        title: 'Item removido',
        previousPriceEth: toEth(entry.unitPriceEth),
        currentPriceEth: null,
        previousQuantity: entry.quantity,
        currentQuantity: 0,
      })
      continue
    }

    if (!eqEth(line.unitPriceEth, toEth(entry.unitPriceEth))) {
      issues.push({
        kind: 'price-changed',
        cartItemId: line.id,
        title: line.title,
        previousPriceEth: toEth(entry.unitPriceEth),
        currentPriceEth: line.unitPriceEth,
        previousQuantity: entry.quantity,
        currentQuantity: line.quantity,
      })
    }

    if (line.available === 0) {
      issues.push({
        kind: 'sold-out',
        cartItemId: line.id,
        title: line.title,
        previousPriceEth: toEth(entry.unitPriceEth),
        currentPriceEth: line.unitPriceEth,
        previousQuantity: entry.quantity,
        currentQuantity: 0,
      })
    } else if (line.available < line.quantity) {
      issues.push({
        kind: 'availability-reduced',
        cartItemId: line.id,
        title: line.title,
        previousPriceEth: toEth(entry.unitPriceEth),
        currentPriceEth: line.unitPriceEth,
        previousQuantity: entry.quantity,
        currentQuantity: line.available,
      })
    }
  }

  return issues
}

export const quoteHandlers = [
  /**
   * POST rather than GET: issuing a quote creates a server-side pricing
   * document that the order endpoint later validates by id.
   *
   * Open to visitors as well as signed-in users: the cart screen is public and
   * has to show a truthful subtotal, discount, network fee and total. Only
   * order creation requires a session.
   */
  http.post(
    '/api/cart/quote',
    handler(async ({ request }) => {
      const ownerKey = ownerKeyFor(request)
      const input = await parseBody(request, quoteInputSchema)

      const before = buildCart(ownerKey)
      const baseline: MockQuote['snapshot'] = before.items.map((item) => ({
        cartItemId: item.id,
        unitPriceEth: item.unitPriceEth,
        quantity: item.quantity,
      }))

      applyScenarioDrift(before)

      const cart = buildCart(ownerKey)
      const subtotal = cartSubtotal(cart)

      let coupon = null
      if (input.couponCode && input.couponCode.length > 0) {
        const match = findCoupon(input.couponCode)
        if (!match) {
          fail('COUPON_INVALID', 'Cupom inválido. Confira o código e tente novamente.', {
            fields: { couponCode: 'Cupom inválido' },
          })
        }
        if (isExpired(match)) {
          fail('COUPON_EXPIRED', 'Este cupom expirou.', {
            fields: { couponCode: 'Cupom expirado' },
          })
        }
        coupon = {
          code: match.code,
          description: match.description,
          percentOff: match.percentOff,
        }
      }

      const discount = coupon ? percentOfEth(subtotal, coupon.percentOff) : toEth('0')
      const networkFee = networkFeeFor(cart)
      const total = addEth(subEth(subtotal, discount), networkFee)

      // The previous quote is the baseline when one exists, so a change that
      // happened between two checkout visits is also caught.
      const previous = getDb().quotes.find((item) => item.ownerKey === ownerKey)
      const issues = diffIssues(previous?.snapshot ?? baseline, cart)

      const now = new Date()
      const quote: MockQuote = {
        id: nextId('qt'),
        ownerKey,
        cartVersion: cart.version,
        subtotalEth: subtotal,
        discountEth: discount,
        networkFeeEth: networkFee,
        totalEth: total,
        coupon,
        issues,
        issuedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString(),
        snapshot: cart.items.map((item) => ({
          cartItemId: item.id,
          unitPriceEth: item.unitPriceEth,
          quantity: item.quantity,
        })),
      }

      mutateDb((draft) => {
        draft.quotes = draft.quotes.filter((item) => item.ownerKey !== ownerKey)
        draft.quotes.push(quote)
      })

      const { ownerKey: _ownerKey, snapshot: _snapshot, ...wire } = quote
      return HttpResponse.json(wire)
    }),
  ),
]
