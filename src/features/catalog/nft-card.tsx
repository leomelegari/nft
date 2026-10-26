import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/entities/nft'
import { formatEth } from '@/shared/money'
import { Artwork } from '@/shared/ui/artwork'
import { cn } from '@/shared/lib/utils'

/**
 * Catalog card: 258x356 in the Figma, with a 250px artwork inset on a card
 * surface, the title below and the price in the accent colour.
 *
 * The whole card is one link. The favourite control is rendered as a sibling
 * rather than a nested button, because a button inside a link is invalid and
 * breaks keyboard activation.
 */
export function NftCard({
  nft,
  priority = false,
  favoriteSlot,
}: {
  nft: NftSummary
  priority?: boolean
  favoriteSlot?: React.ReactNode
}) {
  const soldOut = nft.available === 0

  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden rounded-xl bg-card p-1">
        <Artwork
          src={nft.image}
          alt={nft.imageAlt}
          priority={priority}
          className={cn(
            'aspect-square rounded-lg transition-transform duration-300 group-hover:scale-[1.02]',
            soldOut && 'opacity-55 grayscale',
          )}
        />

        {soldOut && (
          <span className="absolute top-3 left-3 rounded-md bg-ink/85 px-2 py-1 text-caption font-bold tracking-wide text-text-secondary uppercase">
            Esgotado
          </span>
        )}

        {favoriteSlot && <div className="absolute top-3 right-3">{favoriteSlot}</div>}
      </div>

      <h3 className="mt-3 text-body-md font-medium text-foreground">
        <Link
          to="/nft/$slug"
          params={{ slug: nft.slug }}
          className="rounded-sm after:absolute after:inset-0 after:content-['']"
        >
          {nft.title}
        </Link>
      </h3>

      <p className="mt-1.5 text-body-md font-bold text-text-accent">
        {formatEth(nft.priceEth)}
      </p>
    </article>
  )
}

/** Matches the card's exact box so the grid does not reflow when data lands. */
export function NftCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      <div className="rounded-xl bg-card p-1">
        <div className="shimmer aspect-square rounded-lg" />
      </div>
      <div className="shimmer mt-3 h-4 w-3/4 rounded-sm" />
      <div className="shimmer mt-2 h-4 w-1/3 rounded-sm" />
    </div>
  )
}
