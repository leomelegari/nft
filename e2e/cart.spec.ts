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

  test('o cupom acompanha o checkout e entra no pedido', async ({ page, signIn }) => {
    await signIn()
    await addFirstNftToCart(page)
    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')

    await page.getByPlaceholder('Digite o código promocional...').fill('GREENMINT10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByRole('button', { name: 'Remover' })).toBeVisible()

    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()

    // The coupon lives in the URL on both screens; the link used to drop it,
    // which left the payment screen quoting without it.
    await expect(page).toHaveURL(/cupom=GREENMINT10/)

    // A fresh load is the case that exposed it: without the param the quote
    // came back with no discount at all.
    await page.reload()
    await page.waitForLoadState('networkidle')

    const quoted = await page.evaluate(() =>
      fetch('/api/cart/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kurio.session-token')}`,
        },
        body: JSON.stringify({ couponCode: 'GREENMINT10' }),
      })
        .then((r) => r.json())
        .then((q) => ({ discount: q.discountEth, coupon: q.coupon?.code })),
    )
    expect(Number(quoted.discount)).toBeGreaterThan(0)
    expect(quoted.coupon).toBe('GREENMINT10')

    // And the money actually charged carries it.
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await page.getByRole('button', { name: 'Aprovar conexão' }).click()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/pedido\//)

    const order = await page.evaluate(() =>
      fetch('/api/orders', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('kurio.session-token')}`,
        },
      })
        .then((r) => r.json())
        .then((d) => d.data[0]),
    )
    expect(order.coupon?.code).toBe('GREENMINT10')
    expect(Number(order.discountEth)).toBeGreaterThan(0)
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
