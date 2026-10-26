import { DB_SCHEMA_VERSION, DEFAULT_SEED, createSeedDb } from '@/mocks/db/seed'
import type { MockDb } from '@/mocks/db/types'

/**
 * In-memory database for the simulated backend, mirrored to local storage.
 *
 * Persistence exists so a refresh keeps the cart, session, favourites and
 * orders consistent — explicitly permitted by section 6. `resetDb()` restores a
 * known scenario in full, which is what every Playwright test calls to get an
 * isolated starting state.
 */
const STORAGE_KEY = 'greenmint.mock-db'

let db: MockDb | null = null

function readPersisted(): MockDb | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as MockDb
    // A schema bump invalidates older snapshots rather than half-migrating them.
    if (parsed.schemaVersion !== DB_SCHEMA_VERSION) return null

    return parsed
  } catch {
    return null
  }
}

function persist(next: MockDb): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Quota exceeded or blocked storage: the simulation keeps working in memory
    // for the current page, it just will not survive a refresh.
    console.warn('[mocks] não foi possível persistir o banco simulado')
  }
}

export function getDb(): MockDb {
  db ??= readPersisted() ?? createSeedDb()
  return db
}

/**
 * Applies a mutation and persists the result.
 *
 * Handlers mutate the returned draft directly. This is a simulated server, not
 * application state — the immutability rule that governs `src/features` does not
 * buy anything here, and a structural clone per request would be pure overhead.
 */
export function mutateDb<T>(mutation: (draft: MockDb) => T): T {
  const current = getDb()
  const result = mutation(current)
  persist(current)
  return result
}

export function resetDb(seed: number = DEFAULT_SEED): MockDb {
  db = createSeedDb(seed)
  persist(db)
  return db
}

/** Monotonic per-prefix counter, so ids are stable and readable in traces. */
export function nextId(prefix: string): string {
  return mutateDb((draft) => {
    const next = (draft.counters[prefix] ?? 0) + 1
    draft.counters[prefix] = next
    return `${prefix}_${String(next).padStart(5, '0')}`
  })
}

export function bumpVersion(current: number): number {
  return current + 1
}
