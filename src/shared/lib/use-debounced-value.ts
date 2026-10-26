import { useEffect, useState } from 'react'

/**
 * Returns `value` after it has stopped changing for `delay` milliseconds.
 *
 * Used to keep a keystroke-by-keystroke input from writing to the URL on every
 * character. It does not deduplicate requests — the catalog query already does
 * that structurally — it only decides when a draft is settled enough to become
 * shared state.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
