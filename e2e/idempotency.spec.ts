import { addFirstNftToCart, expect, test } from './support/fixtures'

/**
 * Section 5 of the brief: the same idempotency key must recover the same
 * order, and reusing it with different content must conflict.
 *
 * Driven against the REST contract rather than the UI, because the key is an
 * implementation detail the screen deliberately never exposes — the client
 * generates one per attempt and reuses it on retry. The brief allows this:
 * "os de REST pelos handlers MSW".
 */
test.describe('idempotência de pedidos', () => {
  test('mesma chave recupera o pedido; conteúdo diferente gera conflito', async ({
    page,
    signIn,
  }) => {
    await signIn()
    await addFirstNftToCart(page)

    const result = await page.evaluate(async () => {
      const token = localStorage.getItem('kurio.session-token')
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      const post = async (url: string, body: unknown, extra: HeadersInit = {}) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: { ...headers, ...extra },
          body: JSON.stringify(body),
        })
        return { status: response.status, body: await response.json().catch(() => null) }
      }

      const quote = await post('/api/cart/quote', {})
      const wallets = await fetch('/api/wallets', { headers }).then((r) => r.json())

      const base = {
        quoteId: quote.body.id,
        walletId: wallets.data[0].id,
        network: wallets.data[0].network,
        collector: {
          displayName: 'Marina Duarte',
          username: 'marina',
          email: 'colecionador@kurio.test',
          profileName: '',
          referralCode: '',
          note: '',
        },
      }

      const key = { 'Idempotency-Key': 'e2e-fixed-key' }

      const first = await post('/api/orders', base, key)
      const replay = await post('/api/orders', base, key)
      const conflicting = await post(
        '/api/orders',
        { ...base, collector: { ...base.collector, displayName: 'Outro Nome' } },
        key,
      )

      const orders = await fetch('/api/orders', { headers }).then((r) => r.json())

      return {
        first: first.status,
        firstId: first.body?.id,
        replay: replay.status,
        replayId: replay.body?.id,
        conflicting: conflicting.status,
        conflictCode: conflicting.body?.error?.code,
        orderCount: orders.data.length,
      }
    })

    expect(result.first).toBe(201)

    // Same key, same content: the very same order comes back, not a new one.
    expect(result.replay).toBe(200)
    expect(result.replayId).toBe(result.firstId)

    // Same key, different content: refused.
    expect(result.conflicting).toBe(409)
    expect(result.conflictCode).toBe('IDEMPOTENCY_CONFLICT')

    // Three requests, one purchase.
    expect(result.orderCount).toBe(1)
  })
})
