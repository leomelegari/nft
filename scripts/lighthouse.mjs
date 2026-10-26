#!/usr/bin/env node
/**
 * Lighthouse audit for the home and NFT detail screens.
 *
 * Runs against the optimised build with the default mock scenario, three times
 * per page and profile, and reports the median of each category — a single run
 * swings by several points on a laptop and would be a misleading number to
 * publish. Every individual run is kept as HTML and JSON so the medians can be
 * checked rather than taken on faith.
 *
 * Usage:
 *   npm run build && npm run preview &
 *   npm run lighthouse
 */
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import os from 'node:os'
import path from 'node:path'

import { PAGES, PROFILES, RUNS_PER_TARGET, TARGETS } from '../lighthouse/config.mjs'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPORTS = path.join(ROOT, 'lighthouse', 'reports')

const BASE_URL = process.env.LIGHTHOUSE_URL ?? 'http://localhost:4173'
const CATEGORIES = Object.keys(TARGETS)

/** Chrome for Testing, which Playwright already installs, unless overridden. */
function chromePath() {
  return process.env.CHROME_PATH ?? chromium.executablePath()
}

async function ensureServerUp() {
  const response = await fetch(BASE_URL).catch(() => null)
  if (!response?.ok) {
    throw new Error(
      `Nenhum servidor em ${BASE_URL}. Rode "npm run build && npm run preview" antes.`,
    )
  }
}

/**
 * Picks a real NFT slug from the running fixtures.
 *
 * Hard-coding one would silently audit a 404 the day the seed changes.
 */
async function resolveDetailPath() {
  const response = await fetch(`${BASE_URL}/api/nfts?page=1&pageSize=1`)
  if (response.ok) {
    const body = await response.json().catch(() => null)
    const slug = body?.data?.[0]?.slug
    if (slug) return `/nft/${slug}`
  }

  // The mock layer is a service worker, so it does not answer plain fetches
  // from Node. Fall back to a real browser, which boots the worker.
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(`${BASE_URL}/mercado`, { waitUntil: 'networkidle' })
    const href = await page.locator('article h3 a').first().getAttribute('href')
    if (!href) throw new Error('Não foi possível resolver um NFT para auditar.')
    return href
  } finally {
    await browser.close()
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

async function runOnce({ url, profile, run }) {
  const chrome = await launch({
    chromePath: chromePath(),
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  })

  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, output: ['html', 'json'], logLevel: 'error' },
      {
        extends: 'lighthouse:default',
        settings: { ...profile.settings, onlyCategories: CATEGORIES },
      },
    )

    if (!result) throw new Error('Lighthouse não retornou resultado.')

    const { lhr, report } = result
    const scores = Object.fromEntries(
      CATEGORIES.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)]),
    )
    const metrics = {
      lcp: lhr.audits['largest-contentful-paint']?.numericValue ?? 0,
      cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? 0,
      tbt: lhr.audits['total-blocking-time']?.numericValue ?? 0,
    }

    return { scores, metrics, html: report[0], json: report[1] }
  } finally {
    await chrome.kill()
  }
}

async function main() {
  await ensureServerUp()
  await mkdir(REPORTS, { recursive: true })

  const detailPath = await resolveDetailPath()
  const pages = PAGES.map((page) => (page.path ? page : { ...page, path: detailPath }))

  const summary = []

  for (const page of pages) {
    for (const profile of PROFILES) {
      const url = `${BASE_URL}${page.path}`
      const runs = []

      for (let run = 1; run <= RUNS_PER_TARGET; run += 1) {
        process.stdout.write(`→ ${page.label} · ${profile.label} · execução ${run}\n`)
        const result = await runOnce({ url, profile, run })
        runs.push(result)

        const stem = path.join(REPORTS, `${page.id}-${profile.id}-${run}`)
        await writeFile(`${stem}.html`, result.html)
        await writeFile(`${stem}.json`, result.json)
      }

      summary.push({
        page,
        profile,
        url,
        scores: Object.fromEntries(
          CATEGORIES.map((id) => [id, median(runs.map((r) => r.scores[id]))]),
        ),
        metrics: {
          lcp: median(runs.map((r) => r.metrics.lcp)),
          cls: median(runs.map((r) => r.metrics.cls)),
          tbt: median(runs.map((r) => r.metrics.tbt)),
        },
        runs: runs.map((r) => r.scores),
      })
    }
  }

  await writeSummary(summary)

  const failures = summary.flatMap(({ page, profile, scores }) =>
    CATEGORIES.filter((id) => scores[id] < TARGETS[id]).map(
      (id) =>
        `${page.label} · ${profile.label} · ${id}: ${scores[id]} (meta ${TARGETS[id]})`,
    ),
  )

  if (failures.length > 0) {
    console.log('\nAbaixo da meta:')
    for (const line of failures) console.log(`  ${line}`)
    console.log('\nAnálise em lighthouse/RESULTS.md')
  } else {
    console.log(
      '\nTodas as categorias atingiram a meta. Detalhes em lighthouse/RESULTS.md',
    )
  }
}

