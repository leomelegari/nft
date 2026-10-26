import { z } from 'zod'
import { ethAmountSchema, isoDateSchema, versionSchema } from '@/entities/common'
import { networkSchema } from '@/entities/nft'
import { couponSchema } from '@/entities/cart'
import { walletProviderSchema } from '@/entities/auth'

/** `pending` is transient; `confirmed` and `declined` are terminal. */
export const ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const
export const orderStatusSchema = z.enum(ORDER_STATUSES)
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Processando',
  confirmed: 'Confirmado',
  declined: 'Recusado',
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return status === 'confirmed' || status === 'declined'
}

/**
 * Order lines are an immutable snapshot taken at creation. Later catalog
 * changes must never alter a receipt (section 4 of the brief), so these fields
 * are copied by value and never re-resolved against the NFT.
 */
export const orderItemSchema = z.object({
  nftId: z.string(),
  nftSlug: z.string(),
  title: z.string(),
  image: z.string(),
  imageAlt: z.string(),
  editionId: z.string(),
  editionLabel: z.string(),
  network: networkSchema,
  unitPriceEth: ethAmountSchema,
  quantity: z.number().int().positive(),
  lineTotalEth: ethAmountSchema,
})
export type OrderItem = z.infer<typeof orderItemSchema>

export const orderSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: orderStatusSchema,
  items: z.array(orderItemSchema),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  coupon: couponSchema.nullable(),
  collector: z.object({
    name: z.string(),
    email: z.string(),
    country: z.string(),
    city: z.string(),
  }),
  wallet: z.object({
    label: z.string(),
    provider: walletProviderSchema,
    network: networkSchema,
    address: z.string(),
  }),
  /** Simulated explorer link — never a real chain reference. */
  explorerUrl: z.string(),
  declineReason: z.string().nullable(),
  createdAt: isoDateSchema,
  settledAt: isoDateSchema.nullable(),
  version: versionSchema,
})
export type Order = z.infer<typeof orderSchema>

export const collectorInputSchema = z.object({
  name: z.string().min(2, 'Informe seu nome completo'),
  email: z.string().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
  country: z.string().min(2, 'Informe o país'),
  city: z.string().min(2, 'Informe a cidade'),
})
export type CollectorInput = z.infer<typeof collectorInputSchema>

export const createOrderInputSchema = z.object({
  /** Ties the order to the exact pricing document the user reviewed. */
  quoteId: z.string().min(1),
  walletId: z.string().min(1),
  network: networkSchema,
  collector: collectorInputSchema,
})
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>
