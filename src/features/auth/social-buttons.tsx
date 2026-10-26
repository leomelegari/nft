/**
 * Third-party sign-in buttons.
 *
 * OAuth is outside the delivery scope, so these are rendered for fidelity but
 * are explicitly disabled — the brief requires that actions outside the scope
 * never appear functional.
 */
export function SocialButtons() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <span className="text-caption-lg text-foreground">Ou continue com</span>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>

      {(
        [
          { label: 'Continuar com Google', glyph: <GoogleGlyph /> },
          { label: 'Continuar com Facebook', glyph: <FacebookGlyph /> },
        ] as const
      ).map((provider) => (
        <button
          key={provider.label}
          type="button"
          disabled
          title="Autenticação social fora do escopo desta entrega"
          className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-3 rounded-[5px] border border-border text-caption-lg font-medium text-text-secondary opacity-70"
        >
          {provider.glyph}
          {provider.label}
        </button>
      ))}
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
      <path
        d="M19.6 10.23c0-.7-.06-1.37-.18-2H10v3.79h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.31Z"
        fill="#4086F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.07v2.59A10 10 0 0 0 10 20Z"
        fill="#59C36A"
      />
      <path
        d="M4.41 11.9a6 6 0 0 1 0-3.8V5.51H1.07a10 10 0 0 0 0 8.98l3.34-2.59Z"
        fill="#FFDA2D"
      />
      <path
        d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.95.99 12.7 0 10 0A10 10 0 0 0 1.07 5.51L4.41 8.1C5.2 5.74 7.4 3.98 10 3.98Z"
        fill="#FF641A"
      />
    </svg>
  )
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true">
      <path
        d="M20 10a10 10 0 1 0-11.56 9.88v-6.99H5.9V10h2.54V7.8c0-2.51 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V10h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 20 10Z"
        fill="#3B5999"
      />
    </svg>
  )
}