async function writeSummary(summary) {
  const versions = {
    lighthouse: require('lighthouse/package.json').version,
    node: process.version,
    chrome: path.basename(path.dirname(chromePath())),
    playwright: require('@playwright/test/package.json').version,
  }

  const header = [
    '# Auditoria Lighthouse',
    '',
    `**Gerado em**: ${new Date().toISOString()}`,
    `**URL base**: ${BASE_URL} (build de produção, cenário de mocks \`default\`)`,
    `**Execuções por alvo**: ${RUNS_PER_TARGET} — os números abaixo são a mediana de cada categoria`,
    '',
    '## Ambiente',
    '',
    '| Item | Valor |',
    '| --- | --- |',
    `| Lighthouse | ${versions.lighthouse} |`,
    `| Node | ${versions.node} |`,
    `| Navegador | ${versions.chrome} |`,
    `| Playwright | ${versions.playwright} |`,
    `| SO | ${os.type()} ${os.release()} (${os.arch()}) |`,
    `| CPU | ${os.cpus()[0]?.model ?? 'desconhecida'} × ${os.cpus().length} |`,
    `| Memória | ${(os.totalmem() / 1024 ** 3).toFixed(1)} GB |`,
    '',
    '## Resultados (mediana)',
    '',
    '| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  ]

  const scoreRows = summary.map(
    ({ page, profile, scores }) =>
      `| ${page.label} | ${profile.label} | ${scores.performance} | ${scores.accessibility} | ${scores['best-practices']} | ${scores.seo} |`,
  )

  const metricRows = summary.map(
    ({ page, profile, metrics }) =>
      `| ${page.label} | ${profile.label} | ${(metrics.lcp / 1000).toFixed(2)} s | ${metrics.cls.toFixed(3)} | ${Math.round(metrics.tbt)} ms |`,
  )

  const body = [
    '',
    `Metas: performance ≥ ${TARGETS.performance}, acessibilidade ≥ ${TARGETS.accessibility}, boas práticas ≥ ${TARGETS['best-practices']}, SEO ≥ ${TARGETS.seo}.`,
    '',
    '## Métricas (mediana)',
    '',
    '| Página | Perfil | LCP | CLS | TBT |',
    '| --- | --- | ---: | ---: | ---: |',
    ...metricRows,
    '',
    '## Execuções individuais',
    '',
    '| Página | Perfil | Execução | Performance | Acessibilidade | Boas práticas | SEO |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |',
    ...summary.flatMap(({ page, profile, runs }) =>
      runs.map(
        (scores, index) =>
          `| ${page.label} | ${profile.label} | ${index + 1} | ${scores.performance} | ${scores.accessibility} | ${scores['best-practices']} | ${scores.seo} |`,
      ),
    ),
    '',
    'Relatórios HTML e JSON de cada execução em `lighthouse/reports/`.',
    '',
  ]

  /**
   * The written analysis lives in its own file so it is versioned and
   * reviewed like any other document, while the numbers above stay generated.
   */
  const analysis = await readFile(
    path.join(ROOT, 'lighthouse', 'ANALYSIS.md'),
    'utf8',
  ).catch(() => '')

  await writeFile(
    path.join(ROOT, 'lighthouse', 'RESULTS.md'),
    [...header, ...scoreRows, ...body, analysis].join('\n'),
  )
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exitCode = 1
})
