import { COLLECTION_SLUGS, type CollectionSlug, NETWORKS } from '@/entities/nft'
import { toEth } from '@/shared/money'
import { createRandom } from '@/mocks/db/random'
import type { MockDb, MockNft, MockUser } from '@/mocks/db/types'

export const DB_SCHEMA_VERSION = 1
export const DEFAULT_SEED = 20260426

/**
 * Collection sizes are taken verbatim from the Figma sidebar so the rendered
 * facet counts match the design. Network counts in the design (119/78/86) sum
 * to a different total and are therefore derived from the data instead — see
 * ARCHITECTURE.md, "Desvios do Figma".
 */
const COLLECTION_SIZES: Record<CollectionSlug, number> = {
  'arte-digital': 33,
  fotografia: 12,
  musica: 65,
  'arte-3d': 39,
  colecionaveis: 23,
  generativa: 17,
  jogos: 19,
  assinaturas: 13,
  utilidade: 18,
}

/** Artwork pool; fixtures cycle through it deterministically. */
const ARTWORK_COUNT = 18

const NAME_PREFIXES = [
  'Emerald',
  'Sage',
  'Neon',
  'Cosmic',
  'Violet',
  'Golden',
  'Amber',
  'Crimson',
  'Obsidian',
  'Lunar',
  'Solar',
  'Ivory',
  'Azure',
  'Ember',
  'Jade',
  'Onyx',
] as const

const NAME_SUFFIXES = [
  'Ape',
  'Nomad',
  'Visual',
  'Bloom',
  'Baron',
  'West',
  'Signal',
  'Drifter',
  'Oracle',
  'Relic',
  'Cipher',
  'Wanderer',
  'Pulse',
  'Monarch',
] as const

const CREATORS = [
  { name: 'Lia Barros', handle: '@liabarros' },
  { name: 'Theo Nakamura', handle: '@theonkmr' },
  { name: 'Ana Cardoso', handle: '@anacrd' },
  { name: 'Rui Sampaio', handle: '@ruisampaio' },
  { name: 'Mira Okafor', handle: '@miraokafor' },
  { name: 'Davi Quintela', handle: '@dquintela' },
] as const

