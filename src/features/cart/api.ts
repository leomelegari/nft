import {
  cartSchema,
  type AddCartItemInput,
  type Cart,
  type UpdateCartItemInput,
} from '@/entities/cart'
import { request } from '@/shared/api'
import { getGuestId } from '@/features/cart/guest-id'

/** Cart requests always carry the guest id; the server ignores it when signed in. */
function guestHeaders() {
  return { 'X-Guest-Id': getGuestId() }
}

export function fetchCart(signal?: AbortSignal): Promise<Cart> {
  return request(cartSchema, {
    method: 'GET',
    url: '/cart',
    headers: guestHeaders(),
    ...(signal ? { signal } : {}),
  })
}

export function addCartItem(input: AddCartItemInput): Promise<Cart> {
  return request(cartSchema, {
    method: 'POST',
    url: '/cart/items',
    headers: guestHeaders(),
    data: input,
  })
}

export function updateCartItem(
  itemId: string,
  input: UpdateCartItemInput,
): Promise<Cart> {
  return request(cartSchema, {
    method: 'PATCH',
    url: `/cart/items/${encodeURIComponent(itemId)}`,
    headers: guestHeaders(),
    data: input,
  })
}

export function removeCartItem(itemId: string): Promise<Cart> {
  return request(cartSchema, {
    method: 'DELETE',
    url: `/cart/items/${encodeURIComponent(itemId)}`,
    headers: guestHeaders(),
  })
}

/** Called once after login so the visitor's items are preserved. */
export function mergeGuestCart(): Promise<Cart> {
  return request(cartSchema, {
    method: 'POST',
    url: '/cart/merge',
    headers: guestHeaders(),
  })
}
