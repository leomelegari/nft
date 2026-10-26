import type { QueryClient } from '@tanstack/react-query'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/entities/events'
import type { Cart } from '@/entities/cart'
import type { NftDetail, NftListResponse } from '@/entities/nft'
import type { Order } from '@/entities/order'
import { isTerminalStatus } from '@/entities/order'
import { mulEth } from '@/shared/money'
import { queryKeys } from '@/shared/api/query-keys'

/**
 * Writes a catalog change into every cache entry that shows it.
 *
 * Updating in place rather than invalidating keeps the user's scroll position
 * and avoids a network round trip for data the event already carries.
 */
export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent): void {
  const { resourceId, version, payload } = event

  // Catalog pages.
  queryClient.setQueriesData<NftListResponse>(
    { queryKey: ['nfts', 'list'] },
    (current) => {
      if (!current?.data.some((nft) => nft.id === resourceId)) return current
      return {
        ...current,
        data: current.data.map((nft) =>
          nft.id === resourceId
            ? {
                ...nft,
                priceEth: payload.priceEth,
                available: payload.available,
                version,
              }
            : nft,
        ),
      }
    },
  )

  // Detail pages, keyed by slug rather than id.
  queryClient.setQueriesData<NftDetail>({ queryKey: ['nfts', 'detail'] }, (current) => {
    if (current?.id !== resourceId) return current
    return {
      ...current,
      priceEth: payload.priceEth,
      available: payload.available,
      version,
      editions: current.editions.map((edition) => {
        const next = payload.editions.find((item) => item.id === edition.id)
        return next
          ? { ...edition, priceEth: next.priceEth, available: next.available }
          : edition
      }),
    }
  })

  // Cart lines, with the line total recomputed from the new unit price.
  queryClient.setQueriesData<Cart>({ queryKey: ['owner'] }, (current) => {
    if (!current?.items?.some((item) => item.nftId === resourceId)) return current
    return {
      ...current,
      items: current.items.map((item) => {
        if (item.nftId !== resourceId) return item
        const edition = payload.editions.find((entry) => entry.id === item.editionId)
        if (!edition) return item
        return {
          ...item,
          unitPriceEth: edition.priceEth,
          available: edition.available,
          lineTotalEth: mulEth(edition.priceEth, item.quantity),
          version,
        }
      }),
    }
  })
}

/**
 * Writes an order state change.
 *
 * A terminal state is never overwritten: once an order is confirmed or
 * declined it cannot move again, so a late event claiming otherwise is
 * discarded even if its version is higher.
 */
export function applyOrderUpdated(
  queryClient: QueryClient,
  ownerKey: string,
  event: OrderUpdatedEvent,
): void {
  const key = queryKeys.order(ownerKey, event.resourceId)

  queryClient.setQueryData<Order>(key, (current) => {
    if (!current) return current
    if (isTerminalStatus(current.status)) return current

    return {
      ...current,
      status: event.payload.status,
      settledAt: event.payload.settledAt,
      declineReason: event.payload.declineReason,
      version: event.version,
    }
  })
}
