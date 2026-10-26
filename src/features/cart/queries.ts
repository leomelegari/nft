import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Cart } from '@/entities/cart'
import { queryKeys } from '@/shared/api/query-keys'
import {
  addCartItem,
  fetchCart,
  removeCartItem,
  requestQuote,
  updateCartItem,
} from '@/features/cart/api'
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

/**
 * Quantity change.
 *
 * Not optimistic, for the same reason as adding: the server owns availability
 * and the per-order cap and can refuse the new quantity. The response is the
 * recomputed cart and replaces the cache entry directly.
 */
export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  const ownerKey = useOwnerKey()

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, { quantity }),
    onSuccess: (cart: Cart) => {
      queryClient.setQueryData(queryKeys.cart(ownerKey), cart)
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  const ownerKey = useOwnerKey()

  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: (cart: Cart) => {
      queryClient.setQueryData(queryKeys.cart(ownerKey), cart)
    },
  })
}

/**
 * Pricing for the current cart.
 *
 * Keyed on the cart version and the coupon, so it re-issues whenever either
 * changes and never shows a total computed from a cart the user no longer has.
 * Totals are never derived on the client — the API response is the authority,
 * including the network fee.
 */
export function useQuoteQuery(couponCode: string | undefined) {
  const ownerKey = useOwnerKey()
  const { data: cart } = useCartQuery()
  const cartVersion = cart?.version ?? 0
  const hasItems = (cart?.items.length ?? 0) > 0

  return useQuery({
    queryKey: [...queryKeys.cart(ownerKey), 'quote', cartVersion, couponCode ?? ''],
    queryFn: () => requestQuote(couponCode ? { couponCode } : {}),
    enabled: hasItems,
    // A quote is a point-in-time document; serving a cached one would defeat
    // the staleness gate it exists to support.
    staleTime: 0,
    retry: false,
  })
}
