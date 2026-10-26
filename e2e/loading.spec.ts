import { expect, test } from './support/fixtures'

/** Flow 12 — skeletons while slow, failure feedback and recovery on retry. */
test.describe('carregamento e falhas', () => {
  test('skeletons aparecem enquanto o catálogo carrega', async ({ page }) => {
    await page.goto('/mercado?scenario=slow')

    // The shimmer placeholders must be on screen before the data is.
    await expect(page.getByText('Carregando itens do mercado')).toBeVisible()
    await expect(page.locator('.shimmer').first()).toBeVisible()

    await expect(page.locator('#resultados article').first()).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.locator('.shimmer')).toHaveCount(0)
  })

  test('o detalhe também usa skeleton', async ({ page, visit }) => {
    await visit('/mercado')
    const href = await page.locator('article h3 a').first().getAttribute('href')

    await page.goto(`${href}?scenario=slow`)
    await expect(page.locator('.shimmer').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 })
  })

  test('falha de conexão é comunicada e se recupera ao tentar de novo', async ({
    page,
    mocks,
  }) => {
    await page.goto('/mercado?scenario=offline')

    const alert = page.getByRole('alert').first()
    await expect(alert).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()

    // Connection comes back; the same button must recover the screen.
    await mocks.scenario('default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()

    await expect(page.locator('#resultados article').first()).toBeVisible({
      timeout: 30_000,
    })
  })

  test('o movimento reduzido desliga o shimmer', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/mercado?scenario=slow')

    const shimmer = page.locator('.shimmer').first()
    await expect(shimmer).toBeVisible()

    const animation = await shimmer.evaluate(
      (node) => getComputedStyle(node).animationName,
    )
    expect(animation).toBe('none')
  })
})
