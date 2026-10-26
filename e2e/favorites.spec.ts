import { expect, firstCard, test } from './support/fixtures'

/** Flow 4 — the optimistic interaction and its rollback. */
test.describe('favoritos', () => {
  test('visitante é convidado a entrar', async ({ page, visit }) => {
    await visit('/mercado')
    await firstCard(page).getByRole('button', { name: /Adicionar aos favoritos/ }).click()
    await expect(page).toHaveURL(/\/entrar/)
  })

  test('favoritar é otimista e persiste', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/mercado')

    const heart = firstCard(page).getByRole('button', { name: /favoritos/ })

    const saved = page.waitForResponse(
      (response) =>
        response.url().includes('/api/favorites/') &&
        response.request().method() === 'PUT',
    )
    await heart.click()

    // Optimistic: pressed before the request that persists it has returned.
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    await saved

    await page.reload()
    await expect(firstCard(page).getByRole('button', { name: /favoritos/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('falha na mutation reverte o estado', async ({ page, visit, signIn, mocks }) => {
    await signIn()
    await visit('/mercado')

    const heart = firstCard(page).getByRole('button', { name: /favoritos/ })
    await expect(heart).toHaveAttribute('aria-pressed', 'false')

    // Every request fails from here on, so the optimistic write must roll back.
    await mocks.scenario('offline')
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'false', { timeout: 15_000 })
  })
})
