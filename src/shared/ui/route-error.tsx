import { useState } from 'react'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/ui/button'

/**
 * Route-level failure, raised when a loader cannot produce its data.
 *
 * Retrying has to do three things, not one. Clearing the error boundary alone
 * leaves the rejected entries in the query cache, and the loader reads through
 * that cache — so the next attempt replays the very failure it is trying to
 * escape. Verified: with the connection restored, "Tentar novamente" left the
 * screen on the error forever. Only the queries that actually failed are
 * dropped, so a working cache is not thrown away with them.
 */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [retrying, setRetrying] = useState(false)

  const message = error instanceof Error ? error.message : 'Erro desconhecido'

  async function retry() {
    setRetrying(true)
    try {
      await queryClient.resetQueries({
        predicate: (query) => query.state.status === 'error',
      })
      reset()
      await router.invalidate()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <main
      className="mx-auto flex min-h-[60vh] max-w-shell flex-col items-center justify-center gap-4 px-5 text-center"
      role="alert"
    >
      <p className="text-body tracking-label text-danger uppercase">Algo deu errado</p>
      <h1 className="text-heading font-bold text-text-primary">
        Não foi possível carregar esta página
      </h1>
      <p className="max-w-prose text-body break-words text-text-secondary">{message}</p>
      <Button className="mt-2" disabled={retrying} onClick={() => void retry()}>
        {retrying ? 'Tentando…' : 'Tentar novamente'}
      </Button>
    </main>
  )
}
