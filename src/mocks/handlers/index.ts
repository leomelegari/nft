import type { RequestHandler } from 'msw'
import { controlHandlers } from '@/mocks/handlers/control'
import { sessionHandlers } from '@/mocks/handlers/session'
import { nftHandlers } from '@/mocks/handlers/nfts'
import { favoriteHandlers } from '@/mocks/handlers/favorites'
import { cartHandlers } from '@/mocks/handlers/cart'
import { quoteHandlers } from '@/mocks/handlers/quote'
import { orderHandlers } from '@/mocks/handlers/orders'
import { accountHandlers } from '@/mocks/handlers/account'

/**
 * Every REST handler for the simulated backend.
 *
 * Components, hooks and the Axios client contain no fictitious responses and no
 * alternate business paths — the network layer is the only source of truth
 * (section 6 of the brief).
 *
 * Order matters: control endpoints first so they are never shadowed, and
 * `/nfts/facets` before `/nfts/:slug` so the literal path wins over the param.
 */
export const handlers: RequestHandler[] = [
  ...controlHandlers,
  ...sessionHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...accountHandlers,
]
