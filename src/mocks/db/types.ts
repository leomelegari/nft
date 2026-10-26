import type { Network, CollectionSlug } from '@/entities/nft'
import type { NftDetail } from '@/entities/nft'
import type { Order } from '@/entities/order'
import type { Quote } from '@/entities/cart'
import type { User, Wallet } from '@/entities/auth'

/** Server-side record: never serialised to the client as-is. */
export interface MockUser extends User {
  /** Simulated digest. No password is ever stored in clear text. */
  passwordDigest: string
  wallets: Wallet[]
}

export interface MockSession {
  token: string
  userId: string
  expiresAt: string
  /** Scopes socket events so a previous session cannot update another user. */
  socketSessionId: string
}

export interface MockNft extends NftDetail {
  collection: CollectionSlug
  network: Network
}

export interface MockCartItem {
  id: string
  nftId: string
  editionId: string
  quantity: number
  addedAt: string
}

/**
 * Carts are keyed by owner: a user id once authenticated, or a guest id held in
 * local storage before that. Login merges the guest cart into the user cart,
 * which is the "preservar os itens do visitante ao autenticar" requirement.
 */
export interface MockCart {
  id: string
  ownerKey: string
  items: MockCartItem[]
  updatedAt: string
  version: number
}

export interface MockQuote extends Quote {
  ownerKey: string
  /** Line prices frozen when the quote was issued, for staleness comparison. */
  snapshot: Array<{ cartItemId: string; unitPriceEth: string; quantity: number }>
}

export interface MockIdempotencyRecord {
  key: string
  userId: string
  /** Hash of the request body: a replay with different content is a conflict. */
  requestHash: string
  orderId: string
  createdAt: string
}

export interface MockDb {
  schemaVersion: number
  seed: number
  users: MockUser[]
  sessions: MockSession[]
  nfts: MockNft[]
  favorites: Array<{ userId: string; nftId: string }>
  carts: MockCart[]
  quotes: MockQuote[]
  orders: Array<Order & { userId: string }>
  idempotency: MockIdempotencyRecord[]
  counters: Record<string, number>
}
