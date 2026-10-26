import type { Cart, CartItem } from '@/entities/cart'
import { addEth, mulEth, toEth } from '@/shared/money'
import { getDb, mutateDb } from '@/mocks/db/store'
import type { MockCart, MockDb } from '@/mocks/db/types'

/** Finds or creates the cart belonging to an owner key (user id or guest id). */
export function ensureCart(ownerKey: string): MockCart {
  return mutateDb((draft) => {
    const existing = draft.carts.find((cart) => cart.ownerKey === ownerKey)
    if (existing) return existing

    const created: MockCart = {
      id: `cart_${ownerKey}`,
      ownerKey,
      items: [],
      updatedAt: new Date().toISOString(),
      version: 1,
    }
    draft.carts.push(created)
    return created
  })
}

/**
 * Projects the stored cart into its wire shape, joining each line against the
 * live NFT so price and availability are always current. Lines whose NFT or
 * edition disappeared are dropped rather than rendered broken.
 */
export function buildCart(ownerKey: string, db: MockDb = getDb()): Cart {
  const cart = ensureCart(ownerKey)

  const items: CartItem[] = cart.items.flatMap((line) => {
    const nft = db.nfts.find((item) => item.id === line.nftId)
    const edition = nft?.editions.find((item) => item.id === line.editionId)
    if (!nft || !edition) return []

    return [
      {
        id: line.id,
        nftId: nft.id,
        nftSlug: nft.slug,
        title: nft.title,
        image: nft.image,
        imageAlt: nft.imageAlt,
        editionId: edition.id,
        editionLabel: edition.label,
        network: nft.network,
        unitPriceEth: edition.priceEth,
        quantity: line.quantity,
        available: edition.available,
        maxPerOrder: edition.maxPerOrder,
        lineTotalEth: mulEth(edition.priceEth, line.quantity),
        version: nft.version,
      },
    ]
  })

  return {
    id: cart.id,
    items,
    updatedAt: cart.updatedAt,
    version: cart.version,
  }
}

export function cartSubtotal(cart: Cart) {
  return cart.items.length
    ? addEth(...cart.items.map((item) => item.lineTotalEth))
    : toEth('0')
}

export function touchCart(ownerKey: string): void {
  mutateDb((draft) => {
    const cart = draft.carts.find((item) => item.ownerKey === ownerKey)
    if (!cart) return
    cart.updatedAt = new Date().toISOString()
    cart.version += 1
  })
}

/**
 * Moves guest lines into the user's cart on login, summing quantities for lines
 * that already exist. The guest cart is discarded afterwards so a later
 * anonymous visit starts clean.
 */
export function mergeGuestCart(guestKey: string, userKey: string): void {
  mutateDb((draft) => {
    const guest = draft.carts.find((cart) => cart.ownerKey === guestKey)
    if (!guest || guest.items.length === 0) return

    const target = draft.carts.find((cart) => cart.ownerKey === userKey)
    if (!target) {
      guest.ownerKey = userKey
      guest.id = `cart_${userKey}`
      guest.version += 1
      return
    }

    for (const line of guest.items) {
      const existing = target.items.find(
        (item) => item.nftId === line.nftId && item.editionId === line.editionId,
      )
      if (existing) {
        existing.quantity += line.quantity
      } else {
        target.items.push(line)
      }
    }

    target.updatedAt = new Date().toISOString()
    target.version += 1
    draft.carts = draft.carts.filter((cart) => cart.ownerKey !== guestKey)
  })
}
