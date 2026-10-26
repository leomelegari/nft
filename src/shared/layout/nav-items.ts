/**
 * The design's four-item nav.
 *
 * The Figma component notes say "Mercado" is the active item on the detail,
 * cart, payment and confirmation screens, so it is the label for the purchase
 * flow rather than a separate catalog page — the catalog itself lives on the
 * home screen, exactly as the Início frame shows.
 *
 * "Criadores" and "Aprenda" are editorial destinations explicitly outside the
 * delivery scope. They are rendered, but marked unavailable so they cannot
 * appear functional, which the brief requires of out-of-scope actions.
 */
export interface NavItem {
  label: string
  available: boolean
  /** Route path prefixes that light this item up. */
  activeOn: string[]
  hash?: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Início', available: true, activeOn: ['/'] },
  {
    label: 'Mercado',
    available: true,
    activeOn: ['/nft', '/carrinho', '/pagamento', '/pedido'],
    hash: 'catalogo',
  },
  { label: 'Criadores', available: false, activeOn: [] },
  { label: 'Aprenda', available: false, activeOn: [] },
]

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.activeOn.includes('/')) {
    return pathname === '/'
  }
  return item.activeOn.some((prefix) => pathname.startsWith(prefix))
}
