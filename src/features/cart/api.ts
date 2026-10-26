import { cartSchema, type Cart } from '@/entities/cart'
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
