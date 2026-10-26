import { z } from 'zod'
import { type EthAmount, isEthAmount } from '@/shared/money'

/**
 * Shared contract primitives. Every REST payload in the application is parsed
 * through a Zod schema defined under `src/entities`, and the TypeScript types
 * the UI consumes are inferred from those schemas — there is no hand-written
 * duplicate of a server shape anywhere.
 */

/** ETH values stay decimal strings end to end. See `shared/money`. */
export const ethAmountSchema = z.custom<EthAmount>(
  (value) => typeof value === 'string' && isEthAmount(value),
  { message: 'Valor ETH inválido: use uma string decimal não negativa' },
)

export const isoDateSchema = z.iso.datetime()

/**
 * Monotonic resource version. Socket events carry it so the client can drop
 * duplicates and out-of-order deliveries without regressing newer state.
 */
export const versionSchema = z.number().int().nonnegative()

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
})
export type PaginationMeta = z.infer<typeof paginationMetaSchema>

/** Collection responses are enveloped; single resources are returned bare. */
export function paginatedSchema<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item), meta: paginationMetaSchema })
}

export const API_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'AVAILABILITY_CONFLICT',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'QUOTE_STALE',
  'IDEMPOTENCY_CONFLICT',
  'PAYMENT_DECLINED',
  'TRANSIENT_ERROR',
] as const

export const apiErrorCodeSchema = z.enum(API_ERROR_CODES)
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

/**
 * Field-level errors are keyed by form field name so the UI can bind a server
 * message directly to the input that produced it, as required by section 3.
 */
export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
    /** Present on AVAILABILITY_CONFLICT / QUOTE_STALE so the UI can re-quote. */
    details: z.unknown().optional(),
  }),
})
export type ApiErrorBody = z.infer<typeof apiErrorSchema>
