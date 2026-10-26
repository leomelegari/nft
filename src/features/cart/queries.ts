import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchCart } from '@/features/cart/api'
import { getGuestId } from '@/features/cart/guest-id'

/**
 * Owner key for cache namespacing. Once the session feature lands this reads
 * the authenticated user id; until then every cart is a visitor cart.
 */
export function useCartOwnerKey(): string {
  return `guest:${getGuestId()}`
}

export function useCartQuery() {
  const ownerKey = useCartOwnerKey()

  return useQuery({
    queryKey: queryKeys.cart(ownerKey),
    queryFn: ({ signal }) => fetchCart(signal),
  })
}

/** Total units in the cart — what the header badge shows. */
export function useCartItemCount(): number {
  const { data } = useCartQuery()
  return data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
}
