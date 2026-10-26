import { cn } from '@/shared/lib/utils'

/**
 * Numbered pagination matching the Figma's `1 2 3 4 5 >` control, plus the
 * result count.
 *
 * The count used to sit in the toolbar, next to the category tabs, where it
 * competed with them for space and forced them into an unwanted horizontal
 * scroll on common desktop widths. It lives here now — paired naturally with
 * the page controls it describes, with room to breathe on either side.
 *
 * Rendered as a nav with a list so the control is announced as navigation, and
 * the current page carries `aria-current` rather than only a colour change.
 */
const WINDOW = 5

export function CatalogPagination({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number
  totalPages: number
  total: number
  onChange: (page: number) => void
}) {
  const start = Math.max(
    1,
    Math.min(page - Math.floor(WINDOW / 2), totalPages - WINDOW + 1),
  )
  const pages = Array.from(
    { length: Math.min(WINDOW, totalPages) },
    (_, index) => start + index,
  )

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
      <p className="text-caption-lg whitespace-nowrap text-text-secondary tabular-nums">
        {total} {total === 1 ? 'resultado' : 'resultados'}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Paginação do catálogo">
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
                <svg
                  viewBox="0 0 18 18"
                  className="size-4"
                  fill="none"
                  aria-hidden="true"
                >
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
      )}
    </div>
  )
}
