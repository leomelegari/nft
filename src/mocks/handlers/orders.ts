import { http, HttpResponse, delay } from 'msw'
import { createOrderInputSchema, type Order } from '@/entities/order'
import { getDb, mutateDb, nextId } from '@/mocks/db/store'
import { buildCart } from '@/mocks/db/cart'
import { getScenario } from '@/mocks/scenarios'
import { fail, handler, parseBody, requireAuth } from '@/mocks/handlers/support'

/** How long an order stays `pending` before the simulation settles it. */
export const SETTLEMENT_DELAY_MS = 2500

function hashPayload(value: unknown): string {
  const json = JSON.stringify(value)
  let hash = 0x811c9dc5
  for (let i = 0; i < json.length; i += 1) {
    hash ^= json.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16)
}

function simulatedTxReference(): string {
  return `0x${nextId('tx').replace(/\D/g, '').padEnd(40, '0').slice(0, 40)}`
}

/**
 * Settles a pending order once its delay has elapsed.
 *
 * Called from `GET /orders/:id` so the flow is complete before the Socket.IO
 * layer lands; from step 9 onward the socket event is the primary notification
 * and this remains the reconciliation path used after a refresh or reconnect.
 */
export function settleIfDue(orderId: string): void {
  mutateDb((draft) => {
    const order = draft.orders.find((item) => item.id === orderId)
    if (!order || order.status !== 'pending') return

    const elapsed = Date.now() - new Date(order.createdAt).getTime()
    if (elapsed < SETTLEMENT_DELAY_MS) return

    const outcome = getScenario().behavior.paymentOutcome
    order.status = outcome
    order.settledAt = new Date().toISOString()
    order.declineReason =
      outcome === 'declined'
        ? 'A carteira recusou a transação. Nenhum valor foi debitado.'
        : null
    order.version += 1
  })
}

function toWireOrder(order: Order & { userId: string }): Order {
  const { userId: _userId, ...wire } = order
  return wire
}

