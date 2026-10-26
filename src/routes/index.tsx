import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="mx-auto w-full max-w-shell px-5 py-16">
      <p className="text-body tracking-label text-text-accent">Bem-vindo à Kurio</p>
      <h1 className="mt-2 text-display font-bold text-foreground uppercase">
        Seja dono do futuro
        <br />
        da arte digital
      </h1>
      <p className="mt-6 max-w-[557px] text-body leading-6 text-text-secondary">
        Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
        digital rara, apoie artistas e tenha uma parte da cultura da internet.
      </p>
      <p id="catalogo" className="mt-16 text-body text-text-secondary">
        Catálogo, filtros e paginação entram na próxima etapa.
      </p>
    </div>
  )
}
