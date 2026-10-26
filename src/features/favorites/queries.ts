import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NftListResponse } from '@/entities/nft'
import { queryKeys } from '@/shared/api/query-keys'
import { useIsAuthenticated, useOwnerKey } from '@/features/auth/queries'
import { addFavorite, fetchFavorites, removeFavorite } from '@/features/favorites/api'

export function useFavoritesQuery() {
  const ownerKey = useOwnerKey()
  const isAuthenticated = useIsAuthenticated()

  return useQuery({
    queryKey: queryKeys.favorites(ownerKey),
    queryFn: ({ signal }) => fetchFavorites(signal),
    // Favourites are a private resource; there is nothing to fetch for a guest.
    enabled: isAuthenticated,
  })
}

export function useIsFavorite(nftId: string): boolean {
  const { data } = useFavoritesQuery()
  return data?.data.some((nft) => nft.id === nftId) ?? false
}

/**
 * Favourite toggle with an optimistic update and rollback.
 *
 * This is the interaction the brief requires to be optimistic: the heart flips
 * immediately, and if the mutation fails the previous list is restored exactly
 * as it was. Cancelling in-flight queries first prevents a refetch that started
 * before the click from overwriting the optimistic value.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const ownerKey = useOwnerKey()
  const key = queryKeys.favorites(ownerKey)

  return useMutation({
    mutationFn: ({ nftId, next }: { nftId: string; next: boolean; summary?: unknown }) =>
      next ? addFavorite(nftId) : removeFavorite(nftId),

    onMutate: async ({ nftId, next, summary }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<NftListResponse>(key)

      queryClient.setQueryData<NftListResponse>(key, (current) => {
        const base: NftListResponse = current ?? {
          data: [],
          meta: { page: 1, pageSize: 1, total: 0, totalPages: 1 },
        }

        const data = next
          ? base.data.some((item) => item.id === nftId)
            ? base.data
            : [...base.data, summary as NftListResponse['data'][number]].filter(Boolean)
          : base.data.filter((item) => item.id !== nftId)

        return { ...base, data, meta: { ...base.meta, total: data.length } }
      })

      return { previous }
    },

    onError: (_error, _variables, context) => {
      // Restore the exact previous value rather than refetching: a refetch
      // would briefly show the wrong state while it is in flight.
      if (context?.previous !== undefined) {
        queryClient.setQueryData(key, context.previous)
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
