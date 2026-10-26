# Validação contra o enunciado — junglegaming/frontend-challenge

**Data**: 2026-10-26
**Escopo**: repositório completo em `main`
**Decisão**: REQUEST CHANGES — dois itens eliminatórios/zerados em aberto

## Resumo

A aplicação está funcionalmente completa: as nove telas do enunciado existem,
a stack obrigatória é usada de verdade, e os requisitos difíceis (idempotência,
out-of-order, reconciliação REST/Socket.IO, isolamento por usuário) estão
implementados e documentados.

O que falta está concentrado fora do código de produto: **não há testes E2E**
(item eliminatório, 10 pts), **não há auditoria Lighthouse** (5 pts, e o script
anunciado não existe) e o **README está incompleto** (parte dos 5 pts de
documentação, e é requisito explícito da seção 12).

## Findings

### CRITICAL

**C1 — Ausência de testes E2E (`npm run test:e2e` → "No tests found")**
Seção 9 pede 12 fluxos cobertos, regressão visual de início/detalhe/carrinho/
pagamento com baselines versionadas, execução em Chromium desktop e mobile,
relatório HTML e traces. Não existe `playwright.config.*` nem um único spec.
Seção 11: *"São eliminatórios: ... ausência de testes E2E executáveis."*
Impacto: 10 pts + risco de eliminação.

### HIGH

**H1 — `npm run lighthouse` quebra (`scripts/lighthouse.mjs` não existe)**
`package.json:12` aponta para um arquivo ausente; o comando encerra com
`ERR_MODULE_NOT_FOUND`. Seção 10 pede 3 medições por página e perfil, mediana
por categoria, relatórios HTML/JSON versionados, versões de ferramentas e
registro de LCP/CLS/TBT. Nada disso existe. Impacto: 5 pts.

**H2 — README incompleto e marcado "🚧 Em construção"**
Seção 12 exige: setup, variáveis de ambiente, credenciais fictícias, seleção e
reset de cenários, comandos e instruções para reproduzir os fluxos de falha.
Faltam credenciais, cenários (`?scenario=`, `VITE_MOCK_SCENARIO`,
`POST /api/__mock/reset`) e reprodução de falhas. O aviso de "em construção"
sinaliza entrega inacabada logo no topo.

**H3 — Deploy obrigatório não evidenciado**
Seção 12: deploy é obrigatório e a URL pública deve ser entregue. `vercel.json`
está configurado corretamente (rewrites de SPA, headers do service worker), mas
nenhuma URL aparece no README ou no ARCHITECTURE.

### MEDIUM

**M1 — Dois comandos anunciados no README não funcionam**
`npm run test:e2e` e `npm run lighthouse` constam na tabela de scripts. Um
avaliador que rodar a tabela encontra dois erros.

### LOW

**L1 — Tela "Mercado" vai além do enunciado**
O enunciado lista o catálogo dentro de "Início". `/mercado` é um acréscimo
(coerente com o nav do Figma) e não conflita com nada, mas amplia a superfície
que os testes E2E terão de cobrir.

## Conforme ao enunciado (verificado)

| Seção | Item | Evidência |
| --- | --- | --- |
| 2 | Stack obrigatória em uso efetivo | TanStack Router/Query, Axios, Socket.IO, Tailwind v4, shadcn (`components.json`), MSW |
| 3 | 9 telas | 11 rotas em `src/routes/` |
| 3 | Estado do catálogo na URL | `search-params.ts`, sobrevive a refresh e histórico |
| 3 | Respostas fora de ordem | params na `queryKey` + `AbortSignal` + cenário `jitter` |
| 4 | Atualização otimista com rollback | `features/favorites/queries.ts` |
| 5 | Idempotência de pedido | `Idempotency-Key`, ARCHITECTURE §5 |
| 6 | 13 cenários determinísticos | cobrem os 9 exigidos; reset via `POST /api/__mock/reset` |
| 6 | Socket.IO real | `@mswjs/socket.io-binding` + `socket.io-client` |
| 7 | `nft.updated` / `order.updated` | `use-realtime.ts`, com version ledger |
| 7 | Cotação desatualizada bloqueia checkout | ARCHITECTURE §6 |
| 8 | 390 / 768 / 1440 sem overflow | medido nas 5 rotas principais |
| 8 | Shimmer + `prefers-reduced-motion` | `index.css:172`, `skeleton-primitives.tsx` |
| 10 | Precisão decimal em ETH | `shared/money` com decimal.js |

## Validação

| Check | Resultado |
| --- | --- |
| Type check | Pass |
| Lint | Pass |
| Build | Pass |
| Testes E2E | **Fail — nenhum teste** |
| Lighthouse | **Fail — script ausente** |

## Prioridade sugerida

1. **C1** — infra Playwright + os 12 fluxos + baselines visuais (destrava a eliminação)
2. **H1** — `scripts/lighthouse.mjs` + relatórios versionados
3. **H2/H3** — README completo com credenciais, cenários, falhas e URL pública
