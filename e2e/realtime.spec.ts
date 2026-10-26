import {
  addFirstNftToCart,
  expect,
  reachConfirmableCheckout,
  test,
} from './support/fixtures'

/** Flows 9 and 10 — Socket.IO during checkout, and event resilience. */
test.describe('tempo real', () => {
  async function firstCartNftId(page: import('@playwright/test').Page) {
    return page.evaluate(() =>
      fetch('/api/cart', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kurio.session-token')}`,
          'X-Guest-Id': localStorage.getItem('kurio.guest-id') ?? '',
        },
      })
        .then((r) => r.json())
        .then((d) => d.items[0].nftId as string),
    )
  }

  test('o socket está conectado e recebendo', async ({ page, visit, mocks }) => {
    await visit('/mercado')
    const result = await mocks.emitNftUpdated({
      nftId: 'nft_0062',
      factor: 1.5,
    })
    // The event went through a real socket client, not a cache poke.
    expect(result.subscribers).toBeGreaterThan(0)
  })

  test('mudança de preço durante o checkout bloqueia a confirmação', async ({
    page,
    signIn,
    mocks,
  }) => {
    await signIn()
    await addFirstNftToCart(page)
    const nftId = await firstCartNftId(page)

    await reachConfirmableCheckout(page)

    // The price moves while the user is looking at the review.
    await mocks.emitNftUpdated({ nftId, factor: 1.4 })

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByText('O pedido mudou')).toBeVisible({ timeout: 20_000 })

    // Still on the payment screen: a stale quote cannot be confirmed.
    await expect(page).toHaveURL(/\/pagamento/)
  })

  test('eventos duplicados e antigos não regridem o estado', async ({
    page,
    visit,
    mocks,
  }) => {
    await visit('/mercado')

    const nftId = 'nft_0062'
    const result = await mocks.emitNftUpdated({
      nftId,
      factor: 2,
      duplicates: 3,
      withStaleReplay: true,
    })

    // The stale replay carries price 0.01 and availability 0; if it were
    // applied, the card would show it. The current version must win.
    await page.goto(`/mercado?q=${encodeURIComponent('')}`)
    await page.waitForLoadState('networkidle')

    const priceOnScreen = await page.evaluate(
      (id) =>
        fetch(`/api/nfts?page=1&pageSize=48`)
          .then((r) => r.json())
          .then(
            (d) => d.data.find((n: { id: string }) => n.id === id)?.priceEth as string,
          ),
      nftId,
    )
    expect(priceOnScreen).toBe(result.priceEth)
    expect(priceOnScreen).not.toBe('0.01')
  })

  test('pedido pendente é retomado após recarregar', async ({ page, signIn }) => {
    await page.goto('/?scenario=payment-declined')
    await page.waitForLoadState('networkidle')
    await signIn()

    await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/pedido\//)
    const receipt = page.url()

    // Reloading mid-settlement must recover the same order, never create one.
    await page.reload()
    await page.waitForLoadState('networkidle')
    expect(page.url()).toBe(receipt)

    await expect(page.getByText('Pagamento recusado')).toBeVisible({ timeout: 25_000 })

    const orders = await page.evaluate(() =>
      fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kurio.session-token')}`,
        },
      })
        .then((r) => r.json())
        .then((d) => d.data.length as number),
    )
    expect(orders).toBe(1)
  })
})
