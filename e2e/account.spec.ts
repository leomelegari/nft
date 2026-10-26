import { USERS, expect, test } from './support/fixtures'

/** Flow 8 — profile, avatar, password and wallets, with validation errors. */
test.describe('conta do colecionador', () => {
  test('edição do perfil persiste após refresh', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/perfil')

    await page.locator('input[name=location]').fill('Belo Horizonte, BR')
    await page.getByRole('button', { name: 'Salvar' }).first().click()
    await expect(page.getByText('Perfil atualizado')).toBeVisible()

    await page.reload()
    await expect(page.locator('input[name=location]')).toHaveValue('Belo Horizonte, BR')
  })

  test('e-mail inválido é barrado antes do envio', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/perfil')

    await page.locator('main input[name=email]').fill('nao-e-um-email')
    await page.getByRole('button', { name: 'Salvar' }).first().click()
    await expect(page.getByText(/e-mail válido/i).first()).toBeVisible()
  })

  test('e-mail de outra conta é recusado pela API', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/perfil')

    await page.locator('main input[name=email]').fill(USERS.curator.email)
    await page.getByRole('button', { name: 'Salvar' }).first().click()
    await expect(page.getByText(/já cadastrado|já pertence/i).first()).toBeVisible()
  })

  test('senha atual incorreta é reportada no campo', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/perfil')

    await page.locator('input[name=currentPassword]').fill('SenhaErrada1')
    await page.locator('input[name=newPassword]').fill('NovaSenha1')
    await page.locator('input[name=newPasswordConfirmation]').fill('NovaSenha1')
    await page.getByRole('button', { name: 'Salvar' }).last().click()

    await expect(page.getByText(/senha atual incorreta/i).first()).toBeVisible()
  })

  test('confirmação divergente é barrada no cliente', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/perfil')

    await page.locator('input[name=currentPassword]').fill(USERS.collector.password)
    await page.locator('input[name=newPassword]').fill('NovaSenha1')
    await page.locator('input[name=newPasswordConfirmation]').fill('OutraSenha1')
    await page.getByRole('button', { name: 'Salvar' }).last().click()

    await expect(page.getByText(/não coincidem/i).first()).toBeVisible()
  })

  test('avatar é trocado e removido', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/perfil')

    const png =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    await page.setInputFiles('input[type=file]', {
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64'),
    })

    await expect(page.getByRole('img', { name: /Avatar de/ })).toBeVisible()
    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByRole('img', { name: /Avatar de/ })).toHaveCount(0)
  })

  test('carteira rejeita endereço incompatível com a rede', async ({
    page,
    visit,
    signIn,
  }) => {
    await signIn()
    await visit('/carteiras')

    const secondary = page.locator('section').filter({ hasText: 'Carteira secundária' })
    await secondary.getByRole('button', { name: 'Adicionar' }).click()

    await secondary.locator('input[name=label]').fill('Reserva')
    await secondary.locator('select[name=network]').selectOption('solana')
    await secondary.locator('select[name=provider]').selectOption('phantom')
    await secondary
      .locator('input[name=address]')
      .fill('0x1234567890123456789012345678901234567890')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()

    await expect(page.getByText(/incompatível com a rede/i).first()).toBeVisible()
  })

  test('carteira secundária é cadastrada e persiste', async ({ page, visit, signIn }) => {
    await signIn()
    await visit('/carteiras')

    const secondary = page.locator('section').filter({ hasText: 'Carteira secundária' })
    await secondary.getByRole('button', { name: 'Adicionar' }).click()

    await secondary.locator('input[name=label]').fill('Reserva')
    await secondary.locator('select[name=network]').selectOption('solana')
    await secondary.locator('select[name=provider]').selectOption('phantom')
    await secondary
      .locator('input[name=address]')
      .fill('7xKXtg2CW3qmTbSbG6cPbVbs8rWtyEhB5vYqMkNPeTqa')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()

    await expect(secondary.getByText('Carteira salva')).toBeVisible()

    await page.reload()
    await expect(
      page
        .locator('section')
        .filter({ hasText: 'Carteira secundária' })
        .locator('input[name=label]'),
    ).toHaveValue('Reserva')
  })
})
