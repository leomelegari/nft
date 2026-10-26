/**
 * The session token is the only credential the client holds. It is persisted so
 * a refresh recovers the session (section 3), and cleared on logout, on user
 * switch and whenever the server reports the session is no longer valid.
 *
 * Passwords are never stored, in plain text or otherwise.
 */
const STORAGE_KEY = 'greenmint.session-token'

let inMemoryToken: string | null = null

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Private mode or blocked storage: the session simply does not survive a
    // refresh, which is a degradation rather than a failure.
    return null
  }
}

export function getSessionToken(): string | null {
  inMemoryToken ??= readStorage()
  return inMemoryToken
}

export function setSessionToken(token: string): void {
  inMemoryToken = token
  try {
    window.localStorage.setItem(STORAGE_KEY, token)
  } catch {
    /* non-fatal, see readStorage */
  }
}

export function clearSessionToken(): void {
  inMemoryToken = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* non-fatal, see readStorage */
  }
}
