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
    displayName: z.string(),
    username: z.string(),
    email: z.string(),
    profileName: z.string(),
    referralCode: z.string(),
    note: z.string(),
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

/**
 * Collector details captured at checkout, mirroring the fields in the Figma
 * payment form.
 *
 * The design marks every field required, including "Código de indicação" and
 * "Nome ENS". A referral code cannot be mandatory — nobody without one could
 * ever buy — so only the fields the order genuinely needs are required here.
 * See ARCHITECTURE.md.
 */
export const collectorInputSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição'),
  username: z
    .string()
    .trim()
    .min(3, 'Informe um nome de usuário com ao menos 3 caracteres')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Use apenas letras, números, ponto, hífen ou underscore'),
  email: z.string().trim().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
  profileName: z.string().trim().max(60, 'Máximo de 60 caracteres').default(''),
  referralCode: z.string().trim().max(32, 'Máximo de 32 caracteres').default(''),
  note: z.string().trim().max(280, 'Máximo de 280 caracteres').default(''),
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
