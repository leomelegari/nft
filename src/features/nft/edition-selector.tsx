import type { NftEdition } from '@/entities/nft'
import { formatEth } from '@/shared/money'
import { cn } from '@/shared/lib/utils'

/**
 * Edition picker.
 *
 * A real radio group rather than the Figma's styled pills, so the choice is
 * announced, reachable by keyboard and navigable with arrow keys. Sold-out
 * editions are disabled rather than hidden, so the user can see that the
 * edition exists and why it cannot be chosen.
 */
export function EditionSelector({
  editions,
  selectedId,
  onSelect,
}: {
  editions: NftEdition[]
  selectedId: string
  onSelect: (editionId: string) => void
}) {
  return (
    <fieldset>
      <legend className="text-body-md font-bold text-foreground">Edição:</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const selected = edition.id === selectedId

          return (
            <label
              key={edition.id}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-body transition-colors',
                selected
                  ? 'border-primary font-medium text-text-accent'
                  : 'border-border-soft text-text-secondary hover:border-primary',
                soldOut && 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                type="radio"
                name="edition"
                value={edition.id}
                checked={selected}
                disabled={soldOut}
                onChange={() => onSelect(edition.id)}
                className="size-3.5 accent-primary"
              />
              <span>{edition.label}</span>
              <span className="text-caption tabular-nums">
                {formatEth(edition.priceEth)}
              </span>
              <span className="text-caption">
                {soldOut ? '· esgotada' : `· ${edition.available} disp.`}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
