import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { DEFAULT_SEED } from '@/mocks/db/seed'
import { resetDb } from '@/mocks/db/store'
import { SCENARIOS, getScenario, setScenario } from '@/mocks/scenarios'

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
