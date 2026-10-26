import type { ErrorComponentProps } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

export function RouteError({ error, reset }: ErrorComponentProps) {
  const message = error instanceof Error ? error.message : 'Erro desconhecido'

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
      <Button className="mt-2" onClick={reset}>
        Tentar novamente
      </Button>
    </main>
  )
}
