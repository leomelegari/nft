import { addFirstNftToCart, expect, reachConfirmableCheckout, test } from './support/fixtures'

/** Flow 6 — the complete purchase, catalog to confirmed receipt. */
test.describe('compra completa', () => {
  test('do catálogo ao recibo confirmado', async ({ page, signIn }) => {
    await signIn()
    const title = await addFirstNftToCart(page)

    await reachConfirmableCheckout(page)
    await expect(page.getByText(title).first()).toBeVisible()

    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/pedido\//);
    await expect(page.getByText('Compra confirmada')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(title).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Transação' })).toBeVisible()

    // The purchased line leaves the cart.
    await page.goto('/carrinho')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(title)).toHaveCount(0)
  })

  test('o recibo é um snapshot: mudanças no catálogo não o alteram', async ({
    page,
    signIn,
    mocks,
  }) => {
    await signIn()
    await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page.getByText('Compra confirmada')).toBeVisible({ timeout: 20_000 })
    const receiptUrl = page.url()
    const total = await page.getByText(/ETH/).last().innerText()

    const nftId = await page.evaluate(() =>
      fetch('/api/nfts?page=1&pageSize=1')
        .then((r) => r.json())
        .then((d) => d.data[0].id as string),
    )
    await mocks.emitNftUpdated({ nftId, factor: 3 })

    await page.goto(receiptUrl)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/ETH/).last()).toHaveText(total)
  })

  test('acesso direto ao pedido de outro usuário é negado', async ({
    page,
    signIn,
  }) => {
    await signIn()
    await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByText('Compra confirmada')).toBeVisible({ timeout: 20_000 })
    const receiptUrl = page.url()

    await page.getByRole('banner').getByRole('button').last().click()
    await page.getByRole('button', { name: /Sair da conta/ }).click()
    await expect(page).toHaveURL('/')

    await signIn('curator')
    await page.goto(receiptUrl)
    await expect(page.getByText(/não encontrado|permissão|não existe/i).first()).toBeVisible()
  })
})
