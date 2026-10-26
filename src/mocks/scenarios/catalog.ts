/**
 * Reproducible mock scenarios.
 *
 * One registry drives development, the demo deploy and Playwright, so a bug
 * reproduced by hand is reproduced identically by a test. Selected with the
 * `?scenario=` search param (persisted) or `VITE_MOCK_SCENARIO`.
 */
export interface ScenarioNetwork {
  /** Inclusive latency window in ms; the delay is drawn per request. */
  latencyMs: [number, number]
  /** Probability [0,1] that a request fails with a transient 5xx. */
  failureRate: number
  /** Requests never resolve — exercises the client timeout path. */
  timeout: boolean
  /** All requests fail as if the connection were down. */
  offline: boolean
  /**
   * Catalog pages resolve in reverse order of request, so a slow page 1 lands
   * after a fast page 2. Proves stale responses are discarded, not rendered.
   */
  outOfOrder: boolean
}

export interface ScenarioBehavior {
  /** Catalog returns zero results regardless of filters. */
  emptyCatalog: boolean
  /** Session is issued already expired, or expires after this many ms. */
  sessionTtlMs: number | null
  /** Outcome the simulated settlement reaches for a created order. */
  paymentOutcome: 'confirmed' | 'declined'
  /** Order creation times out *after* persisting — idempotent retry recovers it. */
  orderCreationTimeout: boolean
  /** Price of every cart line changes when a quote is requested at checkout. */
  priceChangeOnQuote: boolean
  /** First cart line becomes unavailable when a quote is requested. */
  soldOutOnQuote: boolean
}

export interface Scenario {
  id: string
  label: string
  description: string
  network: ScenarioNetwork
  behavior: ScenarioBehavior
}

const BASE_NETWORK: ScenarioNetwork = {
  latencyMs: [80, 220],
  failureRate: 0,
  timeout: false,
  offline: false,
  outOfOrder: false,
}

const BASE_BEHAVIOR: ScenarioBehavior = {
  emptyCatalog: false,
  sessionTtlMs: null,
  paymentOutcome: 'confirmed',
  orderCreationTimeout: false,
  priceChangeOnQuote: false,
  soldOutOnQuote: false,
}

function scenario(
  id: string,
  label: string,
  description: string,
  network: Partial<ScenarioNetwork> = {},
  behavior: Partial<ScenarioBehavior> = {},
): Scenario {
  return {
    id,
    label,
    description,
    network: { ...BASE_NETWORK, ...network },
    behavior: { ...BASE_BEHAVIOR, ...behavior },
  }
}

export const SCENARIOS: readonly Scenario[] = [
  scenario(
    'default',
    'Padrão',
    'Latência baixa, sem falhas. Cenário usado pelas auditorias Lighthouse e pelas baselines visuais.',
  ),
  scenario(
    'slow',
    'Rede lenta',
    'Latência de 1,5s a 3s em todas as rotas. Exercita skeletons e feedback de carregamento.',
    { latencyMs: [1500, 3000] },
  ),
  scenario(
    'jitter',
    'Latência variável',
    'Latência entre 100ms e 2,5s, com respostas de catálogo fora de ordem.',
    { latencyMs: [100, 2500], outOfOrder: true },
  ),
  scenario(
    'flaky',
    'Instável',
    'Cerca de 35% das requisições falham com 503 transitório. Exercita retry e recuperação.',
    { latencyMs: [200, 600], failureRate: 0.35 },
  ),
  scenario(
    'offline',
    'Sem conexão',
    'Todas as requisições falham como indisponibilidade de rede.',
    { offline: true },
  ),
  scenario(
    'timeout',
    'Timeout',
    'Requisições nunca resolvem. Exercita o timeout do cliente Axios.',
    { timeout: true },
  ),
  scenario(
    'empty-catalog',
    'Catálogo vazio',
    'A listagem retorna zero resultados, com meta de paginação coerente.',
    {},
    { emptyCatalog: true },
  ),
  scenario(
    'session-expiring',
    'Sessão expirando',
    'A sessão expira 20s após o login, inclusive no meio do checkout.',
    {},
    { sessionTtlMs: 20_000 },
  ),
  scenario(
    'payment-declined',
    'Pagamento recusado',
    'O pedido é criado como pendente e a liquidação simulada o recusa.',
    {},
    { paymentOutcome: 'declined' },
  ),
  scenario(
    'order-timeout',
    'Timeout após criar o pedido',
    'O pedido é persistido mas a resposta nunca chega. Repetir com a mesma chave de idempotência recupera o mesmo pedido.',
    {},
    { orderCreationTimeout: true },
  ),
  scenario(
    'price-change',
    'Preço alterado na cotação',
    'Os preços do carrinho mudam ao cotar. O checkout bloqueia a confirmação até nova revisão.',
    {},
    { priceChangeOnQuote: true },
  ),
  scenario(
    'sold-out',
    'Edição esgotada',
    'O primeiro item do carrinho fica indisponível ao cotar.',
    {},
    { soldOutOnQuote: true },
  ),
]

export const DEFAULT_SCENARIO_ID = 'default'

export function findScenario(id: string | null | undefined): Scenario {
  const match = SCENARIOS.find((item) => item.id === id)
  return match ?? SCENARIOS[0]!
}