export const orderHandlers = [
  http.post(
    '/api/orders',
    handler(async ({ request }) => {
      const { user } = requireAuth(request)

      const idempotencyKey = request.headers.get('Idempotency-Key')
      if (!idempotencyKey) {
        fail('VALIDATION_ERROR', 'Chave de idempotência ausente.')
      }

      const input = await parseBody(request, createOrderInputSchema)
      const requestHash = hashPayload(input)

      /**
       * Replay handling. Same key + same payload returns the original order, so
       * a double click or a retry after a timeout never creates a second
       * purchase. Same key + different payload is a conflict.
       */
      const replay = getDb().idempotency.find(
        (record) => record.key === idempotencyKey && record.userId === user.id,
      )
      if (replay) {
        if (replay.requestHash !== requestHash) {
          fail(
            'IDEMPOTENCY_CONFLICT',
            'Esta chave de idempotência já foi usada com outro conteúdo.',
          )
        }
        settleIfDue(replay.orderId)
        const existing = getDb().orders.find((item) => item.id === replay.orderId)
        if (!existing) fail('NOT_FOUND', 'Pedido não encontrado.')
        return HttpResponse.json(toWireOrder(existing), { status: 200 })
      }

      const quote = getDb().quotes.find(
        (item) => item.id === input.quoteId && item.ownerKey === user.id,
      )
      if (!quote) {
        fail('QUOTE_STALE', 'Cotação não encontrada. Revise o pedido e tente novamente.')
      }
      if (new Date(quote.expiresAt) <= new Date()) {
        fail('QUOTE_STALE', 'Cotação expirada. Revise os valores e confirme novamente.')
      }
      if (quote.issues.length > 0) {
        fail('QUOTE_STALE', 'Os valores mudaram. Revise o pedido antes de confirmar.', {
          details: { issues: quote.issues },
        })
      }

      const cart = buildCart(user.id)
      if (cart.items.length === 0) {
        fail('VALIDATION_ERROR', 'Seu carrinho está vazio.')
      }
      if (cart.version !== quote.cartVersion) {
        fail('QUOTE_STALE', 'O carrinho mudou desde a cotação. Revise o pedido.')
      }

      const wallet = user.wallets.find((item) => item.id === input.walletId)
      if (!wallet) {
        fail('NOT_FOUND', 'Carteira não encontrada.', {
          fields: { walletId: 'Selecione uma carteira cadastrada' },
        })
      }
      if (wallet.network !== input.network) {
        fail('VALIDATION_ERROR', 'A carteira selecionada não opera nesta rede.', {
          fields: { network: 'Rede incompatível com a carteira' },
        })
      }

      // Final availability check against live stock, after every other gate.
      const db = getDb()
      for (const line of cart.items) {
        const edition = db.nfts
          .find((item) => item.id === line.nftId)
          ?.editions.find((item) => item.id === line.editionId)

        if (!edition || edition.available < line.quantity) {
          fail('AVAILABILITY_CONFLICT', `"${line.title}" não tem estoque suficiente.`, {
            details: { cartItemId: line.id, available: edition?.available ?? 0 },
          })
        }
      }

      const order = mutateDb((draft) => {
        // Decrement stock and bump versions so connected clients see the change.
        for (const line of cart.items) {
          const nft = draft.nfts.find((item) => item.id === line.nftId)
          const edition = nft?.editions.find((item) => item.id === line.editionId)
          if (!nft || !edition) continue
          edition.available -= line.quantity
          nft.available = nft.editions.reduce((sum, item) => sum + item.available, 0)
          nft.version += 1
        }

        // Only the purchased lines and quantities leave the cart.
        const target = draft.carts.find((item) => item.ownerKey === user.id)
        if (target) {
          for (const line of cart.items) {
            const stored = target.items.find((item) => item.id === line.id)
            if (!stored) continue
            stored.quantity -= line.quantity
          }
          target.items = target.items.filter((item) => item.quantity > 0)
          target.updatedAt = new Date().toISOString()
          target.version += 1
        }

        const created: Order & { userId: string } = {
          id: nextId('ord'),
          userId: user.id,
          reference: simulatedTxReference(),
          status: 'pending',
          items: cart.items.map((line) => ({
            nftId: line.nftId,
            nftSlug: line.nftSlug,
            title: line.title,
            image: line.image,
            imageAlt: line.imageAlt,
            editionId: line.editionId,
            editionLabel: line.editionLabel,
            network: line.network,
            unitPriceEth: line.unitPriceEth,
            quantity: line.quantity,
            lineTotalEth: line.lineTotalEth,
          })),
          subtotalEth: quote.subtotalEth,
          discountEth: quote.discountEth,
          networkFeeEth: quote.networkFeeEth,
          totalEth: quote.totalEth,
          coupon: quote.coupon,
          collector: input.collector,
          wallet: {
            label: wallet.label,
            provider: wallet.provider,
            network: wallet.network,
            address: wallet.address,
          },
          explorerUrl: `https://explorer.simulado.greenmint.test/tx/${simulatedTxReference()}`,
          declineReason: null,
          createdAt: new Date().toISOString(),
          settledAt: null,
          version: 1,
        }

        draft.orders.push(created)
        draft.quotes = draft.quotes.filter((item) => item.ownerKey !== user.id)
        draft.idempotency.push({
          key: idempotencyKey,
          userId: user.id,
          requestHash,
          orderId: created.id,
          createdAt: created.createdAt,
        })

        return created
      })

      /**
       * Timeout scenario: the order is already persisted above, so retrying
       * with the same idempotency key recovers it instead of buying twice.
       */
      if (getScenario().behavior.orderCreationTimeout) {
        await delay('infinite')
      }

      return HttpResponse.json(toWireOrder(order), { status: 201 })
    }),
  ),

  http.get<{ orderId: string }>(
    '/api/orders/:orderId',
    handler(({ request, params }) => {
      const { user } = requireAuth(request)
      settleIfDue(params.orderId)

      const order = getDb().orders.find((item) => item.id === params.orderId)
      if (!order) {
        fail('NOT_FOUND', 'Pedido não encontrado.')
      }
      // Ownership check: a valid id from another account must not be readable.
      if (order.userId !== user.id) {
        fail('FORBIDDEN', 'Você não tem acesso a este pedido.')
      }

      return HttpResponse.json(toWireOrder(order))
    }),
  ),

  http.get(
    '/api/orders',
    handler(({ request }) => {
      const { user } = requireAuth(request)
      const orders = getDb()
        .orders.filter((item) => item.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      for (const order of orders) settleIfDue(order.id)

      return HttpResponse.json({
        data: getDb()
          .orders.filter((item) => item.userId === user.id)
          .map(toWireOrder),
        meta: {
          page: 1,
          pageSize: orders.length || 1,
          total: orders.length,
          totalPages: 1,
        },
      })
    }),
  ),
]