const TRAITS = [
  { trait: 'Fundo', values: ['Âmbar', 'Carvão', 'Jade', 'Vinho', 'Areia'] },
  { trait: 'Acessório', values: ['Óculos', 'Fone', 'Boné', 'Cachecol', 'Nenhum'] },
  { trait: 'Raridade', values: ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'] },
  { trait: 'Expressão', values: ['Sereno', 'Alerta', 'Divertido', 'Pensativo'] },
] as const

const EDITION_PLANS = [
  [{ label: 'Edição padrão', supplyMin: 20, supplyMax: 120, multiplier: 1 }],
  [
    { label: 'Edição padrão', supplyMin: 40, supplyMax: 200, multiplier: 1 },
    { label: 'Edição rara', supplyMin: 5, supplyMax: 25, multiplier: 1.8 },
  ],
  [
    { label: 'Edição aberta', supplyMin: 80, supplyMax: 300, multiplier: 0.8 },
    { label: 'Edição padrão', supplyMin: 30, supplyMax: 90, multiplier: 1 },
    { label: 'Edição gênese', supplyMin: 1, supplyMax: 8, multiplier: 2.6 },
  ],
] as const

const EPOCH = Date.UTC(2026, 0, 1)
const DAY_MS = 86_400_000

function buildNfts(seed: number): MockNft[] {
  const random = createRandom(seed)
  const nfts: MockNft[] = []
  let index = 0

  for (const collection of COLLECTION_SLUGS) {
    const size = COLLECTION_SIZES[collection]

    for (let n = 0; n < size; n += 1) {
      index += 1

      const title = `${random.pick(NAME_PREFIXES)} ${random.pick(NAME_SUFFIXES)} #${String(
        random.int(1, 999),
      ).padStart(3, '0')}`
      const slug = `${title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}-${index}`
      const artwork = `/nft/artwork-${String((index % ARTWORK_COUNT) + 1).padStart(2, '0')}.png`
      const creator = random.pick(CREATORS)

      // Base price spans the 0.02 – 12.30 ETH range shown in the Figma filter.
      const basePrice = Number(random.decimal(0.02, 12.3, 2))
      const plan = random.pick(EDITION_PLANS)

      const editions = plan.map((spec, editionIndex) => {
        const supply = random.int(spec.supplyMin, spec.supplyMax)
        // ~8% of editions ship sold out so the "edição esgotada" path has data.
        const available = random.bool(0.08) ? 0 : random.int(1, supply)
        return {
          id: `${slug}-ed${editionIndex + 1}`,
          label: spec.label,
          priceEth: toEth((basePrice * spec.multiplier).toFixed(2)),
          supply,
          available,
          maxPerOrder: Math.min(10, Math.max(1, Math.ceil(supply / 20))),
        }
      })

      const cheapest = editions.reduce((low, edition) =>
        Number(edition.priceEth) < Number(low.priceEth) ? edition : low,
      )
      const available = editions.reduce((sum, edition) => sum + edition.available, 0)

      nfts.push({
        id: `nft_${String(index).padStart(4, '0')}`,
        slug,
        title,
        priceEth: cheapest.priceEth,
        image: artwork,
        imageAlt: `Arte digital "${title}" de ${creator.name}`,
        collection,
        network: random.pick(NETWORKS),
        available,
        version: 1,
        description:
          `${title} integra a coleção ${collection.replace(/-/g, ' ')} com curadoria da GreenMint. ` +
          'A peça é emitida on-chain com metadados imutáveis e procedência verificável, ' +
          'acompanhada de licença de uso pessoal para o colecionador.',
        gallery: [
          { src: artwork, alt: `Arte digital "${title}" de ${creator.name}` },
          { src: artwork, alt: `Detalhe da composição de "${title}"` },
          { src: artwork, alt: `Variação cromática de "${title}"` },
        ],
        creator: { ...creator, avatar: `/avatars/creator-${(index % 6) + 1}.svg` },
        editions,
        attributes: TRAITS.map((entry) => ({
          trait: entry.trait,
          value: random.pick(entry.values),
        })),
        rating: Number(random.decimal(3.4, 5, 1)),
        reviewCount: random.int(3, 420),
        listedAt: new Date(EPOCH + random.int(0, 300) * DAY_MS).toISOString(),
        trendScore: Number(random.decimal(0, 100, 2)),
      })
    }
  }

  return nfts
}

/**
 * Simulated password digest. This is deliberately NOT a real KDF — it exists so
 * the fixture never holds a plain-text password, which the brief forbids.
 */
export function digestPassword(password: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < password.length; i += 1) {
    hash ^= password.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `sim$${(hash >>> 0).toString(16)}`
}

/** Fictional credentials, documented in the README. */
export const SEED_CREDENTIALS = [
  { email: 'colecionador@greenmint.test', password: 'Colecionador1' },
  { email: 'curadora@greenmint.test', password: 'Curadora2026' },
] as const

function buildUsers(): MockUser[] {
  return [
    {
      id: 'usr_colecionador',
      name: 'Marina Duarte',
      email: 'colecionador@greenmint.test',
      avatar: '/avatars/user-1.svg',
      bio: 'Colecionadora de arte generativa desde 2021.',
      location: 'São Paulo, BR',
      memberSince: new Date(Date.UTC(2021, 4, 12)).toISOString(),
      passwordDigest: digestPassword('Colecionador1'),
      wallets: [
        {
          id: 'wlt_marina_primary',
          kind: 'primary',
          label: 'Cofre principal',
          provider: 'metamask',
          network: 'ethereum',
          address: '0x8f2a559490f1d2b5c0b1f4b4e9a0a3d7c6e51b24',
        },
      ],
    },
    {
      id: 'usr_curadora',
      name: 'Helena Vasques',
      email: 'curadora@greenmint.test',
      avatar: '/avatars/user-2.svg',
      bio: 'Curadora independente e pesquisadora de arte digital.',
      location: 'Lisboa, PT',
      memberSince: new Date(Date.UTC(2022, 9, 3)).toISOString(),
      passwordDigest: digestPassword('Curadora2026'),
      wallets: [
        {
          id: 'wlt_helena_primary',
          kind: 'primary',
          label: 'Carteira de curadoria',
          provider: 'coinbase',
          network: 'polygon',
          address: '0x41c7d9e05b6a2f8c3d1e7b904a5f6c8d2e3b1a90',
        },
        {
          id: 'wlt_helena_secondary',
          kind: 'secondary',
          label: 'Carteira Solana',
          provider: 'phantom',
          network: 'solana',
          address: '7xKXtg2CW3SpVcPGoJdmFvLQsWqGpJbRhTnZyA4eU1Mk',
        },
      ],
    },
  ]
}

export function createSeedDb(seed: number = DEFAULT_SEED): MockDb {
  return {
    schemaVersion: DB_SCHEMA_VERSION,
    seed,
    users: buildUsers(),
    sessions: [],
    nfts: buildNfts(seed),
    favorites: [{ userId: 'usr_colecionador', nftId: 'nft_0003' }],
    carts: [],
    quotes: [],
    orders: [],
    idempotency: [],
    counters: {},
  }
}
