import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { createQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'
import { useSessionWatcher } from '@/features/auth/use-session-watcher'
import { useRealtime } from '@/shared/realtime/use-realtime'

export function App() {
  // Created once per app instance so Playwright can mount isolated sessions
  // without cache bleeding between tests.
  const [queryClient] = useState(createQueryClient)
  const [router] = useState(() => createAppRouter(queryClient))

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBoundary>
        <RouterProvider router={router} />
      </SessionBoundary>
    </QueryClientProvider>
  )
}

/**
 * Subscribes to session expiry published by the Axios interceptor, and to the
 * realtime channel. Both are cross-cutting and belong above the router.
 */
function SessionBoundary({ children }: { children: React.ReactNode }) {
  useSessionWatcher()
  useRealtime()
  return children
}
