import type { Page } from '@playwright/test'
import { expect, firstCard, test } from './support/fixtures'

/** Prices as rendered on the cards, in document order. */
async function ascendingPrices(page: Page): Promise<boolean> {
  const texts = await page.locator('article p.font-bold').allInnerTexts()
  const values = texts.map((text) =>
    Number(text.replace(/[^\d.,]/g, '').replace(',', '.')),
  )
  if (values.length === 0 || values.some(Number.isNaN)) return false
  return values.every((value, index) => index === 0 || values[index - 1]! <= value)
}

/**
 * Flow 1 — search, combined filters, sorting, pagination and history
 * restoration, on both listing surfaces.
 *
 * The catalog's entire state is in the URL, so every assertion here is really
 * about the same claim: what you see is what the address says, and the address
 * survives a refresh and the back button.
 */
test.describe('catálogo', () => {
  test('busca ao vivo escreve na URL sem poluir o histórico', async ({ page, visit }) => {
    await visit('/mercado')
    const before = await page.evaluate(() => history.length)

    await page.locator('#market-search').fill('solar')
    await expect(page).toHaveURL(/q=solar/)

    // Typing replaces the entry; only an explicit submit pushes one.
    expect(await page.evaluate(() => history.length)).toBe(before)
    await expect(page.locator('#resultados article').first()).toBeVisible()
  })

  test('filtros combinam e reiniciam a paginação', async ({ page, visit }) => {
    await visit('/mercado?page=3')
    await expect(page).toHaveURL(/page=3/)

    // Scoped to the popover: the options row has a checkbox of its own
    // ("Somente disponíveis") that comes first in DOM order.
    const popover = page.locator('[data-slot=popover-content]')

    await page.getByRole('button', { name: /^Coleções/ }).click()
    await popover.getByRole('checkbox').first().click()
    await expect(page).toHaveURL(/collection=/)
    await expect(page).not.toHaveURL(/page=3/)

    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: /^Rede/ }).click()
    await popover.getByRole('checkbox').first().click()
    await expect(page).toHaveURL(/collection=.*network=|network=.*collection=/)
    await page.keyboard.press('Escape')

    // Both filters are visible as removable chips.
    await expect(page.locator('button:has(svg.lucide-x)')).toHaveCount(2)
  })

  test('ordenação sobrevive a refresh', async ({ page, visit }) => {
    await visit('/')
    await page.locator('#catalog-sort').selectOption('price-asc')
    await expect(page).toHaveURL(/sort=price-asc/)

    // `keepPreviousData` keeps the old page on screen while the new one loads,
    // so the URL changing is not yet evidence the list re-sorted. Assert the
    // ordering itself and let it settle.
    await expect.poll(() => ascendingPrices(page)).toBe(true)
    const firstTitle = await firstCard(page).locator('h3').innerText()

    await page.reload()
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect.poll(() => ascendingPrices(page)).toBe(true)
    await expect(firstCard(page).locator('h3')).toHaveText(firstTitle)
  })

  test('voltar restaura o estado anterior do catálogo', async ({ page, visit }) => {
    await visit('/mercado')
    await page.getByRole('tab', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/tab=trending/)

    await page.locator('#market-page-size').selectOption('24')
    await expect(page).toHaveURL(/pageSize=24/)

    await page.goBack()
    await expect(page).toHaveURL(/tab=trending/)
    await expect(page).not.toHaveURL(/pageSize=24/)
    await expect(page.locator('#market-page-size')).toHaveValue('12')
  })

  test('resultado vazio é tratado', async ({ page, visit }) => {
    await visit('/mercado', { scenario: 'empty-catalog' })
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  })
})
