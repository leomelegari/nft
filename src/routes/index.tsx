import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-shell px-5 py-16">
      <p className="text-body tracking-label text-text-accent uppercase">
        Bem-vindo à GreenMint
      </p>
      <h1 className="mt-2 text-display font-bold text-text-primary uppercase">
        Seja dono do futuro
        <br />
        da arte digital
      </h1>
      <p className="mt-6 max-w-prose text-body text-text-secondary">
        Fundação do projeto instalada. Catálogo, filtros e paginação entram na próxima
        etapa.
      </p>
    </main>
  )
}
