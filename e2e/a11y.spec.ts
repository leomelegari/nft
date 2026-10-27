import { addFirstNftToCart, expect, openMainNav, test } from './support/fixtures'

/** Flow 11 — keyboard operation, dialog focus and field-bound validation. */
test.describe('acessibilidade', () => {
  test('o skip link é o primeiro foco e leva ao conteúdo', async ({ page, visit }) => {
    await visit('/')
    await page.keyboard.press('Tab')

    const skip = page.getByRole('link', { name: /Pular para o conteúdo/i })
    await expect(skip).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main-content/)
  })

  test('a navegação principal é operável por teclado', async ({ page, visit }) => {
    await visit('/')

    const nav = await openMainNav(page)
    const market = nav.getByRole('link', { name: 'Mercado' })
    await market.focus()
    await expect(market).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/mercado/)
  })

  test('o diálogo prende o foco e o devolve ao gatilho', async ({ page, visit }) => {
    await visit('/mercado')

    const trigger = page.getByRole('button', { name: 'Abrir menu de navegação' })
    // The drawer is the mobile control; force it open from the desktop DOM.
    await page.setViewportSize({ width: 390, height: 844 })
    await trigger.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Focus is inside the dialog, not left behind on the page.
    const focusedInside = await page.evaluate(() => {
      const dialogEl = document.querySelector('[role=dialog]')
      return Boolean(dialogEl && dialogEl.contains(document.activeElement))
    })
    expect(focusedInside).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('o diálogo da carteira não transborda do painel', async ({ page, signIn }) => {
    await signIn()
    await addFirstNftToCart(page)
    await page.goto('/pagamento')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Conectar carteira' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // The 42-character address used to widen the dialog's implicit grid
    // column past its own max-width, pushing "Aprovar conexão" out of view.
    expect(await dialog.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(
      false,
    )

    const panel = (await dialog.boundingBox())!
    const approve = (await page
      .getByRole('button', { name: 'Aprovar conexão' })
      .boundingBox())!

    expect(approve.x).toBeGreaterThanOrEqual(panel.x)
    expect(approve.x + approve.width).toBeLessThanOrEqual(panel.x + panel.width)

    // The address is what is being approved, so all of it must be readable.
    await expect(
      dialog.getByText(/^0x[0-9a-f]{40}$/i).or(dialog.getByText(/0x8f2a/)),
    ).toBeVisible()
  })

  test('erros de formulário são associados aos campos', async ({ page, visit }) => {
    await visit('/entrar')

    await page.getByRole('textbox', { name: 'E-mail' }).fill('invalido')
    await page.locator('input[type=password]').first().fill('x')
    await page
      .getByRole('button', { name: /^entrar$/i })
      .last()
      .click()

    const email = page.getByRole('textbox', { name: 'E-mail' })
    await expect(email).toHaveAttribute('aria-invalid', 'true')

    // The message the field points at is the one actually rendered.
    const describedBy = await email.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    await expect(page.locator(`#${describedBy!.split(' ')[0]}`)).toBeVisible()
  })

  test('o estado ativo do nav não depende só de cor', async ({ page, visit }) => {
    await visit('/mercado')
    const nav = await openMainNav(page)
    await expect(nav.getByRole('link', { name: 'Mercado' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
