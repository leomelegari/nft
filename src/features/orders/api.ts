import { orderSchema, type CreateOrderInput, type Order } from '@/entities/order'
import { request } from '@/shared/api'

/**
 * Creates an order.
 *
 * The idempotency key is a required header: the same key replays the original
 * order instead of buying again, and the same key with different content is a
 * conflict. It is generated once per checkout attempt, not per click.
 */
export function createOrder(
  input: CreateOrderInput,
  idempotencyKey: string,
): Promise<Order> {
  return request(orderSchema, {
    method: 'POST',
    url: '/orders',
    data: input,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

export function fetchOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
  return request(orderSchema, {
    method: 'GET',
    url: `/orders/${encodeURIComponent(orderId)}`,
    ...(signal ? { signal } : {}),
  })
}
