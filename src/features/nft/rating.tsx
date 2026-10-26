/**
 * Star rating.
 *
 * Rendered as a single labelled image rather than five decorative stars, so a
 * screen reader hears "4,6 de 5" instead of five unlabelled graphics.
 */
export function NftRating({
  rating,
  reviewCount,
}: {
  rating: number
  reviewCount: number
}) {
  const rounded = Math.round(rating)

  return (
    <div className="flex items-center gap-1.5">
      <span
        role="img"
        aria-label={`${rating.toFixed(1).replace('.', ',')} de 5 estrelas`}
        className="flex items-center gap-0.5"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <StarGlyph key={index} filled={index < rounded} />
        ))}
      </span>
      <span className="text-body-md text-foreground">
        {reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'} de colecionadores
      </span>
    </div>
  )
}

function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 15 15" className="size-[15px]" aria-hidden="true">
      <path
        d="M7.5 1.6l1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L7.5 1.6Z"
        fill={filled ? 'var(--color-text-accent)' : 'var(--color-border-soft)'}
      />
    </svg>
  )
}
