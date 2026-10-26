import { cn } from '@/shared/lib/utils'

/**
 * Quantity stepper.
 *
 * The Figma draws the −/+ controls as 33x49.5 ellipses; they are circles here.
 * The value is a live region so a screen reader hears the new quantity, and the
 * buttons disable at the bounds rather than silently refusing.
 *
 * `max` is the lower of remaining availability and the per-order limit, which
 * is why the hint spells out which one is binding.
 */
export function QuantityStepper({
  value,
  max,
  onChange,
  disabled = false,
  label = 'Quantidade',
}: {
  value: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
  label?: string
}) {
  const canDecrease = !disabled && value > 1
  const canIncrease = !disabled && value < max

  return (
    <div className="flex items-center gap-3">
      <StepButton
        label={`Diminuir ${label.toLowerCase()}`}
        disabled={!canDecrease}
        onClick={() => onChange(value - 1)}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M6 12h12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </StepButton>

      <output
        aria-live="polite"
        aria-label={`${label}: ${value}`}
        className="min-w-6 text-center text-[20px] text-foreground tabular-nums"
      >
        {value}
      </output>

      <StepButton
        label={`Aumentar ${label.toLowerCase()}`}
        disabled={!canIncrease}
        onClick={() => onChange(value + 1)}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <path
            d="M12 6v12M6 12h12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </StepButton>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-9 items-center justify-center rounded-full border border-ink bg-primary text-primary-foreground transition-opacity focus-visible:outline-ring',
        disabled && 'cursor-not-allowed opacity-40',
      )}
    >
      {children}
    </button>
  )
}
