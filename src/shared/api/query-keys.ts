/**
 * Query key factory.
 *
 * Every private resource is namespaced by the owner — the user id once
 * authenticated, or the guest id before that. Cache isolation between accounts
 * is therefore structural: a key belonging to user A can never be read while
 * user B is signed in, and logout invalidates by prefix instead of relying on a
 * manual list of things to clear.
 */
export const queryKeys = {
  session: () => ['session'] as const,

  nfts: {
    all: () => ['nfts'] as const,
    list: (params: Record<string, unknown>) => ['nfts', 'list', params] as const,
    facets: (params: Record<string, unknown>) => ['nfts', 'facets', params] as const,
    detail: (slug: string) => ['nfts', 'detail', slug] as const,
  },

  owner: (ownerKey: string) => ['owner', ownerKey] as const,

  cart: (ownerKey: string) => ['owner', ownerKey, 'cart'] as const,
  favorites: (ownerKey: string) => ['owner', ownerKey, 'favorites'] as const,
  profile: (ownerKey: string) => ['owner', ownerKey, 'profile'] as const,
  wallets: (ownerKey: string) => ['owner', ownerKey, 'wallets'] as const,
  orders: (ownerKey: string) => ['owner', ownerKey, 'orders'] as const,
  order: (ownerKey: string, orderId: string) =>
    ['owner', ownerKey, 'orders', orderId] as const,
} as const
