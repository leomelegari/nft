/**
 * The design's four-item nav.
 *
 * The Figma component notes say "Mercado" is the active item on the detail,
 * cart, payment and confirmation screens, so it owns the whole purchase flow.
 * It is now a route of its own (`/mercado`) rather than a hash link into the
 * home page's catalog section: "Início" is the showcase (hero + catalog) and
 * "Mercado" is the dense browsing surface over the same NFTs.
 *
 * Giving it a real URL also removes a structural problem. While both labels
 * shared `/`, which one was active could only be answered by a scrollspy, and
 * TanStack Router's `<Link>` marked both as `aria-current="page"` because its
 * own match ignores the hash. With distinct pathnames the active item is a
 * plain prefix match again.
 *
 * "Criadores" and "Aprenda" are editorial destinations explicitly outside the
 * delivery scope. They are rendered, but marked unavailable so they cannot
 * appear functional, which the brief requires of out-of-scope actions.
 */

/** Every destination the nav can link to. Keeps `<Link to>` type-checked. */
export type NavTarget = '/' | '/mercado'

interface NavItemBase {
  label: string
  /** Route path prefixes that light this item up; see `isNavItemActive`. */
  activeOn: string[]
}

/**
 * Modelled as a discriminated union so "available" *implies* a destination.
 * An available item without a `to`, or an out-of-scope item with one, does not
 * type-check — the invariant is enforced rather than merely documented.
 */
export interface AvailableNavItem extends NavItemBase {
  available: true
  to: NavTarget
}

export interface UnavailableNavItem extends NavItemBase {
  available: false
}

export type NavItem = AvailableNavItem | UnavailableNavItem

export const NAV_ITEMS: NavItem[] = [
  { label: 'Início', available: true, to: '/', activeOn: [] },
  {
    label: 'Mercado',
    available: true,
    to: '/mercado',
    activeOn: ['/mercado', '/nft', '/carrinho', '/pagamento', '/pedido'],
  },
  { label: 'Criadores', available: false, activeOn: [] },
  { label: 'Aprenda', available: false, activeOn: [] },
]

/**
 * A plain prefix match, with the home route handled first.
 *
 * `/` cannot take part in the prefix test: every pathname starts with it, so
 * "Início" would match everywhere. It is instead the exact-match case, which
 * is also the only correct reading — the home route is a single screen.
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === '/') return item.available && item.to === '/'
  return item.activeOn.some((prefix) => pathname.startsWith(prefix))
}
