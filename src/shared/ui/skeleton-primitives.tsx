import { cn } from '@/shared/lib/utils'

/**
 * Loading placeholders.
 *
 * Every skeleton reserves the exact box of the content it replaces so nothing
 * shifts when data arrives, and the shimmer is suppressed under
 * `prefers-reduced-motion` by the global rule in `index.css` (section 8).
 *
 * The whole group is wrapped in a single `role="status"` region by
 * `SkeletonGroup`, so assistive tech announces "carregando" once rather than
 * once per block.
 */
export function SkeletonBlock({
  className,
  rounded = 'md',
}: {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}) {
  const radius = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-xl',
    full: 'rounded-full',
  }[rounded]

  return <div aria-hidden="true" className={cn('shimmer', radius, className)} />
}

export function SkeletonText({
  lines = 1,
  className,
  lastLineWidth = '60%',
}: {
  lines?: number
  className?: string
  lastLineWidth?: string
}) {
  return (
    <div aria-hidden="true" className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="shimmer h-3.5 rounded-sm"
          style={index === lines - 1 && lines > 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  )
}

export function SkeletonGroup({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
