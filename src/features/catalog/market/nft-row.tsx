import { Link } from '@tanstack/react-router'
import { COLLECTION_LABELS, NETWORK_LABELS, type NftSummary } from '@/entities/nft'
import { formatEth } from '@/shared/money'
import { Artwork } from '@/shared/ui/artwork'
import { cn } from '@/shared/lib/utils'

/**
 * List row: the same NFT, read as a line in a table instead of a card.
 *
 * The grid is for browsing by image; this is for comparing. Collection,
 * network and remaining supply are implicit or absent on a card and explicit
 * here, lined up in columns so three rows can be compared at a glance.
 *
 * As in `NftCard`, the whole row is one link via an `::after` overlay and the
 * favourite control is a sibling, not a nested button — a button inside a link
 * is invalid and breaks keyboard activation.
 */
export function NftRow({
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
    <article className="group relative flex items-center gap-4 rounded-xl bg-card p-3 transition-colors hover:bg-secondary">
      <div className="shrink-0 overflow-hidden rounded-lg">
        <Artwork
          src={nft.image}
          alt={nft.imageAlt}
          priority={priority}
          className={cn('size-16 sm:size-20', soldOut && 'opacity-55 grayscale')}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-body-md font-medium text-foreground">
          <Link
            to="/nft/$slug"
            params={{ slug: nft.slug }}
            className="rounded-sm after:absolute after:inset-0 after:content-['']"
          >
            {nft.title}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption-lg text-text-secondary">
          <span>{COLLECTION_LABELS[nft.collection]}</span>
          <span aria-hidden="true">·</span>
          <span>{NETWORK_LABELS[nft.network]}</span>
        </p>
      </div>

      <p
        className={cn(
          'hidden w-32 shrink-0 text-caption-lg whitespace-nowrap tabular-nums sm:block',
          soldOut ? 'font-bold text-text-secondary uppercase' : 'text-text-secondary',
        )}
      >
        {soldOut
          ? 'Esgotado'
          : `${nft.available} ${nft.available === 1 ? 'disponível' : 'disponíveis'}`}
      </p>

      <p className="w-24 shrink-0 text-right text-body-md font-bold text-text-accent tabular-nums">
        {formatEth(nft.priceEth)}
      </p>

      {favoriteSlot && <div className="shrink-0">{favoriteSlot}</div>}
    </article>
  )
}

/** Matches the row's exact box so the list does not reflow when data lands. */
export function NftRowSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-4 rounded-xl bg-card p-3">
      <div className="shimmer size-16 shrink-0 rounded-lg sm:size-20" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="shimmer h-4 w-1/2 rounded-sm" />
        <div className="shimmer h-3 w-1/3 rounded-sm" />
      </div>
      <div className="shimmer hidden h-3.5 w-28 rounded-sm sm:block" />
      <div className="shimmer h-4 w-20 rounded-sm" />
    </div>
  )
}
