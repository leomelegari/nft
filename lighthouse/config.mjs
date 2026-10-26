/**
 * Versioned audit configuration.
 *
 * Both profiles run the full default Lighthouse pass — no category is skipped
 * and nothing is stubbed out, because the brief forbids simplifications that
 * exist only to lift the score. The throttling figures are Lighthouse's own
 * presets, pinned here so a result can be compared with another run.
 */

/** Pages audited, in the order the report lists them. */
export const PAGES = [
  { id: 'inicio', label: 'Início', path: '/' },
  // Resolved at run time to a real slug from the default scenario's fixtures.
  { id: 'detalhe', label: 'Detalhe do NFT', path: null },
]

/** Three runs per page and profile; the report takes the median of each. */
export const RUNS_PER_TARGET = 3

export const TARGETS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
}

/** Mobile: Lighthouse's default Moto G Power emulation and 4G throttling. */
export const MOBILE = {
  formFactor: 'mobile',
  screenEmulation: {
    mobile: true,
    width: 412,
    height: 823,
    deviceScaleFactor: 1.75,
    disabled: false,
  },
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
    requestLatencyMs: 150 * 3.75,
    downloadThroughputKbps: 1638.4,
    uploadThroughputKbps: 675,
  },
}

/** Desktop: Lighthouse's default desktop preset. */
export const DESKTOP = {
  formFactor: 'desktop',
  screenEmulation: {
    mobile: false,
    width: 1350,
    height: 940,
    deviceScaleFactor: 1,
    disabled: false,
  },
  throttling: {
    rttMs: 40,
    throughputKbps: 10 * 1024,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
  },
}

export const PROFILES = [
  { id: 'mobile', label: 'Mobile', settings: MOBILE },
  { id: 'desktop', label: 'Desktop', settings: DESKTOP },
]
