import { COLLECTION_LABELS, COLLECTION_SLUGS } from '@/entities/nft'

/**
 * Collection rows sorted alphabetically (pt-BR) by label for display.
 *
 * `COLLECTION_SLUGS` itself keeps its original order: `seed.ts` iterates it to
 * generate the deterministic fixture catalog, and reordering the source array
 * would shift which id gets assigned to which collection, invalidating the
 * visual-regression baselines. Sorting is therefore done here, once, at module
 * scope — not with a per-render sort of the canonical array.
 */
export const SORTED_COLLECTION_SLUGS = [...COLLECTION_SLUGS].sort((a, b) =>
  COLLECTION_LABELS[a].localeCompare(COLLECTION_LABELS[b], 'pt-BR'),
)

/** Adds or removes `value`, returning a new array. */
export function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}
