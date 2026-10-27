# Kurio — Marketplace de NFTs

Implementação do desafio frontend: um marketplace de NFTs em React + TypeScript,
com backend inteiramente simulado — REST via MSW e tempo real via Socket.IO.

**Aplicação publicada**: <https://nft-liart-theta.vercel.app>

Não há backend real nem serviço privado: a entrega roda a partir de um checkout
limpo, com `npm install` e `npm run dev`.

## Stack

| Responsabilidade              | Tecnologia                                                  |
| ----------------------------- | ----------------------------------------------------------- |
| Interface                     | React 19                                                    |
| Linguagem                     | TypeScript (strict)                                         |
| Build                         | Vite                                                        |
| Roteamento                    | TanStack Router                                             |
| Estado remoto                 | TanStack Query                                              |
| Cliente HTTP                  | Axios                                                       |
| Tempo real                    | Socket.IO (`socket.io-client` + `@mswjs/socket.io-binding`) |
| Estilização                   | Tailwind CSS v4                                             |
| Componentes                   | shadcn/ui                                                   |
| Mocking                       | MSW                                                         |
| Testes E2E e regressão visual | Playwright                                                  |
| Auditoria                     | Lighthouse                                                  |

## Começando

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173` com a camada de mocks ativa.

O `.env` é **opcional**: os valores de `.env.example` são os mesmos padrões
embutidos no código. Copie-o apenas para alterar algum deles:

```bash
cp .env.example .env
```

O Playwright precisa dos navegadores na primeira execução:

```bash
npx playwright install chromium
```

### Verificado em um checkout limpo

`git clone` em diretório vazio seguido de `npm install` e `npm run build`
concluem sem erro e **sem `.env`**; o `preview` resultante carrega o catálogo,
conecta o Socket.IO e autentica com as credenciais abaixo. O `.npmrc` fixa
`legacy-peer-deps=true` porque `@mswjs/socket.io-binding@0.2.0` declara peer
`msw ^2`, enquanto o projeto usa MSW v3 — ver ARCHITECTURE, "Limitações do
transporte".

## Variáveis de ambiente

Todas opcionais — os valores de `.env.example` já são os padrões.

| Variável             | Padrão       | Para que serve                                              |
| -------------------- | ------------ | ----------------------------------------------------------- |
| `VITE_ENABLE_MOCKS`  | `true`       | Liga a camada MSW. Em `false` a aplicação fica sem backend. |
| `VITE_MOCK_SCENARIO` | `default`    | Cenário aplicado num boot frio.                             |
| `VITE_API_BASE_URL`  | `/api`       | Prefixo das chamadas REST do Axios.                         |
| `VITE_SOCKET_URL`    | `/socket.io` | Endpoint do Socket.IO simulado.                             |

## Credenciais fictícias

Nenhuma senha é armazenada em claro; o banco simulado guarda apenas um digest.

| E-mail                    | Senha           | Observação                                                                                           |
| ------------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `colecionador@kurio.test` | `Colecionador1` | Carteira principal MetaMask na Ethereum e um NFT na lista de interesse.                              |
| `curadora@kurio.test`     | `Curadora2026`  | Carteira principal na Polygon, lista de interesse vazia. Usada para verificar o isolamento de dados. |

Cadastro livre também funciona; o e-mail já existente retorna conflito.

## Cupons

| Código         | Comportamento               |
| -------------- | --------------------------- |
| `GREENMINT10`  | Válido, 10% de desconto.    |
| `DROP20`       | Válido, 20% de desconto.    |
| `EXPIRADO15`   | Expirado — exercita o erro. |
| qualquer outro | Inválido.                   |

## Cenários de mock

O cenário controla latência, falhas e desfechos de negócio. Três formas de
selecioná-lo, nesta ordem de precedência:

```bash
# 1. search param (persistido em localStorage, sobrevive à navegação)
http://localhost:5173/mercado?scenario=slow

# 2. variável de ambiente, para um boot frio
VITE_MOCK_SCENARIO=flaky npm run dev

