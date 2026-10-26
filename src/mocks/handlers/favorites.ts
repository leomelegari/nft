import { http, HttpResponse } from 'msw'
import { getDb, mutateDb } from '@/mocks/db/store'
import { fail, handler, requireAuth } from '@/mocks/handlers/support'

/**
 * Favourites are per-user and require authentication, so the optimistic toggle
 * in the UI has a real server round-trip to roll back against.
 */
export const favoriteHandlers = [
  http.get(
    '/api/favorites',
    handler(({ request }) => {
      const { user } = requireAuth(request)
      const db = getDb()
      const ids = new Set(
        db.favorites.filter((item) => item.userId === user.id).map((item) => item.nftId),
      )

      const data = db.nfts
        .filter((nft) => ids.has(nft.id))
        .map((nft) => ({
          id: nft.id,
          slug: nft.slug,
          title: nft.title,
          priceEth: nft.priceEth,
          image: nft.image,
          imageAlt: nft.imageAlt,
          collection: nft.collection,
          network: nft.network,
          available: nft.available,
          version: nft.version,
        }))

      return HttpResponse.json({
        data,
        meta: { page: 1, pageSize: data.length || 1, total: data.length, totalPages: 1 },
      })
    }),
  ),

  http.put<{ nftId: string }>(
    '/api/favorites/:nftId',
    handler(({ request, params }) => {
      const { user } = requireAuth(request)

      if (!getDb().nfts.some((nft) => nft.id === params.nftId)) {
        fail('NOT_FOUND', 'NFT não encontrado.')
      }

      mutateDb((draft) => {
        const exists = draft.favorites.some(
          (item) => item.userId === user.id && item.nftId === params.nftId,
        )
        if (!exists) draft.favorites.push({ userId: user.id, nftId: params.nftId })
      })

      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.delete<{ nftId: string }>(
    '/api/favorites/:nftId',
    handler(({ request, params }) => {
      const { user } = requireAuth(request)

      mutateDb((draft) => {
        draft.favorites = draft.favorites.filter(
          (item) => !(item.userId === user.id && item.nftId === params.nftId),
        )
      })

      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
