import heroArtwork from '@/assets/brand/hero.webp'
import { Button } from '@/shared/ui/button'

/**
 * Home hero.
 *
 * Desktop uses the 43px display type from the Figma; mobile steps it down to
 * 28px, because the desktop size wraps the headline onto four lines at 390px
 * and pushes the whole catalog below the fold. The mobile frame uses a shorter
 * headline to work around the same problem.
 *
 * The artwork is the LCP candidate on this screen, so it is eager with high
 * fetch priority while everything below stays lazy.
 */
export function CatalogHero({ onExplore }: { onExplore: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-card">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_85%_50%,var(--tw-gradient-from),transparent_62%)] from-brand-primary/22"
      />

      <div className="relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_450px] lg:gap-10 lg:p-10">
        <div className="max-w-[600px]">
          <p className="text-body font-medium tracking-label text-foreground">
            Bem-vindo à Kurio
          </p>
          <h1 className="mt-2 text-[28px] leading-[1.25] font-bold text-foreground uppercase sm:text-[34px] lg:text-display lg:leading-[70px]">
            Seja dono do futuro
            <br />
            da arte digital
          </h1>
          <p className="mt-4 max-w-[557px] text-body leading-6 text-text-secondary">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione
            arte digital rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <Button onClick={onExplore} className="mt-8 h-10 px-7 font-bold tracking-wide">
            EXPLORAR
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl">
          <img
            src={heroArtwork}
            alt="Macaco ilustrado com óculos escuros e jaqueta universitária verde, arte de destaque da Kurio"
            width={900}
            height={900}
            fetchPriority="high"
            decoding="async"
            className="aspect-square w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
