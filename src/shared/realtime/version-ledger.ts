/**
 * Highest applied version per resource.
 *
 * Events can arrive twice, out of order, or after a reconnect replays them.
 * Recording the highest version applied per resource makes all three harmless:
 * anything at or below the recorded version is dropped before it touches the
 * cache, so no effect is ever reapplied and newer state is never regressed.
 */
export class VersionLedger {
  readonly #versions = new Map<string, number>()

  /**
   * Returns true when the event is newer than anything applied so far, and
   * records it. Returns false when it should be ignored.
   */
  accept(resourceId: string, version: number): boolean {
    const applied = this.#versions.get(resourceId)
    if (applied !== undefined && version <= applied) return false
    this.#versions.set(resourceId, version)
    return true
  }

  /** Cleared on sign-out and on user switch, along with the private caches. */
  clear(): void {
    this.#versions.clear()
  }

  get size(): number {
    return this.#versions.size
  }
}
