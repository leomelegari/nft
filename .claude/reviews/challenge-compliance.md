# Conformidade com o enunciado — junglegaming/frontend-challenge

**Revisado**: 2026-10-27
**Enunciado**: confirmado idêntico ao de 2026-10-26 (262 linhas, `main`)
**Escopo**: repositório completo
**Decisão**: APROVADO — deploy publicado e validado em
<https://nft-liart-theta.vercel.app>

## Validação

| Check | Resultado |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run format:check` | Pass |
| `npm run build` | Pass |
| `npm run test:e2e` | **149/149** (Chromium desktop 1440×900 + mobile Pixel 5) |
| `npm run lighthouse` | Executa; medianas em `lighthouse/RESULTS.md` |

## Seção a seção

### 2. Stack obrigatória — OK

Todas em uso efetivo, não decorativo:

| Tecnologia | Evidência |
| --- | --- |
| TanStack Router | 36 arquivos; rotas, search params e `beforeLoad` nos fluxos privados |
| TanStack Query | 18 arquivos; queries, mutations, invalidação |
| Axios | instância única em `shared/api/client.ts`; todo REST passa por ela |
| Socket.IO | `socket.io-client` + `@mswjs/socket.io-binding` |
| Tailwind v4 | tokens em `index.css` |
| shadcn/ui | `components.json` (new-york); 6 componentes da CLI adaptados |
| MSW | 12 arquivos de handlers/cenários |
| Playwright | 15 specs |
| Lighthouse | `scripts/lighthouse.mjs` + config versionada |

### 3. Telas e fluxos — OK

As nove telas obrigatórias existem, mais `/mercado` e `/lista-de-interesse`
(acréscimos documentados). Catálogo, detalhe, carrinho, pagamento e conta
cobertos por E2E.

Fora do escopo por determinação do enunciado ("Páginas editoriais, suporte,
atividade, ofertas e downloads não fazem parte da entrega"): renderizados
inertes com `aria-disabled`, nunca como links mortos.

### 4. Integração e estado — OK

Contratos tipados no transporte, quatro estados em toda tela dependente de
dados, invalidação após mutations e eventos, descarte de respostas obsoletas
por `queryKey` + `AbortSignal`, isolamento por `['owner', ownerKey]`.
Atualização otimista com rollback em favoritos (testada, inclusive a falha).

### 5. Contratos REST — OK

Todos os recursos mínimos implementados e documentados em ARCHITECTURE §4.
**Idempotência testada em toda a sua definição** (`e2e/idempotency.spec.ts`):
mesma chave + mesmo conteúdo devolve `200` com o mesmo id; mesma chave +
conteúdo diferente devolve `409 IDEMPOTENCY_CONFLICT`; três requisições, um
pedido.

### 6. Mocking com MSW — OK

13 cenários determinísticos cobrindo as nove categorias exigidas; reset por
`POST /api/__mock/reset`; persistência em `localStorage` para sobreviver a
refresh; mocks no build de demonstração (`mockServiceWorker.js` no `dist`).
Nenhum dado fictício fora da camada de rede.

### 7. Tempo real — OK, com uma limitação documentada

`nft.updated` e `order.updated` com identidade, versão e escopo de sessão;
duplicatas e eventos antigos ignorados pelo version ledger; reconciliação com
REST na reconexão; listeners liberados no cleanup.

**Limitação**: uma desconexão real de transporte não é reproduzível — o socket
é interceptado no próprio processo pelo service worker e nunca toca a rede
(verificado: `setOffline` não o derruba). Está documentado em ARCHITECTURE
§9.4, como o enunciado pede. O desfecho observável — recuperação do pedido
pendente após reload, sem duplicar — é testado.

### 8. Interface, responsividade e acessibilidade — OK

Sem overflow horizontal de **320 a 1440px**, medido em todas as rotas
principais. Skeletons com shimmer em catálogo, detalhe e carrinho, respeitando
`prefers-reduced-motion`. Navegação por teclado, foco em diálogos, erros
associados aos campos, estados não dependentes só de cor.

*Corrigido nesta revisão*: 36px de overflow a 320px na faixa de ações do
header — equivalente a 400% de zoom num monitor de 1280px, o limite de reflow
da WCAG.

### 9. Testes com Playwright — OK

Os doze fluxos cobertos, mais regressão visual de sete telas com baselines
versionadas. Relatório HTML e traces/vídeos nas falhas configurados. Cada teste
parte de contexto novo — banco, sessão e cenário vivem em `localStorage`.

### 10. Performance e Lighthouse — OK

Auditado contra o build publicado, que é o artefato avaliado. **Todas as
categorias atingem a meta nos dois perfis**: performance 93/95 no mobile e 100
no desktop, acessibilidade 100, boas práticas 100, SEO 92. CLS 0 em todos os
alvos, TBT entre 0 e 60ms.

A mesma auditoria contra `npm run preview` dá 85 no mobile. É o mesmo bundle: a
diferença é o servidor — sem compressão e em HTTP/1.1 localmente, com Brotli e
HTTP/2 no deploy —, o que custa cerca de um segundo de LCP sob a emulação
mobile. Registrado em `lighthouse/ANALYSIS.md` para que a diferença não pareça
inconsistência de método.

### 11. Critérios eliminatórios — nenhum presente

| Eliminatório | Situação |
| --- | --- |
| Ausência de uso efetivo da stack | Todas em uso |
| Fluxos principais apenas visuais | Compra completa funcional ponta a ponta |
| Compra confirmada sem resposta da simulação | Confirmação só com pedido liquidado |
| Exposição de dados entre usuários | Cache por owner; teste de troca de usuário |
| Eventos simulados direto na UI | Passam por `socket.io-client` |
| Ausência de testes E2E executáveis | 149 passando |

### 12. Entrega — OK

Código, lockfile, assets, mocks, fixtures, testes e configuração de auditoria
entregues. `.npmrc` fixa `legacy-peer-deps` para `npm install` funcionar num
checkout limpo. README com setup, variáveis, credenciais, cenários, reset,
comandos e reprodução dos fluxos de falha. ARCHITECTURE com contratos, eventos,
sessão, carrinho, cache e reconciliação.

**Deploy validado** em <https://nft-liart-theta.vercel.app>, com a suíte
funcional rodada contra o site publicado:

| Verificação no ambiente publicado | Resultado |
| --- | --- |
| Acesso direto a 7 rotas | todas HTTP 200 (rewrite de SPA) |
| Headers do service worker | `no-cache` + `Service-Worker-Allowed: /` |
| Catálogo e mocks | 12 cards servidos pelo MSW |
| Socket.IO | 1 subscriber conectado |
| Refresh com estado na URL | `?q=&view=&pageSize=` preservados |
| Compra completa com cupom | modal pendente em 2,6s → confirmado em 4,4s, totais corretos |
| Refresh no recibo | pedido mantido, sem duplicar |
| Erros de console | nenhum |

## Corrigido nesta revisão

| Achado | Correção |
| --- | --- |
| Conflito de idempotência implementado sem teste (seção 5) | `e2e/idempotency.spec.ts` |
| Zoom sem cobertura (seção 8) | Teste de reflow em 640/360/320px |
| 36px de overflow a 320px na faixa de ações do header | Gutters e gaps apertados abaixo de `sm` |
