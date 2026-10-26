import { addFirstNftToCart, expect, test } from './support/fixtures'

/** Flow 5 — quantities, removal, coupon and persistence. */
test.describe('carrinho', () => {
  test('quantidade e remoção refletem no resumo', async ({ page, signIn }) => {
    await signIn()
    const title = await addFirstNftToCart(page)

    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(title).first()).toBeVisible()

    const total = page.getByText(/ETH/).last()
    const before = await total.innerText()

    await page
      .getByRole('button', { name: /Aumentar/i })
      .first()
      .click()
    await expect(page.locator('output').first()).toHaveText('2')
    await expect.poll(async () => total.innerText()).not.toBe(before)

    await page.getByRole('button', { name: new RegExp(`Remover ${title}`) }).click()
    await expect(page.getByText(title)).toHaveCount(0)
  })

  test('cupom válido aplica desconto e pode ser removido', async ({ page, signIn }) => {
    await signIn()
    await addFirstNftToCart(page)
    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('Digite o código promocional...').fill('GREENMINT10')
    await page.getByRole('button', { name: 'Aplicar' }).click()

    await expect(page.getByRole('button', { name: 'Remover' })).toBeVisible()
    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByRole('button', { name: 'Aplicar' })).toBeVisible()
  })

  test('cupom inválido e expirado são recusados com mensagem', async ({
    page,
    signIn,
  }) => {
    await signIn()
    await addFirstNftToCart(page)
    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')

    const field = page.getByPlaceholder('Digite o código promocional...')

    await field.fill('NAOEXISTE')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/inválido|não encontrad/i).first()).toBeVisible()

    await field.fill('EXPIRADO15')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText(/expirou|expirad/i).first()).toBeVisible()
  })

  test('o carrinho sobrevive a refresh', async ({ page, signIn }) => {
    await signIn()
    const title = await addFirstNftToCart(page)

    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(title).first()).toBeVisible()

    await page.reload()
    await expect(page.getByText(title).first()).toBeVisible()
  })

  test('itens do visitante são preservados ao autenticar', async ({ page, signIn }) => {
    // Added while anonymous...
    const title = await addFirstNftToCart(page)
    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(title).first()).toBeVisible()

    // ...must still be there after signing in.
    await signIn()
    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(title).first()).toBeVisible()
  })
})
