import { z } from 'zod'
import { ethAmountSchema, isoDateSchema, versionSchema } from '@/entities/common'
import { orderStatusSchema } from '@/entities/order'

/**
 * Socket.IO event contracts.
 *
 * Every event carries a stable `eventId`, the affected `resourceId` and a
 * monotonic `version`. The client keeps the highest version it has applied per
 * resource and drops anything at or below it, which makes duplicate and
 * out-of-order delivery harmless without any effect being reapplied
 * (section 7 of the brief).
 *
 * `sessionId` scopes the event to the session that should receive it, so an
 * event produced for a previous user can never mutate another user's cache.
 */

const eventEnvelope = {
  eventId: z.string(),
  resourceId: z.string(),
  version: versionSchema,
  occurredAt: isoDateSchema,
  sessionId: z.string().nullable(),
}

export const nftUpdatedEventSchema = z.object({
  ...eventEnvelope,
  type: z.literal('nft.updated'),
  payload: z.object({
    priceEth: ethAmountSchema,
    available: z.number().int().nonnegative(),
    editions: z.array(
      z.object({
        id: z.string(),
        priceEth: ethAmountSchema,
        available: z.number().int().nonnegative(),
      }),
    ),
  }),
})
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = z.object({
  ...eventEnvelope,
  type: z.literal('order.updated'),
  payload: z.object({
    status: orderStatusSchema,
    settledAt: isoDateSchema.nullable(),
    declineReason: z.string().nullable(),
  }),
})
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export const realtimeEventSchema = z.discriminatedUnion('type', [
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
])
export type RealtimeEvent = z.infer<typeof realtimeEventSchema>

export const REALTIME_EVENT_NAMES = ['nft.updated', 'order.updated'] as const
export type RealtimeEventName = (typeof REALTIME_EVENT_NAMES)[number]
