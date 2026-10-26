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
  /** Route path prefixes that light this item up. Unused on the home route — see `isNavItemActive`. */
  activeOn: string[]
  hash?: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Início', available: true, activeOn: [] },
  {
    label: 'Mercado',
    available: true,
    activeOn: ['/nft', '/carrinho', '/pagamento', '/pedido'],
    hash: 'catalogo',
  },
  { label: 'Criadores', available: false, activeOn: [] },
  { label: 'Aprenda', available: false, activeOn: [] },
]

/**
 * On every other route this is a plain prefix match. The home route is a
 * special case: "Início" and "Mercado" share one URL, so which of the two is
 * active is decided by which section is actually in view (see
 * `useCatalogSectionActive`), not by the pathname.
 */
export function isNavItemActive(
  item: NavItem,
  pathname: string,
  catalogSectionActive: boolean,
): boolean {
  if (pathname === '/') {
    if (item.label === 'Início') return !catalogSectionActive
    if (item.label === 'Mercado') return catalogSectionActive
    return false
  }
  return item.activeOn.some((prefix) => pathname.startsWith(prefix))
}