# 3. em tempo de execução, pelo console do navegador
await fetch('/api/__mock/scenario', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 'offline' }),
})
```

| Cenário            | O que exercita                                                                |
| ------------------ | ----------------------------------------------------------------------------- |
| `default`          | Latência baixa, sem falhas. Usado pelas auditorias e pelas baselines visuais. |
| `slow`             | 1,5–3s em todas as rotas — skeletons e feedback de carregamento.              |
| `jitter`           | 100ms–2,5s, com respostas de catálogo **fora de ordem**.                      |
| `flaky`            | ~35% das requisições falham com 503 transitório.                              |
| `offline`          | Todas as requisições falham como indisponibilidade de rede.                   |
| `timeout`          | Requisições nunca resolvem — timeout do cliente Axios.                        |
| `empty-catalog`    | Listagem retorna zero resultados, com paginação coerente.                     |
| `session-expiring` | Sessão expira 20s após o login, inclusive no meio do checkout.                |
| `payment-declined` | Pedido criado como pendente e recusado na liquidação.                         |
| `order-timeout`    | Pedido persiste, resposta nunca chega — recuperação por idempotência.         |
| `price-change`     | Preços do carrinho mudam ao cotar; o checkout bloqueia a confirmação.         |
| `sold-out`         | Primeiro item do carrinho fica indisponível ao cotar.                         |

### Reset

Restaura integralmente o banco simulado, opcionalmente trocando o cenário:

```js
await fetch('/api/__mock/reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenario: 'default' }),
})
```

Para limpar também sessão, carrinho de visitante e cenário persistido, basta
limpar o `localStorage` do site (chaves com prefixo `kurio.`).

## Reproduzindo os fluxos de falha

| Fluxo                                | Passos                                                                                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Catálogo vazio**                   | `/mercado?scenario=empty-catalog`.                                                                                                                   |
| **Respostas fora de ordem**          | `/mercado?scenario=jitter`, pagine rápido entre 1 e 2 — a página exibida é sempre a pedida por último.                                               |
| **Falha de conexão e recuperação**   | `/mercado?scenario=offline`, veja o erro, troque para `default` pelo console e clique em "Tentar novamente".                                         |
| **Skeletons**                        | `/mercado?scenario=slow` ou `/?scenario=slow`.                                                                                                       |
| **Sessão expirada**                  | `/?scenario=session-expiring`, faça login, aguarde 20s e navegue para `/perfil`.                                                                     |
| **Cupom inválido / expirado**        | No carrinho, aplique `NAOEXISTE` ou `EXPIRADO15`.                                                                                                    |
| **Preço alterado durante a compra**  | `/?scenario=price-change`, vá ao pagamento e confirme — a cotação desatualizada bloqueia a confirmação até nova revisão.                             |
| **Edição esgotada**                  | `/?scenario=sold-out`, mesmo caminho.                                                                                                                |
| **Pagamento recusado**               | `/?scenario=payment-declined`. Os itens voltam ao carrinho.                                                                                          |
| **Timeout após criar o pedido**      | `/?scenario=order-timeout`. Confirme, veja o erro e confirme de novo: a mesma chave de idempotência recupera o mesmo pedido, sem comprar duas vezes. |
| **Conflito de cadastro**             | Cadastre-se com `colecionador@kurio.test`.                                                                                                           |
| **Evento de tempo real sob demanda** | `POST /api/__mock/emit/nft-updated` com `{ nftId, factor, duplicates, withStaleReplay }`.                                                            |

## Scripts

| Comando                   | Descrição                                       |
| ------------------------- | ----------------------------------------------- |
| `npm run dev`             | Desenvolvimento com mocks                       |
| `npm run build`           | Checagem de tipos + build de produção           |
| `npm run preview`         | Serve o build de produção em `:4173`            |
| `npm run typecheck`       | Checagem de tipos                               |
| `npm run lint`            | Lint (oxlint)                                   |
| `npm run format`          | Formatação (Prettier)                           |
| `npm run test:e2e`        | Testes Playwright (desktop + mobile)            |
| `npm run test:e2e:ui`     | Playwright em modo interativo                   |
| `npm run test:e2e:report` | Abre o último relatório HTML                    |
| `npm run lighthouse`      | Auditoria Lighthouse (requer `preview` rodando) |

## Testes

```bash
npm run test:e2e
```

O Playwright sobe o build de produção sozinho (`build && preview`), roda em
Chromium nos viewports desktop (1440×900) e mobile (Pixel 5), e cobre os doze
fluxos do enunciado mais regressão visual de início, mercado, detalhe, carrinho,
pagamento, perfil e carteiras. Cada teste parte de um contexto novo — banco
simulado, sessão e cenário vivem em `localStorage` —, portanto é isolado por
construção.

Relatório HTML em `e2e/report/`; traces, vídeos e screenshots das falhas em
`e2e/.artifacts/`. Para atualizar as baselines visuais depois de uma mudança
intencional de layout:

```bash
npx playwright test visual --update-snapshots
```

## Auditoria Lighthouse

A auditoria versionada é a do **build publicado**, que é o artefato avaliado:

```bash
LIGHTHOUSE_URL=https://nft-liart-theta.vercel.app npm run lighthouse
```

Para auditar localmente, suba o build e rode sem a variável:

```bash
npm run build
npm run preview &
npm run lighthouse
```

Audita início e detalhe do NFT nos perfis mobile e desktop, três execuções cada,
e publica a mediana por categoria.

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |
| ------- | ------- | ----------: | -------------: | ------------: | --: |
| Início  | Mobile  |          93 |            100 |           100 |  92 |
| Início  | Desktop |         100 |            100 |           100 |  92 |
| Detalhe | Mobile  |          95 |            100 |           100 |  92 |
| Detalhe | Desktop |         100 |            100 |           100 |  92 |

Metas: performance ≥ 90, acessibilidade ≥ 95, boas práticas ≥ 95, SEO ≥ 90.

A mesma auditoria contra `npm run preview` dá 85 no mobile — é o mesmo bundle,
servido sem compressão e por HTTP/1.1. A diferença está analisada em
[`lighthouse/RESULTS.md`](./lighthouse/RESULTS.md), junto com ambiente, versões
das ferramentas e LCP/CLS/TBT; configuração versionada em
`lighthouse/config.mjs`; relatórios HTML e JSON de cada execução em
`lighthouse/reports/`.

## Documentação

Tudo em [`ARCHITECTURE.md`](./ARCHITECTURE.md). Mapa dos assuntos:

| Assunto                                               | Onde |
| ----------------------------------------------------- | ---- |
| Contratos REST e taxonomia de erros                   | §4   |
| Idempotência de pedidos                               | §5   |
| Portão de cotação desatualizada                       | §6   |
| Estratégia de cache, retries e isolamento por usuário | §7   |
| Camada de mocks, cenários e reset                     | §8   |
| Desvios do Figma e decisões de UX                     | §9   |
| Política de sessão                                    | §9.1 |
| Estado do carrinho                                    | §9.2 |
| Checkout e idempotência                               | §9.3 |
| Eventos de tempo real                                 | §9.4 |
| Reconciliação entre REST e Socket.IO                  | §9.4 |
| Limitações do transporte nos mocks                    | §9.4 |
| Limitações conhecidas                                 | §10  |

Auditoria de performance, com ambiente, versões e análise dos números, em
[`lighthouse/RESULTS.md`](./lighthouse/RESULTS.md).
