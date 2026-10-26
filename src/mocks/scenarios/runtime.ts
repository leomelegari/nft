import {
  DEFAULT_SCENARIO_ID,
  findScenario,
  type Scenario,
} from '@/mocks/scenarios/catalog'
import { createRandom } from '@/mocks/db/random'

/**
 * Resolves and holds the active scenario.
 *
 * Priority: `?scenario=` search param > persisted selection > `VITE_MOCK_SCENARIO`
 * > `default`. The param is persisted so the selection survives client-side
 * navigation and refresh without having to re-append it to every URL.
 */
const STORAGE_KEY = 'kurio.mock-scenario'

let active: Scenario | null = null

/**
 * Fixed seed for scenario randomness (latency draws and transient failures).
 *
 * Chosen so the first ~20 draws match the configured failure rate rather than
 * drifting from it: a short Playwright run must see roughly the advertised
 * proportion of failures, not an unlucky streak. Verified at 7/20 and 0.350
 * over 500 draws for the 35% "flaky" scenario.
 */
const SCENARIO_RANDOM_SEED = 21

let random = createRandom(SCENARIO_RANDOM_SEED)

function readPersisted(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function persist(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* non-fatal */
  }
}

export function resolveScenario(): Scenario {
  if (active) return active

  const fromUrl = new URLSearchParams(window.location.search).get('scenario')
  if (fromUrl) persist(fromUrl)

  const id =
    fromUrl ??
    readPersisted() ??
    (import.meta.env.VITE_MOCK_SCENARIO as string | undefined) ??
    DEFAULT_SCENARIO_ID

  active = findScenario(id)
  random = createRandom(SCENARIO_RANDOM_SEED)
  return active
}

export function setScenario(id: string): Scenario {
  persist(id)
  active = findScenario(id)
  random = createRandom(SCENARIO_RANDOM_SEED)
  return active
}

export function getScenario(): Scenario {
  return resolveScenario()
}

export function scenarioRandom() {
  resolveScenario()
  return random
}

/** Latency drawn from the active scenario's window. */
export function scenarioDelayMs(): number {
  const [min, max] = getScenario().network.latencyMs
  return scenarioRandom().int(min, max)
}

export function shouldFailTransiently(): boolean {
  const { failureRate } = getScenario().network
  return failureRate > 0 && scenarioRandom().next() < failureRate
}
