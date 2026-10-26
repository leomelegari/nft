import { defineConfig, devices } from '@playwright/test'

/**
 * E2E and visual-regression configuration.
 *
 * Tests run against the production build rather than the dev server: it is the
 * artefact that ships, it is what the Lighthouse audit measures, and it has no
 * HMR client or error overlay to disturb a visual baseline.
 *
 * Isolation comes for free from Playwright's per-test browser context. The
 * simulated database, the session token, the guest id and the scenario
 * selection all live in `localStorage`, so a fresh context is a fresh backend;
 * `resetMocks()` additionally reseeds it deterministically.
 */
const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.artifacts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      // Font antialiasing differs by a hair between runs; anything larger than
      // this is a real visual change.
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  reporter: [['html', { outputFolder: 'e2e/report', open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      // The visual baselines are desktop-sized by definition; the mobile
      // project re-runs the behavioural flows at 393x851 instead.
      testIgnore: /visual\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
})
