import {
  addFirstNftToCart,
  expect,
  reachConfirmableCheckout,
  test,
} from './support/fixtures'

/**
 * The outcome modal that opens over the receipt as soon as the order exists.
 */
test.describe('modal de conclusão do pedido', () => {
  test('abre com o pedido pendente e vira confirmação ao liquidar', async ({
    page,
    signIn,
  }) => {
    await signIn()
    const title = await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/pedido\//)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Processando sua compra')).toBeVisible()

    // The receipt is already final at creation: the snapshot does not wait for
    // the settlement, only the headline does.
    await expect(dialog.getByText(title)).toBeVisible()
    await expect(dialog.getByText('Detalhes da transação')).toBeVisible()
    await expect(dialog.getByText('ID da transação')).toBeVisible()

    await expect(dialog.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible({
      timeout: 25_000,
    })
    await expect(dialog.getByText('Processando sua compra')).toHaveCount(0)
  })

  test('pedido recusado mostra o desfecho e leva ao carrinho', async ({
    page,
    signIn,
  }) => {
    await page.goto('/?scenario=payment-declined')
    await page.waitForLoadState('networkidle')
    await signIn()

    await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/pedido\//)

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Pagamento recusado')).toBeVisible({
      timeout: 25_000,
    })

    await dialog.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page).toHaveURL(/\/carrinho/)
  })

  test('fechar revela o recibo e não reabre ao liquidar', async ({ page, signIn }) => {
    await signIn()
    await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/pedido\//)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)

    // The receipt underneath carries the same information.
    await expect(page.getByRole('heading', { name: 'Transação' })).toBeVisible()

    // Settling must not throw the panel back in the reader's face.
    await expect(page.getByText('Compra confirmada')).toBeVisible({ timeout: 25_000 })
    await expect(dialog).toHaveCount(0)
  })

  test('o modal prende o foco e não transborda', async ({ page, signIn }) => {
    await signIn()
    await addFirstNftToCart(page)
    await reachConfirmableCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    expect(await dialog.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(
      false,
    )
    expect(
      await page.evaluate(() => {
        const panel = document.querySelector('[role=dialog]')
        return Boolean(panel && panel.contains(document.activeElement))
      }),
    ).toBe(true)
  })
})
