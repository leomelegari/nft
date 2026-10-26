import { z } from 'zod'
import { ethAmountSchema, isoDateSchema, versionSchema } from '@/entities/common'
import { networkSchema } from '@/entities/nft'

/**
 * Cart lines carry a denormalised snapshot of the NFT so the cart renders
 * without N+1 lookups, plus the live `available` and `version` so a
 * `nft.updated` event can reconcile the line in place.
 */
export const cartItemSchema = z.object({
  id: z.string(),
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
  available: z.number().int().nonnegative(),
  maxPerOrder: z.number().int().positive(),
  lineTotalEth: ethAmountSchema,
  version: versionSchema,
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  updatedAt: isoDateSchema,
  version: versionSchema,
})
export type Cart = z.infer<typeof cartSchema>

export const addCartItemInputSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().positive(),
})
export type AddCartItemInput = z.infer<typeof addCartItemInputSchema>

export const updateCartItemInputSchema = z.object({
  quantity: z.number().int().positive(),
})
export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>

/* -------------------------------------------------------------------------- */
/* Quote — the authoritative pricing document                                   */
/* -------------------------------------------------------------------------- */

export const couponSchema = z.object({
  code: z.string(),
  description: z.string(),
  percentOff: z.number().min(0).max(100),
})
export type Coupon = z.infer<typeof couponSchema>

export const QUOTE_ISSUE_KINDS = [
  'price-changed',
  'availability-reduced',
  'sold-out',
] as const
export const quoteIssueKindSchema = z.enum(QUOTE_ISSUE_KINDS)
export type QuoteIssueKind = z.infer<typeof quoteIssueKindSchema>

/**
 * Issues are what the checkout gate reads: a quote carrying any issue cannot be
 * submitted until the user acknowledges the new numbers and a fresh quote is
 * issued. This is the "cotação desatualizada" rule from section 7.
 */
export const quoteIssueSchema = z.object({
  kind: quoteIssueKindSchema,
  cartItemId: z.string(),
  title: z.string(),
  previousPriceEth: ethAmountSchema.nullable(),
  currentPriceEth: ethAmountSchema.nullable(),
  previousQuantity: z.number().int().nonnegative().nullable(),
  currentQuantity: z.number().int().nonnegative().nullable(),
})
export type QuoteIssue = z.infer<typeof quoteIssueSchema>

export const quoteSchema = z.object({
  id: z.string(),
  cartVersion: versionSchema,
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  coupon: couponSchema.nullable(),
  issues: z.array(quoteIssueSchema),
  issuedAt: isoDateSchema,
  expiresAt: isoDateSchema,
})
export type Quote = z.infer<typeof quoteSchema>

export const quoteInputSchema = z.object({
  couponCode: z.string().trim().max(32).optional(),
})
export type QuoteInput = z.infer<typeof quoteInputSchema>
