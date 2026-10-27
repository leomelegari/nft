import { addFirstNftToCart, expect, test } from './support/fixtures'

/**
 * Visual regression of the screens the brief names, plus the market screen
 * added to this delivery.
 *
 * Every shot runs on the `default` scenario and the fixed seed, so the data is
 * identical between runs. Animations are disabled by the config; the live
 * socket is the only remaining source of movement and it does not fire on its
 * own in this scenario.
 */
test.describe('regressão visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('início', async ({ page, visit }) => {
    await visit('/')
    await expect(page.locator('#catalogo article').first()).toBeVisible()
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('mercado', async ({ page, visit }) => {
    await visit('/mercado')
    await expect(page.locator('#resultados article').first()).toBeVisible()
    await expect(page).toHaveScreenshot('mercado.png', { fullPage: true })
  })

  test('mercado em lista', async ({ page, visit }) => {
    await visit('/mercado?view=list')
    await expect(page.locator('#resultados article').first()).toBeVisible()
    await expect(page).toHaveScreenshot('mercado-lista.png', { fullPage: true })
  })

  test('detalhe do NFT', async ({ page, visit }) => {
    await visit('/mercado')
    const href = await page.locator('article h3 a').first().getAttribute('href')
    await page.goto(href!)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('carrinho', async ({ page, signIn }) => {
    await signIn()
    await addFirstNftToCart(page)
    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('pagamento', async ({ page, signIn }) => {
    await signIn()
    await addFirstNftToCart(page)
    await page.goto('/pagamento')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeVisible()
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
  })

  test('perfil do colecionador', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/perfil')
    await expect(
      page.getByRole('heading', { name: 'Perfil do colecionador' }),
    ).toBeVisible()
    await expect(page).toHaveScreenshot('perfil.png', { fullPage: true })
  })

  test('lista de interesse', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/lista-de-interesse')
    await expect(
      page.getByRole('heading', { name: 'Lista de interesse', level: 1 }),
    ).toBeVisible()
    await expect(page).toHaveScreenshot('lista-de-interesse.png', { fullPage: true })
  })

  test('carteiras', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/carteiras')
    await expect(
      page.getByRole('heading', { name: 'Carteiras', exact: true }),
    ).toBeVisible()
    await expect(page).toHaveScreenshot('carteiras.png', { fullPage: true })
  })
})
