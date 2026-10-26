import { http, HttpResponse } from 'msw'
import { addCartItemInputSchema, updateCartItemInputSchema } from '@/entities/cart'
import { getDb, mutateDb, nextId } from '@/mocks/db/store'
import { buildCart, ensureCart, mergeGuestCart, touchCart } from '@/mocks/db/cart'
import {
  fail,
  handler,
  optionalAuth,
  ownerKeyFor,
  parseBody,
} from '@/mocks/handlers/support'

export const cartHandlers = [
  http.get(
    '/api/cart',
    handler(({ request }) => HttpResponse.json(buildCart(ownerKeyFor(request)))),
  ),

  http.post(
    '/api/cart/items',
    handler(async ({ request }) => {
      const ownerKey = ownerKeyFor(request)
      const input = await parseBody(request, addCartItemInputSchema)

      const nft = getDb().nfts.find((item) => item.id === input.nftId)
      const edition = nft?.editions.find((item) => item.id === input.editionId)
      if (!nft || !edition) {
        fail('NOT_FOUND', 'Edição não encontrada para este NFT.')
      }

      const cart = ensureCart(ownerKey)
      const existing = cart.items.find(
        (item) => item.nftId === nft.id && item.editionId === edition.id,
      )
      const requested = (existing?.quantity ?? 0) + input.quantity

      if (edition.available === 0) {
        fail('AVAILABILITY_CONFLICT', `"${nft.title}" está esgotado nesta edição.`, {
          details: { editionId: edition.id, available: 0 },
        })
      }

      if (requested > edition.available) {
        fail(
          'AVAILABILITY_CONFLICT',
          `Restam apenas ${edition.available} unidades desta edição.`,
          { details: { editionId: edition.id, available: edition.available } },
        )
      }

      if (requested > edition.maxPerOrder) {
        fail(
          'VALIDATION_ERROR',
          `O limite é de ${edition.maxPerOrder} unidades por pedido.`,
          { fields: { quantity: `Máximo de ${edition.maxPerOrder} por pedido` } },
        )
      }

      mutateDb((draft) => {
        const target = draft.carts.find((item) => item.ownerKey === ownerKey)
        if (!target) return
        const line = target.items.find(
          (item) => item.nftId === nft.id && item.editionId === edition.id,
        )
        if (line) {
          line.quantity = requested
        } else {
          target.items.push({
            id: nextId('ci'),
            nftId: nft.id,
            editionId: edition.id,
            quantity: input.quantity,
            addedAt: new Date().toISOString(),
          })
        }
      })

      touchCart(ownerKey)
      return HttpResponse.json(buildCart(ownerKey), { status: 201 })
    }),
  ),

  http.patch<{ itemId: string }>(
    '/api/cart/items/:itemId',
    handler(async ({ request, params }) => {
      const ownerKey = ownerKeyFor(request)
      const input = await parseBody(request, updateCartItemInputSchema)

      const cart = ensureCart(ownerKey)
      const line = cart.items.find((item) => item.id === params.itemId)
      if (!line) {
        fail('NOT_FOUND', 'Item não encontrado no carrinho.')
      }

      const nft = getDb().nfts.find((item) => item.id === line.nftId)
      const edition = nft?.editions.find((item) => item.id === line.editionId)
      if (!edition) {
        fail('NOT_FOUND', 'Edição não encontrada para este item.')
      }

      if (input.quantity > edition.available) {
        fail(
          'AVAILABILITY_CONFLICT',
          `Restam apenas ${edition.available} unidades desta edição.`,
          { details: { editionId: edition.id, available: edition.available } },
        )
      }

      if (input.quantity > edition.maxPerOrder) {
        fail(
          'VALIDATION_ERROR',
          `O limite é de ${edition.maxPerOrder} unidades por pedido.`,
          {
            fields: { quantity: `Máximo de ${edition.maxPerOrder} por pedido` },
          },
        )
      }

      mutateDb((draft) => {
        const target = draft.carts.find((item) => item.ownerKey === ownerKey)
        const stored = target?.items.find((item) => item.id === params.itemId)
        if (stored) stored.quantity = input.quantity
      })

      touchCart(ownerKey)
      return HttpResponse.json(buildCart(ownerKey))
    }),
  ),

  http.delete<{ itemId: string }>(
    '/api/cart/items/:itemId',
    handler(({ request, params }) => {
      const ownerKey = ownerKeyFor(request)
      ensureCart(ownerKey)

      const removed = mutateDb((draft) => {
        const target = draft.carts.find((item) => item.ownerKey === ownerKey)
        if (!target) return false
        const before = target.items.length
        target.items = target.items.filter((item) => item.id !== params.itemId)
        return target.items.length !== before
      })

      if (!removed) {
        fail('NOT_FOUND', 'Item não encontrado no carrinho.')
      }

      touchCart(ownerKey)
      return HttpResponse.json(buildCart(ownerKey))
    }),
  ),

  /**
   * Called once right after login so the visitor's cart is preserved.
   * Idempotent: a second call with an already-merged guest id is a no-op.
   */
  http.post(
    '/api/cart/merge',
    handler(({ request }) => {
      const context = optionalAuth(request)
      if (!context) {
        fail('UNAUTHENTICATED', 'Entre na sua conta para mesclar o carrinho.')
      }

      const guestId = request.headers.get('X-Guest-Id')
      if (guestId) {
        mergeGuestCart(`guest:${guestId}`, context.user.id)
      }

      return HttpResponse.json(buildCart(context.user.id))
    }),
  ),
]
