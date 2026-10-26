/**
 * Stable identifier for a visitor's cart before they authenticate.
 *
 * Sent as `X-Guest-Id` on every cart request and consumed once by
 * `POST /cart/merge` at login, which is what preserves the visitor's items.
 */
const STORAGE_KEY = 'kurio.guest-id'

let cached: string | null = null

function generate(): string {
  return `g-${crypto.randomUUID()}`
}

export function getGuestId(): string {
  if (cached) return cached

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      cached = stored
      return stored
    }
    const created = generate()
    window.localStorage.setItem(STORAGE_KEY, created)
    cached = created
    return created
  } catch {
    // Blocked storage: the guest cart lives for this page only.
    cached ??= generate()
    return cached
  }
}

export function clearGuestId(): void {
  cached = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* non-fatal */
  }
}
