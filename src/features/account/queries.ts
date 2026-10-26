import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { useIsAuthenticated, useOwnerKey } from '@/features/auth/queries'
import { fetchWallets } from '@/features/account/api'

export function useWalletsQuery() {
  const ownerKey = useOwnerKey()
  const isAuthenticated = useIsAuthenticated()

  return useQuery({
    queryKey: queryKeys.wallets(ownerKey),
    queryFn: ({ signal }) => fetchWallets(signal),
    enabled: isAuthenticated,
  })
}
