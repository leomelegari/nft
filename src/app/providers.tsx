import { useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { createQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'

export function App() {
  // Created once per app instance so Playwright can mount isolated sessions
  // without cache bleeding between tests.
  const [queryClient] = useState(createQueryClient)
  const [router] = useState(() => createAppRouter(queryClient))

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
