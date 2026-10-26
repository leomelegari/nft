import { test as base, expect, type Page } from '@playwright/test'

/**
 * Fictional credentials from the seed. Documented in the README; there are two
 * accounts so a test can prove that switching users clears private data.
 */
export const USERS = {
  collector: { email: 'colecionador@kurio.test', password: 'Colecionador1' },
  curator: { email: 'curadora@kurio.test', password: 'Curadora2026' },
} as const

export interface MockControl {
  /**
   * Reseeds the simulated database and selects a scenario.
   *
   * Issued from inside the page because the mock layer is a service worker:
   * `page.request` would bypass it and hit nothing.
   */
  reset(options?: { scenario?: string; seed?: number }): Promise<void>
  /** Switches scenario without touching the data. */
  scenario(id: string): Promise<void>
  /** Drives a catalog change over the socket on demand. */
  emitNftUpdated(input: {
    nftId: string
    factor?: number
    available?: number
    duplicates?: number
    withStaleReplay?: boolean
  }): Promise<{ version: number; priceEth: string; subscribers: number }>
}

function controlFor(page: Page): MockControl {
  const post = (url: string, body: unknown) =>
    page.evaluate(
      async ([target, payload]) => {
        const response = await fetch(target as string, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!response.ok) throw new Error(`${target} -> ${response.status}`)
        return response.json()
      },
      [url, body] as const,
    )

  return {
    async reset(options = {}) {
      await post('/api/__mock/reset', options)
    },
    async scenario(id) {
      await post('/api/__mock/scenario', { id })
    },
    async emitNftUpdated(input) {
      return (await post('/api/__mock/emit/nft-updated', input)) as {
        version: number
        priceEth: string
        subscribers: number
      }
    },
  }
}

interface Fixtures {
  mocks: MockControl
  /** Opens a route with the mock layer ready and a known database. */
  visit: (path: string, options?: { scenario?: string }) => Promise<void>
  signIn: (user?: keyof typeof USERS) => Promise<void>
}

export const test = base.extend<Fixtures>({
  mocks: async ({ page }, use) => {
    await use(controlFor(page))
  },

  visit: async ({ page }, use) => {
    await use(async (path, options = {}) => {
      const url = options.scenario
        ? `${path}${path.includes('?') ? '&' : '?'}scenario=${options.scenario}`
        : path
      await page.goto(url)
      // Waited for in the DOM rather than by role: the auth routes render a
      // modal, and Radix marks everything behind it `aria-hidden`, which takes
      // the header out of the accessibility tree entirely.
      await page.locator('#main-content').waitFor({ state: 'attached' })
      // The shell rendering is not the same as the app being ready: the
      // session and catalog queries are still in flight, and a control clicked
      // before they settle can act on a state the user never saw (a favourite
      // toggled while the session still reads as anonymous, for instance).
      // Waiting for the mock layer to go quiet makes every test start from the
      // screen a person would actually be looking at.
      await page.waitForLoadState('networkidle')
    })
  },

  signIn: async ({ page }, use) => {
    await use(async (user = 'collector') => {
      const { email, password } = USERS[user]
      await page.goto('/entrar')
      await page.getByRole('textbox', { name: 'E-mail' }).fill(email)
      await page.locator('input[type=password]').first().fill(password)
      await page
        .getByRole('button', { name: /^entrar$/i })
        .last()
        .click()
      // The header's "Entrar" link is replaced by the account menu.
      await expect(page.getByRole('link', { name: 'Entrar' })).toHaveCount(0)
    })
  },
})

export { expect }

/** First catalog card on whichever listing screen is open. */
export function firstCard(page: Page) {
  return page
    .locator('article')
    .filter({ has: page.locator('h3 a') })
    .first()
}

/**
 * Puts the first catalog NFT in the cart and returns its title.
 *
 * Shared by the cart, checkout and real-time specs so they all start from the
 * same, deterministic basket without repeating the navigation.
 */
export async function addFirstNftToCart(page: Page): Promise<string> {
  await page.goto('/mercado')
  await page.waitForLoadState('networkidle')

  const card = firstCard(page)
  const title = await card.locator('h3').innerText()
  await card.locator('h3 a').click()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: /carrinho/i })
      .first(),
  ).toBeVisible()

  return title
}

/** Walks the checkout from the cart up to an enabled "Confirmar compra". */
export async function reachConfirmableCheckout(page: Page): Promise<void> {
  await page.goto('/carrinho')
  await page.waitForLoadState('networkidle')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()

  await expect(page).toHaveURL(/\/pagamento/)
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await page.getByRole('button', { name: 'Aprovar conexão' }).click()

  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
}

/**
 * The main navigation, wherever it lives at this viewport.
 *
 * Desktop renders it inline in the header; below `lg` it is behind the drawer
 * button. Returning the right one keeps a single keyboard test honest on both
 * projects instead of pretending mobile has no navigation.
 */
export async function openMainNav(page: Page) {
  const inline = page.getByRole('banner').getByRole('navigation', {
    name: 'Navegação principal',
  })
  if (await inline.isVisible()) return inline

  await page.getByRole('button', { name: 'Abrir menu de navegação' }).click()
  const drawer = page.getByRole('dialog').getByRole('navigation', {
    name: 'Navegação principal',
  })
  await expect(drawer).toBeVisible()
  return drawer
}
