/**
 * Icons for the footer's three feature medallions.
 *
 * The Figma draws these as bare letters (W / C / D) inside a solid circle —
 * a placeholder, not a design decision worth preserving. Each is replaced
 * with an icon that actually represents its heading, drawn in the same
 * inline-SVG style used elsewhere in the shell (`currentColor` stroke, no
 * fill dependency, so it inherits the circle's ink colour for free).
 */

/** "Segurança da carteira" — a shield with a check mark. */
export function WalletSecurityIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3.25 19 6v5.1c0 4.86-3.2 8.58-7 9.65-3.8-1.07-7-4.79-7-9.65V6l7-2.75Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.75 12.25 11 14.5l4.25-4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** "Criadores em destaque" — a palette, for artists and studios. */
export function FeaturedCreatorsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3.25c-4.83 0-8.75 3.69-8.75 8.25 0 2.35 1.95 4.25 4.35 4.25h1.1c.8 0 1.45.63 1.45 1.4v.45c0 1.33 1.1 2.4 2.46 2.4 4.76 0 8.64-4.07 8.64-9 0-4.3-4.17-7.75-9.25-7.75Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7.6" cy="10.4" r="1.05" fill="currentColor" />
      <circle cx="10.6" cy="7.6" r="1.05" fill="currentColor" />
      <circle cx="14.6" cy="7.9" r="1.05" fill="currentColor" />
      <circle cx="16.9" cy="11.2" r="1.05" fill="currentColor" />
    </svg>
  )
}

/** "Alertas de lançamentos" — a notification bell. */
export function LaunchAlertsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M12 3.5a4.75 4.75 0 0 0-4.75 4.75v2.84c0 .56-.19 1.11-.54 1.55L5.5 14.5h13l-1.21-1.86a2.6 2.6 0 0 1-.54-1.55V8.25A4.75 4.75 0 0 0 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 17.5a2.1 2.1 0 0 0 4.2 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
