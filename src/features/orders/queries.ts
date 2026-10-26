import { useQuery } from '@tanstack/react-query'
import { isTerminalStatus, type Order } from '@/entities/order'
import { queryKeys } from '@/shared/api/query-keys'
import { useOwnerKey } from '@/features/auth/queries'
import { fetchOrder } from '@/features/orders/api'

/**
 * A single order.
 *
 * While the order is `pending` the query polls, so the outcome arrives even if
 * the socket connection is down or the page was reloaded mid-flight. Once the
 * status is terminal, polling stops — a confirmed or declined order never
 * changes again.
 */
export function useOrderQuery(orderId: string) {
  const ownerKey = useOwnerKey()

  return useQuery({
    queryKey: queryKeys.order(ownerKey, orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    refetchInterval: (query) => {
      const order = query.state.data as Order | undefined
      return order && !isTerminalStatus(order.status) ? 2000 : false
    },
    staleTime: 0,
  })
}
