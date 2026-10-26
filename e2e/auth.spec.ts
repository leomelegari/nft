import { USERS, expect, test } from './support/fixtures'

/** Flow 3 — registration, login, expiry, logout and user switching. */
test.describe('conta e sessão', () => {
  test('cadastro cria a conta e autentica', async ({ page, visit }) => {
    await visit('/cadastro')

    const email = `novo-${Date.now()}@kurio.test`
    await page.getByRole('textbox', { name: 'Nome' }).fill('Pessoa Teste')
    await page.getByRole('textbox', { name: 'E-mail' }).fill(email)
    await page.locator('input[name=password]').fill('SenhaForte1')
    await page.locator('input[name=passwordConfirmation]').fill('SenhaForte1')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /criar conta/i }).click()

    await expect(page.getByRole('link', { name: 'Entrar' })).toHaveCount(0)
  })

  test('e-mail já cadastrado é tratado como conflito', async ({ page, visit }) => {
    await visit('/cadastro')

    await page.getByRole('textbox', { name: 'Nome' }).fill('Pessoa Teste')
    await page.getByRole('textbox', { name: 'E-mail' }).fill(USERS.collector.email)
    await page.locator('input[name=password]').fill('SenhaForte1')
    await page.locator('input[name=passwordConfirmation]').fill('SenhaForte1')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /criar conta/i }).click()

    // Also attached to the field, like the invalid-credential message.
    await expect(page.getByText(/já está cadastrado/i).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Entrar' })).toHaveCount(1)
  })

  test('credencial inválida não autentica', async ({ page, visit }) => {
    await visit('/entrar')
    await page.getByRole('textbox', { name: 'E-mail' }).fill(USERS.collector.email)
    await page.locator('input[type=password]').first().fill('SenhaErrada1')
    await page
      .getByRole('button', { name: /^entrar$/i })
      .last()
      .click()

    // The API attaches this one to the fields, so it renders under the input
    // rather than as a form-level alert.
    await expect(page.getByText(/e-mail ou senha incorretos/i).first()).toBeVisible()
    await expect(page).toHaveURL(/\/entrar/)
  })

  test('rota privada redireciona e retorna ao destino após o login', async ({ page }) => {
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/entrar/)
    await expect(page).toHaveURL(/redirect/)

    await page.getByRole('textbox', { name: 'E-mail' }).fill(USERS.collector.email)
    await page.locator('input[type=password]').first().fill(USERS.collector.password)
    await page
      .getByRole('button', { name: /^entrar$/i })
      .last()
      .click()

    await expect(page).toHaveURL(/\/perfil/)
  })

  test('logout limpa os dados privados em cache', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/perfil')
    await expect(
      page.getByRole('heading', { name: 'Perfil do colecionador' }),
    ).toBeVisible()

    await page
      .getByRole('navigation', { name: 'Minha conta' })
      .getByRole('button', { name: /Sair/ })
      .click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible()

    // The private cache must be gone, not merely hidden.
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/entrar/)
  })

  test('troca de usuário não vaza dados da sessão anterior', async ({
    page,
    visit,
    signIn,
  }) => {
    await signIn('collector')
    await visit('/perfil')
    // Scoped to the profile form: the footer newsletter input is also
    // `name=email`.
    const profileEmail = page.locator('main input[name=email]')
    await expect(profileEmail).toHaveValue(USERS.collector.email)

    await page
      .getByRole('navigation', { name: 'Minha conta' })
      .getByRole('button', { name: /Sair/ })
      .click()
    await expect(page).toHaveURL('/')

    await signIn('curator')
    await visit('/perfil')
    await expect(page.locator('main input[name=email]')).toHaveValue(USERS.curator.email)
  })

  test('sessão expirada durante a navegação devolve ao login', async ({
    page,
    visit,
    signIn,
  }) => {
    // The scenario issues a session that dies 20s after login.
    await page.goto('/?scenario=session-expiring')
    await page.waitForLoadState('networkidle')
    await signIn()

    await visit('/perfil')
    await expect(
      page.getByRole('heading', { name: 'Perfil do colecionador' }),
    ).toBeVisible()

    await expect(async () => {
      await page.reload()
      await expect(page).toHaveURL(/\/entrar/)
    }).toPass({ timeout: 45_000, intervals: [3_000] })
  })
})
