import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cart } from '@/entities/cart'
import { queryKeys } from '@/shared/api/query-keys'
import { addCartItem, fetchCart } from '@/features/cart/api'
import { useOwnerKey } from '@/features/auth/queries'

export function useCartQuery() {
  const ownerKey = useOwnerKey()

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

/**
 * Adding to the cart is deliberately NOT optimistic.
 *
 * The server is the authority on availability and per-order limits, and it can
 * reject the line. Showing it in the cart first and pulling it back out would
 * be worse than a brief spinner. The response is the new cart, so it is written
 * straight into the cache instead of triggering another round trip.
 */
export function useAddToCart() {
  const queryClient = useQueryClient()
  const ownerKey = useOwnerKey()

  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (cart: Cart) => {
      queryClient.setQueryData(queryKeys.cart(ownerKey), cart)
    },
  })
}
