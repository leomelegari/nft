import { Link } from '@tanstack/react-router'
import { Button } from '@/shared/ui/button'

export function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-shell flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-body tracking-label text-text-accent uppercase">Erro 404</p>
      <h1 className="text-heading font-bold text-text-primary">Esta página não existe</h1>
      <p className="max-w-prose text-body text-text-secondary">
        O endereço acessado não corresponde a nenhuma rota do marketplace. Ele pode ter
        sido removido ou digitado incorretamente.
      </p>
      <Button asChild className="mt-2">
        <Link to="/">Voltar para o início</Link>
      </Button>
    </main>
  )
}
