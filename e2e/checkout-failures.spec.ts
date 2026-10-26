import {
  addFirstNftToCart,
  expect,
  reachConfirmableCheckout,
  test,
} from './support/fixtures'

/** Flow 7 — declined payment, repeated clicks and timeout recovery. */
test.describe('falhas no pagamento', () => {
  test('pagamento recusado preserva os itens do carrinho', async ({ page, signIn }) => {
    await page.goto('/?scenario=payment-declined')
    await page.waitForLoadState('networkidle')
    await signIn()

    const title = await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page.getByText('Pagamento recusado')).toBeVisible({ timeout: 25_000 })

    // Nothing was bought, so nothing may leave the basket.
    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(title).first()).toBeVisible()
  })

  test('cliques repetidos não criam dois pedidos', async ({ page, signIn }) => {
    await signIn()
    await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)

    // Three clicks in the same tick — the impatient double/triple click, not
    // three deliberate attempts. Playwright's own actionability checks would
    // space them out and never reproduce it.
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((candidate) =>
        candidate.textContent?.includes('Confirmar compra'),
      )
      button?.click()
      button?.click()
      button?.click()
    })

    await expect(page).toHaveURL(/\/pedido\//, { timeout: 25_000 })
    await expect(page.getByText(/Compra confirmada|Processando/).first()).toBeVisible({
      timeout: 25_000,
    })

    const orders = await page.evaluate(() =>
      fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kurio.session-token')}`,
        },
      })
        .then((r) => r.json())
        .then((d) => (Array.isArray(d.data) ? d.data.length : d.length)),
    )
    expect(orders).toBe(1)
  })

  test('timeout após criar o pedido é recuperado pela mesma chave', async ({
    page,
    signIn,
  }) => {
    await page.goto('/?scenario=order-timeout')
    await page.waitForLoadState('networkidle')
    await signIn()

    await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    // The order was persisted; the response never arrived, so the UI reports
    // the failure instead of pretending it succeeded.
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 30_000 })

    // Retrying reuses the idempotency key and recovers the same order rather
    // than buying twice.
    await page
      .getByRole('button', { name: /Confirmar compra|Tentar novamente/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/pedido\//, { timeout: 30_000 })

    const orders = await page.evaluate(() =>
      fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kurio.session-token')}`,
        },
      })
        .then((r) => r.json())
        .then((d) => (Array.isArray(d.data) ? d.data.length : d.length)),
    )
    expect(orders).toBe(1)
  })
})
