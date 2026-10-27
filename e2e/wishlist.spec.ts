import { expect, firstCard, test } from './support/fixtures'

/**
 * Lista de interesse — the screen that shows what the heart saves.
 *
 * Favourites already had to persist for an authenticated user; this covers the
 * surface that finally makes them visible, including removal from the list
 * itself and the guard on the route.
 */
test.describe('lista de interesse', () => {
  test('exige autenticação', async ({ page }) => {
    await page.goto('/lista-de-interesse')
    await expect(page).toHaveURL(/\/entrar/)
    await expect(page).toHaveURL(/redirect/)
  })

  test('conta sem favoritos vê o estado vazio e é convidada ao mercado', async ({
    page,
    visit,
    signIn,
  }) => {
    // The collector starts with one saved NFT in the seed; the curator has none.
    await signIn('curator')
    await visit('/lista-de-interesse')

    await expect(page.getByText('Sua lista de interesse está vazia')).toBeVisible()
    await page.getByRole('link', { name: 'Explorar o mercado' }).click()
    await expect(page).toHaveURL(/\/mercado/)
  })

  test('lista o favorito do seed e o recém-salvo, e sobrevive a refresh', async ({
    page,
    visit,
    signIn,
  }) => {
    await signIn()

    await visit('/lista-de-interesse')
    await expect(page.getByText('1 NFT salvo')).toBeVisible()

    await visit('/mercado')
    const title = await firstCard(page).locator('h3').innerText()
    const saved = page.waitForResponse(
      (response) =>
        response.url().includes('/api/favorites/') &&
        response.request().method() === 'PUT',
    )
    await firstCard(page)
      .getByRole('button', { name: /favoritos/ })
      .click()
    await saved

    await visit('/lista-de-interesse')
    await expect(page.getByText('2 NFTs salvos')).toBeVisible()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()

    await page.reload()
    await expect(page.getByText('2 NFTs salvos')).toBeVisible()
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
  })

  test('desfavoritar remove o item da lista na hora', async ({ page, visit, signIn }) => {
    // The curator starts empty, so one save and one removal empties it again.
    await signIn('curator')
    await visit('/mercado')

    const saved = page.waitForResponse(
      (response) =>
        response.url().includes('/api/favorites/') &&
        response.request().method() === 'PUT',
    )
    await firstCard(page)
      .getByRole('button', { name: /favoritos/ })
      .click()
    await saved

    await visit('/lista-de-interesse')
    const card = firstCard(page)
    await expect(card).toBeVisible()

    const removed = page.waitForResponse(
      (response) =>
        response.url().includes('/api/favorites/') &&
        response.request().method() === 'DELETE',
    )
    // Optimistic: the card leaves before the delete has returned.
    await card.getByRole('button', { name: /Remover dos favoritos/ }).click()
    await expect(page.getByText('Sua lista de interesse está vazia')).toBeVisible()
    await removed

    await page.reload()
    await expect(page.getByText('Sua lista de interesse está vazia')).toBeVisible()
  })

  test('o item da sidebar leva à tela e fica marcado', async ({
    page,
    visit,
    signIn,
  }) => {
    await signIn()
    await visit('/perfil')

    const sidebar = page.getByRole('navigation', { name: 'Minha conta' })
    await sidebar.getByRole('link', { name: 'Lista de interesse' }).click()

    await expect(page).toHaveURL(/\/lista-de-interesse/)
    await expect(
      sidebar.getByRole('link', { name: 'Lista de interesse' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  test('o rodapé também leva à tela', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/')

    await page
      .getByRole('navigation', { name: 'Meu perfil' })
      .getByRole('link', { name: 'Lista de interesse' })
      .click()

    await expect(page).toHaveURL(/\/lista-de-interesse/)
  })
})
