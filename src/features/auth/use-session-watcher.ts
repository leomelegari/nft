import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { onSessionInvalidated } from '@/features/auth/session-events'

/**
 * Keeps the cache honest when a session expires mid-navigation.
 *
 * On expiry the session entry is set to `null` and every private entry is
 * dropped, so route guards redirect on the next navigation and nothing renders
 * stale private data in the meantime.
 */
export function useSessionWatcher(): void {
  const queryClient = useQueryClient()

  useEffect(
    () =>
      onSessionInvalidated(() => {
        queryClient.setQueryData(queryKeys.session(), null)
        queryClient.removeQueries({ queryKey: ['owner'] })
      }),
    [queryClient],
  )
}
