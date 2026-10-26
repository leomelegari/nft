import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { DEFAULT_SEED } from '@/mocks/db/seed'
import { resetDb } from '@/mocks/db/store'
import { SCENARIOS, getScenario, setScenario } from '@/mocks/scenarios'
import { mutateDb } from '@/mocks/db/store'
import { emitNftUpdated, republish } from '@/mocks/socket/events'
import { subscriberCount } from '@/mocks/socket/registry'
import type { NftUpdatedEvent } from '@/entities/events'

/**
 * Control plane for the mock layer.
 *
 * These endpoints deliberately bypass `handler()` and therefore the simulated
 * network conditions: a test must be able to reset state or switch scenarios
 * even while the "offline" or "timeout" scenario is active.
 */
const resetInputSchema = z.object({
  seed: z.number().int().optional(),
  scenario: z.string().optional(),
})

const priceChangeSchema = z.object({
  nftId: z.string(),
  /** Multiplier applied to every edition price, e.g. 1.25 for +25%. */
  factor: z.number().positive().default(1.2),
  /** Sets remaining availability on every edition when provided. */
  available: z.number().int().nonnegative().optional(),
  /** Re-sends the identical event N extra times, to exercise de-duplication. */
  duplicates: z.number().int().min(0).max(5).default(0),
  /** Also sends a copy with a stale version, which must be ignored. */
  withStaleReplay: z.boolean().default(false),
})

export const controlHandlers = [
  http.post('/api/__mock/reset', async ({ request }) => {
    const body = await request.json().catch(() => ({}))
    const input = resetInputSchema.safeParse(body)
    const seed = input.success ? (input.data.seed ?? DEFAULT_SEED) : DEFAULT_SEED

    if (input.success && input.data.scenario) {
      setScenario(input.data.scenario)
    }

    resetDb(seed)
    return HttpResponse.json({ ok: true, seed, scenario: getScenario().id })
  }),

  http.get('/api/__mock/scenario', () =>
    HttpResponse.json({
      active: getScenario(),
      available: SCENARIOS.map(({ id, label, description }) => ({
        id,
        label,
        description,
      })),
    }),
  ),

  /**
   * Drives a catalog change over the socket on demand.
   *
   * Lets a test reproduce "the price changed while the user was shopping"
   * deterministically, including duplicate and stale deliveries, without
   * waiting for a scenario to happen to fire.
   */
  http.post('/api/__mock/emit/nft-updated', async ({ request }) => {
    const body = await request.json().catch(() => ({}))
    const input = priceChangeSchema.safeParse(body)

    if (!input.success) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Parâmetros inválidos.' } },
        { status: 422 },
      )
    }

    const { nftId, factor, available, duplicates, withStaleReplay } = input.data

    const updated = mutateDb((draft) => {
      const nft = draft.nfts.find((item) => item.id === nftId)
      if (!nft) return null

      for (const edition of nft.editions) {
        edition.priceEth = (Number(edition.priceEth) * factor).toFixed(
          4,
        ) as typeof edition.priceEth
        if (available !== undefined) edition.available = available
      }

      nft.available = nft.editions.reduce((sum, item) => sum + item.available, 0)
      const cheapest = nft.editions.reduce((low, item) =>
        Number(item.priceEth) < Number(low.priceEth) ? item : low,
      )
      nft.priceEth = cheapest.priceEth
      nft.version += 1
      return nft
    })

    if (!updated) {
      return HttpResponse.json(
        { error: { code: 'NOT_FOUND', message: 'NFT não encontrado.' } },
        { status: 404 },
      )
    }

    emitNftUpdated(updated)

    // Identical re-deliveries: the client must ignore every one of them.
    for (let index = 0; index < duplicates; index += 1) emitNftUpdated(updated)

    if (withStaleReplay) {
      const stale: NftUpdatedEvent = {
        type: 'nft.updated',
        eventId: 'evt_stale_replay',
        resourceId: updated.id,
        version: Math.max(0, updated.version - 2),
        occurredAt: new Date(Date.now() - 60_000).toISOString(),
        sessionId: null,
        payload: {
          priceEth: '0.01' as typeof updated.priceEth,
          available: 0,
          editions: updated.editions.map((edition) => ({
            id: edition.id,
            priceEth: '0.01' as typeof edition.priceEth,
            available: 0,
          })),
        },
      }
      republish(stale)
    }

    return HttpResponse.json({
      ok: true,
      nftId: updated.id,
      version: updated.version,
      priceEth: updated.priceEth,
      available: updated.available,
      subscribers: subscriberCount(),
    })
  }),

  http.get('/api/__mock/socket', () =>
    HttpResponse.json({ subscribers: subscriberCount() }),
  ),

  http.post('/api/__mock/scenario', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { id?: string }
    if (!body.id) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Informe o id do cenário.' } },
        { status: 422 },
      )
    }
    return HttpResponse.json({ active: setScenario(body.id) })
  }),
]
