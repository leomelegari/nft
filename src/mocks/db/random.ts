/**
 * Deterministic pseudo-random source.
 *
 * Fixtures must be byte-identical on every run: Playwright's visual regression
 * baselines and the Lighthouse "cenário padrão" both depend on the catalog
 * being exactly the same every time. `Math.random` would make both flaky.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    /** Integer in [min, max]. */
    int(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1))
    },
    /** Decimal string with `places` fraction digits, in [min, max]. */
    decimal(min: number, max: number, places: number): string {
      return (min + next() * (max - min)).toFixed(places)
    },
    pick<T>(items: readonly T[]): T {
      const item = items[Math.floor(next() * items.length)]
      if (item === undefined) throw new Error('pick() called with an empty list')
      return item
    },
    bool(probability = 0.5): boolean {
      return next() < probability
    },
  }
}

export type Random = ReturnType<typeof createRandom>
