import { cn } from '@/shared/lib/utils'

/**
 * Numbered pagination matching the Figma's `1 2 3 4 5 >` control.
 *
 * Rendered as a nav with a list so the control is announced as navigation, and
 * the current page carries `aria-current` rather than only a colour change.
 */
const WINDOW = 5

export function CatalogPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const start = Math.max(
    1,
    Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1),
  )
  const pages = Array.from(
    { length: Math.min(WINDOW, totalPages) },
    (_, index) => start + index,
  )

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex items-center gap-2">
        {pages.map((value) => (
          <li key={value}>
            <button
              type="button"
              onClick={() => onChange(value)}
              aria-current={value === page ? 'page' : undefined}
              aria-label={`Página ${value}`}
              className={cn(
                'flex size-9 items-center justify-center rounded-md border text-body-md transition-colors focus-visible:outline-ring',
                value === page
                  ? 'border-primary bg-primary font-bold text-primary-foreground'
                  : 'border-border-soft text-text-secondary hover:border-primary hover:text-foreground',
              )}
            >
              {value}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => onChange(Math.min(page + 1, totalPages))}
            disabled={page >= totalPages}
            aria-label="Próxima página"
            className="flex size-9 items-center justify-center rounded-md border border-border-soft text-text-secondary transition-colors hover:border-primary hover:text-foreground focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 18 18" className="size-4" fill="none" aria-hidden="true">
              <path
                d="m6.75 4 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  )
}
