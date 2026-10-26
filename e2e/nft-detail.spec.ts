import { expect, firstCard, test } from './support/fixtures'

/** Flow 2 — direct access, missing resource, editions and quantity limits. */
test.describe('detalhe do NFT', () => {
  test('acesso direto por URL renderiza o NFT', async ({ page, visit }) => {
    await visit('/mercado')
    const title = await firstCard(page).locator('h3').innerText()
    const href = await firstCard(page).locator('h3 a').getAttribute('href')

    await page.goto(href!)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(
      page.getByRole('navigation', { name: 'Trilha de navegação' }),
    ).toBeVisible()
  })

  test('NFT inexistente mostra o estado de não encontrado', async ({ page }) => {
    await page.goto('/nft/este-nft-nao-existe')
    await expect(
      page
        .getByRole('alert')
        .or(page.getByText(/não existe|não encontrad/i))
        .first(),
    ).toBeVisible()
  })

  test('o limite por pedido trava o incremento de quantidade', async ({
    page,
    visit,
  }) => {
    await visit('/mercado')
    await firstCard(page).locator('h3 a').click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const increase = page.getByRole('button', { name: /Aumentar/i })
    const output = page.locator('output')

    // Climb until the control disables itself; it must never exceed the cap.
    for (let index = 0; index < 30; index += 1) {
      if (await increase.isDisabled()) break
      await increase.click()
    }

    await expect(increase).toBeDisabled()
    const limitText = await page
      .getByText(/Limite de \d+ unidades|Restam \d+ unidades/)
      .innerText()
    const cap = Number(limitText.match(/\d+/)![0])
    await expect(output).toHaveText(String(cap))
  })

  test('a edição esgotada desabilita a compra', async ({ page, visit, mocks }) => {
    await visit('/mercado')
    const href = await firstCard(page).locator('h3 a').getAttribute('href')
    await page.goto(href!)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const nftId = await page.evaluate(() =>
      fetch('/api/nfts' + window.location.pathname.replace('/nft', ''))
        .then((r) => r.json())
        .then((n) => n.id as string),
    )
    await mocks.emitNftUpdated({ nftId, available: 0, factor: 1 })

    await expect(page.getByRole('button', { name: 'ESGOTADO' })).toBeDisabled()
  })
})
