import { Link } from '@tanstack/react-router'
import { cn } from '@/shared/lib/utils'

/**
 * The KURIO wordmark. In Figma it sits inside a clipped 160x34 box with no
 * padding, which cuts the K on the left edge; rendered as text it simply
 * aligns with the content column.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        'rounded-sm text-body font-bold tracking-label text-foreground',
        className,
      )}
      aria-label="Kurio — página inicial"
    >
      KURIO
    </Link>
  )
}
