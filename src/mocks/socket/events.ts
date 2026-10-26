import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/entities/events'
import type { MockNft } from '@/mocks/db/types'
import type { Order } from '@/entities/order'
import { publish } from '@/mocks/socket/registry'

let sequence = 0

function nextEventId(): string {
  sequence += 1
  return `evt_${String(sequence).padStart(6, '0')}`
}

/**
 * Announces a catalog change.
 *
 * Carries the NFT's current version, which the client uses to drop duplicates
 * and late deliveries. Broadcast (`sessionId: null`) because catalog data is
 * public.
 */
export function emitNftUpdated(nft: MockNft): void {
  const event: NftUpdatedEvent = {
    type: 'nft.updated',
    eventId: nextEventId(),
    resourceId: nft.id,
    version: nft.version,
    occurredAt: new Date().toISOString(),
    sessionId: null,
    payload: {
      priceEth: nft.priceEth,
      available: nft.available,
      editions: nft.editions.map((edition) => ({
        id: edition.id,
        priceEth: edition.priceEth,
        available: edition.available,
      })),
    },
  }

  publish(event)
}

/** Announces an order state change to the session that owns it. */
export function emitOrderUpdated(order: Order, socketSessionId: string | null): void {
  const event: OrderUpdatedEvent = {
    type: 'order.updated',
    eventId: nextEventId(),
    resourceId: order.id,
    version: order.version,
    occurredAt: new Date().toISOString(),
    sessionId: socketSessionId,
    payload: {
      status: order.status,
      settledAt: order.settledAt,
      declineReason: order.declineReason,
    },
  }

  publish(event)
}

/**
 * Re-emits an event verbatim. Used by the mock control plane to exercise the
 * client's duplicate handling with a genuinely identical delivery.
 */
export function republish(event: NftUpdatedEvent | OrderUpdatedEvent): void {
  publish(event)
}
