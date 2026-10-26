# Arquitetura — Kurio

Decisões técnicas, contratos e limitações conhecidas da solução.

> Documento vivo: atualizado a cada etapa da entrega.

## 1. Visão geral

A aplicação é uma SPA React servida por Vite. Não existe backend real: toda a
superfície REST e o canal de tempo real são simulados por **MSW**, que roda tanto
em desenvolvimento quanto no build de demonstração e nos testes Playwright.

```
UI (features/)
  ↕  TanStack Query          estado remoto, cache, invalidação
  ↕  Axios (shared/api)      transporte + normalização de erro
  ↕  MSW (mocks/)            backend simulado + condições de rede
```

### Camadas

| Caminho            | Responsabilidade                                                                     |
| ------------------ | ------------------------------------------------------------------------------------ |
| `src/entities`     | Schemas Zod — **única** definição dos contratos. Os tipos da UI são inferidos daqui. |
| `src/shared/api`   | Instância Axios, interceptors, `ApiError`, token de sessão.                          |
| `src/shared/money` | Aritmética decimal em ETH. Único lugar com cálculo monetário.                        |
| `src/features`     | Fluxos de produto (catálogo, carrinho, checkout, conta).                             |
| `src/mocks`        | Backend simulado: banco em memória, handlers REST, cenários.                         |

### Princípio de fronteira

Componentes, hooks e o cliente Axios **não** contêm respostas fictícias nem
caminhos alternativos de negócio. Qualquer comportamento simulado vive em
`src/mocks`. Trocar o MSW por um backend real não exigiria mudanças na UI.

## 2. Tipagem dos contratos

Todo payload REST é validado por um schema Zod em `src/entities` no momento em
que atravessa o Axios (`request()` em `shared/api/client.ts`). Uma mudança de
shape no servidor falha na fronteira de transporte com uma mensagem precisa, em
vez de virar `undefined` no meio da árvore de componentes.

Os mesmos schemas de input validam os formulários, de modo que cliente e
servidor simulado não podem discordar sobre o que é válido.

## 3. Precisão monetária

Valores em ETH trafegam como **strings decimais** e nunca são convertidos para
`number`. `shared/money` encapsula toda a aritmética com `decimal.js`:

- `addEth`, `subEth`, `mulEth`, `percentOfEth`, `compareEth`
- quantidades são inteiras e validadas como tal
- `subEth` satura em zero: um desconto maior que o subtotal não gera cobrança negativa

Verificado end to end: subtotal `1.98` → desconto 10% `0.198` → taxa `0.0044` →
total `1.7864`, sem desvio de ponto flutuante.

## 4. Contratos REST

Base: `/api`. Coleções retornam envelope `{ data, meta }`; recursos
individuais retornam o objeto diretamente.

### Sessão e conta

| Método | Rota             | Descrição                                       |
| ------ | ---------------- | ----------------------------------------------- |
| `POST` | `/auth/register` | Cria conta. `409 CONFLICT` em e-mail duplicado. |
| `POST` | `/auth/login`    | Retorna `{ token, session }`.                   |
| `GET`  | `/auth/session`  | Sessão atual. `401` quando ausente ou expirada. |
| `POST` | `/auth/logout`   | `204`. Idempotente.                             |

### NFTs

| Método | Rota           | Descrição                                                                                |
| ------ | -------------- | ---------------------------------------------------------------------------------------- |
| `GET`  | `/nfts`        | `q`, `collection`, `network`, `minPrice`, `maxPrice`, `tab`, `sort`, `page`, `pageSize`. |
| `GET`  | `/nfts/facets` | Contagens por coleção/rede e faixa de preço.                                             |
| `GET`  | `/nfts/:slug`  | Detalhe. `404` quando inexistente.                                                       |

As facetas são calculadas sobre o resultado da busca textual **ignorando** as
seleções de coleção e rede, para que escolher uma coleção não zere as demais
linhas da sidebar.

### Favoritos, carrinho, cotação, pedidos, perfil, carteiras

| Método                              | Rota                   | Descrição                                                 |
| ----------------------------------- | ---------------------- | --------------------------------------------------------- |
| `GET` / `PUT` / `DELETE`            | `/favorites[/:nftId]`  | Por usuário autenticado.                                  |
| `GET`                               | `/cart`                | Carrinho do dono (usuário ou visitante via `X-Guest-Id`). |
| `POST`                              | `/cart/items`          | Respeita `available` e `maxPerOrder`.                     |
| `PATCH` / `DELETE`                  | `/cart/items/:itemId`  | Alterar quantidade / remover.                             |
| `POST`                              | `/cart/merge`          | Mescla carrinho do visitante no do usuário após login.    |
| `POST`                              | `/cart/quote`          | Emite documento de preço. Aplica/valida cupom.            |
| `POST`                              | `/orders`              | Criação **idempotente** (header `Idempotency-Key`).       |
| `GET`                               | `/orders/:orderId`     | Recibo. `403` para pedido de outro usuário.               |
| `GET` / `PATCH`                     | `/profile`             | Dados do colecionador.                                    |
| `PUT`                               | `/profile/avatar`      | Avatar como data URL.                                     |
| `POST`                              | `/profile/password`    | Alteração de senha.                                       |
| `GET` / `POST` / `PATCH` / `DELETE` | `/wallets[/:walletId]` | Carteiras principal e secundária.                         |

### Taxonomia de erros

Toda falha responde `{ error: { code, message, fields?, details? } }`.

| Código                              | HTTP | Uso                                                       |
| ----------------------------------- | ---: | --------------------------------------------------------- |
| `VALIDATION_ERROR`                  |  422 | Campos inválidos; `fields` mapeia campo → mensagem.       |
| `UNAUTHENTICATED`                   |  401 | Sem sessão.                                               |
| `SESSION_EXPIRED`                   |  401 | Token apresentado, porém expirado.                        |
| `FORBIDDEN`                         |  403 | Recurso de outro usuário.                                 |
| `NOT_FOUND`                         |  404 | Recurso inexistente.                                      |
| `CONFLICT`                          |  409 | Cadastro duplicado.                                       |
| `AVAILABILITY_CONFLICT`             |  409 | Estoque insuficiente.                                     |
| `COUPON_INVALID` / `COUPON_EXPIRED` |  422 | Cupom.                                                    |
| `QUOTE_STALE`                       |  409 | Cotação desatualizada ou com divergências.                |
| `IDEMPOTENCY_CONFLICT`              |  409 | Mesma chave com conteúdo diferente.                       |
| `PAYMENT_DECLINED`                  |  402 | Liquidação recusada.                                      |
| `TRANSIENT_ERROR`                   |  503 | Falha transitória; é a única classe com retry automático. |

O interceptor do Axios converte qualquer falha (inclusive queda de rede e
timeout) em `ApiError`, de modo que nenhum componente inspeciona
`error.response.data`.

## 5. Idempotência de pedidos

`POST /orders` exige `Idempotency-Key`. O servidor guarda `(chave, usuário,
hash do corpo, pedido)`:

- **mesma chave + mesmo corpo** → retorna o pedido original (`200`), sem nova compra;
- **mesma chave + corpo diferente** → `409 IDEMPOTENCY_CONFLICT`;
- o pedido é persistido **antes** do timeout simulado, então repetir após um
  timeout recupera o mesmo pedido.

Verificado: no cenário `order-timeout`, a primeira tentativa pendura, a segunda
recupera o pedido e o total de pedidos permanece **1**.

## 6. Portão de cotação desatualizada

`POST /cart/quote` emite um documento com `subtotal`, `desconto`, `taxa de rede`,
`total` e uma lista de `issues`. Um `issue` é gerado quando preço, quantidade
disponível ou existência do item mudou em relação ao que o usuário viu.

`POST /orders` recusa com `QUOTE_STALE` quando a cotação:

- não existe, não pertence ao usuário ou expirou;
- carrega qualquer `issue`;
- referencia uma versão de carrinho diferente da atual.

A UI, portanto, não consegue confirmar uma compra com números desatualizados —
é o requisito da seção 7 do enunciado.

## 7. Política de cache (TanStack Query)

| Parâmetro              | Valor                  | Razão                                                                                                                  |
| ---------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `staleTime`            | 30s                    | Catálogo e detalhe servem do cache enquanto revalidam; eventos de socket empurram mudanças autoritativas no intervalo. |
| `gcTime`               | 5min                   | Mantém páginas do catálogo quentes para navegação pelo histórico.                                                      |
| `retry` (queries)      | 2, backoff exponencial | Desabilitado para 4xx, que são determinísticos.                                                                        |
| `retry` (mutations)    | 0                      | Pedido é repetido explicitamente pelo checkout com a chave de idempotência; retry cego competiria com isso.            |
| `refetchOnWindowFocus` | `false`                | Evita refetch em massa ao alternar abas durante o checkout.                                                            |

Isolamento por usuário e por parâmetros de consulta é feito via chaves de query
namespacadas pelo id do usuário, de modo que logout e troca de conta limpam
dados privados sem varredura manual.

## 8. Camada de mocks

### Banco simulado

Banco em memória espelhado em `localStorage` (`kurio.mock-db`), versionado
por schema. `resetDb()` restaura integralmente um cenário conhecido — é o que
cada teste Playwright chama para partir de estado isolado.

Fixtures são geradas por um PRNG **determinístico** (`mulberry32`, seed
`20260426`): o catálogo é byte a byte idêntico em toda execução, o que as
baselines de regressão visual e as auditorias Lighthouse exigem.

- **239 NFTs**, distribuídos exatamente conforme as contagens da sidebar do Figma
- preços entre `0.02` e `12.30` ETH, como no filtro de faixa de preço
- 1 a 3 edições por NFT, com `available` e `maxPerOrder` próprios
- ~8% das edições nascem esgotadas, para alimentar o caminho "edição esgotada"
- 2 usuários fictícios com carteiras cadastradas

### Credenciais fictícias

| E-mail                    | Senha           |
| ------------------------- | --------------- |
| `colecionador@kurio.test` | `Colecionador1` |
| `curadora@kurio.test`     | `Curadora2026`  |

Senhas nunca são armazenadas em claro: o fixture guarda apenas um digest
simulado (`digestPassword`), que não é um KDF real e não pretende sê-lo.

### Cupons

| Código         | Efeito                      |
| -------------- | --------------------------- |
| `GREENMINT10`  | 10% de desconto             |
| `DROP20`       | 20% de desconto             |
| `EXPIRADO15`   | Expirado → `COUPON_EXPIRED` |
| qualquer outro | `COUPON_INVALID`            |

### Cenários

Selecionados por `?scenario=<id>` (persistido) ou `VITE_MOCK_SCENARIO`. O mesmo
registro serve desenvolvimento, demonstração e testes, então um bug reproduzido
à mão é reproduzido igual por um teste.

| Id                 | Comportamento                                                          |
| ------------------ | ---------------------------------------------------------------------- |
| `default`          | Latência 80–220ms, sem falhas. Base das auditorias e baselines.        |
| `slow`             | Latência 1,5–3s. Exercita skeletons.                                   |
| `jitter`           | Latência 100ms–2,5s com respostas de catálogo **fora de ordem**.       |
| `flaky`            | ~35% das requisições falham com `503`.                                 |
| `offline`          | Todas as requisições falham como queda de conexão.                     |
| `timeout`          | Requisições nunca resolvem.                                            |
| `empty-catalog`    | Listagem retorna zero resultados com `meta` coerente.                  |
| `session-expiring` | Sessão expira 20s após o login.                                        |
| `payment-declined` | Pedido criado como pendente e recusado na liquidação.                  |
| `order-timeout`    | Pedido persistido, resposta nunca chega; recuperável por idempotência. |
| `price-change`     | Preços mudam ao cotar; checkout bloqueia a confirmação.                |
| `sold-out`         | Primeiro item do carrinho esgota ao cotar.                             |

Endpoints de controle (`/api/__mock/reset`, `/api/__mock/scenario`) **ignoram**
as condições de rede de propósito: um teste precisa conseguir resetar mesmo com
o cenário `offline` ou `timeout` ativo.

O seed da aleatoriedade de cenário é fixo (`21`), escolhido para que as
primeiras ~20 amostras reflitam a taxa de falha configurada em vez de um surto
atípico — importante porque um teste curto observa justamente essa janela.

## 9. Desvios e correções do Figma

### Nome do produto

A página do Figma se chama "Marketplace de NFTs GreenMint", mas o wordmark do
header, o do rodapé e o texto do hero ("Bem-vindo à Kurio") dizem **KURIO**. O
nome da página não é a marca; o produto é Kurio.

### Decisões de conteúdo

| Item                                     | Decisão                                                                                                                                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contagens de rede na sidebar (119/78/86) | Somam um total diferente do das coleções no próprio arquivo. As contagens de **coleção** foram reproduzidas exatamente; as de rede são derivadas dos dados reais, já que o enunciado exige que as consultas reflitam a API. |
| Tema claro                               | O arquivo define apenas um tema escuro; não há variante clara a implementar.                                                                                                                                                |
| Nav "Criadores" e "Aprenda"              | Destinos editoriais fora do escopo. Renderizados como texto inerte com `aria-disabled`, nunca como links que não levam a lugar nenhum.                                                                                      |
| Links do rodapé e newsletter             | Mesma regra: presentes por fidelidade, explicitamente inertes, sem aparentar sucesso funcional.                                                                                                                             |

### Correções de layout

O arquivo contém imprecisões de layout que foram corrigidas na implementação.
Cada correção preserva a composição e a identidade visual; o que muda é o
comportamento em telas reais.

| Onde                               | No Figma                                                                                                                                                          | Correção                                                                                                                |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Wordmark do header                 | Caixa de 160×34 com `overflow: clip` e sem padding, cortando o "K"                                                                                                | Renderizado como texto, alinhado à coluna de conteúdo                                                                   |
| Colunas de destaque do rodapé      | Larguras desiguais (uma flexível, duas fixas em 264,667px)                                                                                                        | Grid de quatro trilhas iguais                                                                                           |
| "Carteiras compatíveis"            | Título transbordava a coluna de 228px                                                                                                                             | Coluna dimensionada pelo conteúdo; título quebra linha                                                                  |
| Chip de carteiras                  | `padding-left: 8px` e `padding-right: 0`, cortando "COINBASE"                                                                                                     | Padding simétrico e chips que quebram linha                                                                             |
| Campo da newsletter                | Padding só à esquerda; o valor colidia com o botão                                                                                                                | Campo reserva espaço para o botão                                                                                       |
| Toolbar do catálogo                | Abas e ordenação colidiam; o grupo de ordenação não encolhia                                                                                                      | Abas roláveis com `min-w-0`, grupo de ordenação encolhível. Sem a correção havia 109px de overflow horizontal em 1024px |
| Abas do catálogo (mobile)          | Três rótulos a 20px de distância, sem padding, colidindo em telas estreitas                                                                                       | Tablist rolável com espaçamento real                                                                                    |
| Hero (mobile)                      | O display de 43px quebra o título em quatro linhas em 390px                                                                                                       | Escala tipográfica responsiva: 28px no mobile, 43px no desktop                                                          |
| Filtros de coleção e rede          | Seleção comunicada apenas por cor                                                                                                                                 | Checkboxes reais: operáveis por teclado, com estado anunciado; a cor permanece como indicador adicional                 |
| Faixa de preço                     | Slider de duas alças sem rótulos acessíveis                                                                                                                       | Dois campos numéricos rotulados mais o botão "Aplicar" do próprio design                                                |
| Botão "Favoritar" (detalhe)        | Transbordava a borda direita do painel                                                                                                                            | Grupo de ações com quebra de linha; ambos os botões cabem                                                               |
| Stepper de quantidade              | Controles desenhados como elipses de 33×49,5                                                                                                                      | Círculos de 36px, com estado desabilitado nos limites                                                                   |
| Seletor de edição                  | Pills estilizadas, sem semântica                                                                                                                                  | Radiogroup real; edições esgotadas ficam desabilitadas e visíveis, não ocultas                                          |
| Miniaturas da galeria              | Seleção apenas por cor de borda                                                                                                                                   | Tablist com navegação por teclado e estado anunciado                                                                    |
| Avaliação em estrelas              | Cinco gráficos sem rótulo                                                                                                                                         | Uma imagem rotulada ("4,6 de 5 estrelas")                                                                               |
| Divisor do painel de detalhe       | Largura fixa de 573px dentro de coluna flexível                                                                                                                   | Largura total da coluna                                                                                                 |
| Campos dos formulários             | Estado inválido comunicado só pela cor da borda                                                                                                                   | `aria-invalid` mais mensagem associada por `aria-describedby`                                                           |
| "Esqueceu a senha?" e login social | Links/botões sem destino no escopo                                                                                                                                | Renderizados como desabilitados; não aparentam sucesso funcional                                                        |
| Coluna "Edições" do carrinho       | Rotula a coluna que controla a **quantidade**                                                                                                                     | Coluna renomeada para "Quantidade"; a edição aparece sob o título do item                                               |
| Resumo da carteira                 | Valores com precisões diferentes: subtotal com 2 casas, total com 3 — as parcelas não fecham com o total                                                          | Todas as linhas em precisão total, de modo que subtotal − desconto + taxa = total exatamente                            |
| Campo de cupom                     | `padding-left: 8px`, botão encostado, texto truncado                                                                                                              | Campo e botão com espaçamento próprio                                                                                   |
| Ícone de remover item              | Sem rótulo acessível                                                                                                                                              | `aria-label` nomeando o item removido                                                                                   |
| Campos obrigatórios do checkout    | "Código de indicação" e "Nome ENS" marcados como obrigatórios                                                                                                     | Marcados como opcionais: ninguém sem código de indicação conseguiria comprar                                            |
| Seleção de carteira duplicada      | "Rede", "Endereço" e "Tipo de carteira" no formulário **e** um radiogroup de carteiras no painel lateral                                                          | Uma única fonte: o radiogroup das carteiras cadastradas; a rede decorre da carteira escolhida                           |
| Referência de transação            | Sequência de zeros                                                                                                                                                | Hash hexadecimal determinístico de 32 bytes                                                                             |
| Contagem de resultados do catálogo | Disputava espaço com as abas de categoria no toolbar, forçando-as a rolar horizontalmente mesmo em telas largas (411px de conteúdo em 345px disponíveis a 1440px) | Movida para junto da paginação, onde há espaço; abas agora quebram linha em vez de rolar                                |

Correções posteriores continuam sendo registradas nesta tabela.

### Navegação mobile

O frame mobile usa uma barra de abas inferior com um botão flutuante central
que se sobrepõe a um card do catálogo e cobre parte do conteúdo. A implementação
usa um drawer de navegação acionado pelo header, com foco preso e devolvido ao
gatilho. A decisão troca fidelidade por conteúdo não obstruído e por um alvo de
navegação acessível; o botão flutuante, que não tem comportamento definido no
enunciado, foi omitido.

## 9.1 Sessão

Token em `localStorage`, enviado como `Authorization: Bearer`. Senhas nunca são
armazenadas no cliente.

- **Expiração** é tratada **uma vez**, no interceptor do Axios: qualquer resposta
  `UNAUTHENTICATED`/`SESSION_EXPIRED` limpa o token e publica um evento. A
  alternativa — tratar em cada chamada — significaria tratar em doze lugares e
  esquecer um, justamente no checkout.
- **Contexto de retorno**: rotas privadas usam `beforeLoad` e redirecionam para
  `/entrar?redirect=<destino>`, então uma sessão que expira no meio do checkout
  retoma de onde parou.
- **Logout e troca de usuário**: todo recurso privado vive sob
  `['owner', ownerKey]`, então remover esse prefixo descarta tudo de uma vez —
  não existe lista de coisas a limpar que possa ficar desatualizada. Um novo id
  de visitante é emitido para que a próxima sessão anônima comece com carrinho
  vazio em vez de herdar o anterior.
- **Carrinho do visitante** é mesclado via `POST /cart/merge` antes de a sessão
  ser publicada no cache, de modo que a primeira renderização como usuário
  autenticado já mostra o carrinho mesclado.

Verificado: usuário A com 2 favoritos e 1 item no carrinho; após logout e login
como usuário B, favoritos e carrinho de B retornam 0.

## 9.2 Estado do carrinho

O carrinho é um recurso do servidor, não um store no cliente. Visitantes são
identificados por `X-Guest-Id`; usuários autenticados, pela sessão. Isso é o
que torna a persistência após refresh e a mescla no login um comportamento de
backend, e não lógica de UI.

- **Quantidade e remoção não são otimistas.** O servidor é a autoridade sobre
  disponibilidade e limite por pedido e pode recusar a alteração; mostrar e
  desfazer seria pior que um spinner curto. A resposta é o carrinho
  recalculado e substitui a entrada de cache diretamente.
- **Os totais nunca são calculados no cliente.** Subtotal, desconto, taxa de
  rede e total vêm de `POST /cart/quote`. O enunciado define a resposta da API
  como referência para finalizar o pedido, então derivar no cliente arriscaria
  exibir um total que o servidor não honraria.
- **A cotação é reemitida** sempre que a versão do carrinho ou o cupom mudam,
  e nunca é servida do cache — é um documento pontual, e cachear derrotaria o
  portão de cotação desatualizada que ela existe para sustentar.
- **O cupom vive na URL** (`/carrinho?cupom=`), então sobrevive a refresh e é
  restaurado pelo histórico junto com o carrinho.

## 9.3 Checkout e idempotência

A submissão segue, deliberadamente, a ordem **recotar → inspecionar → enviar**:

1. Uma cotação nova é pedida imediatamente antes do envio, revalidando preço,
   disponibilidade, cupom e taxas no último momento possível.
2. Se essa cotação trouxer qualquer `issue`, o envio é **bloqueado** e o usuário
   vê o que mudou. Confirmar de novo é uma ação separada e deliberada.
3. Só uma cotação limpa é enviada, acompanhada da chave de idempotência.

### A chave de idempotência e o corpo andam juntos

Uma chave de idempotência só faz sentido junto com o corpo para o qual foi
usada: o servidor trata a mesma chave com conteúdo diferente como conflito, por
definição. Portanto **um retry após timeout reenvia a requisição idêntica** —
recotar antes geraria um novo `quoteId` e transformaria a recuperação em
`IDEMPOTENCY_CONFLICT` em vez de devolver o pedido já criado.

O payload em voo é descartado apenas em falhas que um retry não resolve (regra
de negócio); falhas de rede e timeout preservam a tentativa.

### Verificado

| Cenário                                 | Resultado                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Preço muda entre revisão e envio        | Bloqueado, `issue` listado, **0 pedidos criados**; após "Revisei os novos valores", confirma e cria 1         |
| 3 cliques rápidos em "Confirmar compra" | **1 pedido**                                                                                                  |
| Pagamento recusado                      | Estado `declined` com motivo                                                                                  |
| Timeout após criar o pedido             | Pedido persistido; o timeout do Axios reabilita o botão; retry recupera **o mesmo pedido**, total permanece 1 |
| Recibo após mudança no catálogo         | Valores inalterados — o recibo é um snapshot                                                                  |

## 9.4 Tempo real

O cliente é um **`socket.io-client` real**. A outra ponta é um servidor
simulado em `src/mocks/socket`, construído sobre a interceptação de WebSocket
do MSW mais o binding do protocolo Socket.IO
([`@mswjs/socket.io-binding`](https://github.com/mswjs/socket.io-binding)).
Nenhum evento é injetado chamando setters, callbacks ou o cache diretamente —
tudo trafega pelo socket.

### Eventos

| Evento          | Comportamento                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `nft.updated`   | Atualiza preço e disponibilidade no catálogo, no detalhe e nas linhas do carrinho, recalculando o total da linha |
| `order.updated` | Atualiza o estado do pedido; estados terminais nunca são sobrescritos                                            |

Todo evento carrega `eventId`, `resourceId`, `version` monotônica, `occurredAt`
e `sessionId`.

- **Duplicatas e eventos antigos** são descartados por um _version ledger_ antes
  de tocarem o cache: nada com versão menor ou igual à já aplicada é processado,
  então nenhum efeito é reaplicado e estado mais novo nunca regride.
- **Eventos são validados** contra o contrato Zod; um payload malformado é
  ignorado em vez de entrar no cache.
- **Escopo por sessão**: um evento com `sessionId` só chega ao cliente dono
  daquela sessão, de modo que um evento de uma sessão anterior não atualiza
  dados de outro usuário. `sessionId: null` é broadcast (catálogo é público).
- **Reconexão reconcilia com REST**: o que aconteceu enquanto o socket esteve
  fora nunca foi entregue e não pode ser reproduzido, então as queries ativas
  são invalidadas e o REST é a autoridade.
- **Listeners são liberados** no unmount e a cada troca de identidade.

### Limitações do transporte no ambiente de mocks

| Limitação                                                   | Razão                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Apenas `transports: ['websocket']`                          | O handshake de long-polling HTTP do Socket.IO não é implementado pela camada simulada                                                                                                                                                                                           |
| O link do MSW usa o padrão `*`                              | O casamento de caminho de WebSocket do MSW não considera a query string, e o `socket.io-client` sempre anexa `?EIO=4&transport=websocket`. Todo socket que não seja `/socket.io/` — notadamente o canal de HMR do Vite — é explicitamente repassado ao servidor real            |
| `socket.io-client` é importado dinamicamente                | A biblioteca captura `window.WebSocket` quando seu módulo avalia. O MSW substitui `window.WebSocket` ao iniciar; um import estático, puxado pelo grafo de módulos antes de `startMocks()`, ligaria o construtor **não** substituído e toda conexão escaparia da camada de mocks |
| `@mswjs/socket.io-binding@0.2.0` declara peer `msw ^2.10.2` | O projeto usa MSW v3 e o binding funciona; `.npmrc` fixa `legacy-peer-deps=true` para que um checkout limpo instale com `npm install`                                                                                                                                           |
| Fechamento abrupto do cliente                               | Nem o pacote `disconnect` do Socket.IO nem o `close` do WebSocket chegam até o servidor simulado através do binding. O cliente anuncia `bye` ao encerrar, e o registro ainda faz _prune_ por liveness antes de cada publicação                                                  |

### Verificado

| Cenário                                       | Resultado                                                            |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Preço alterado por evento                     | Catálogo e carrinho atualizam ao vivo, sem refetch                   |
| 3 entregas idênticas + 1 evento antigo        | Todas ignoradas; o preço permanece o da versão mais recente          |
| NFT no carrinho muda durante o checkout       | Confirmação **bloqueada**, 0 pedidos criados; após revisão, confirma |
| Queda de conexão com pedido pendente + reload | Pedido recuperado, total permanece **1**                             |
| Troca de identidade (visitante → autenticado) | Assinatura preservada, sem vazamento nem duplicação                  |

## 10. Limitações conhecidas

Esta seção cresce ao longo da entrega e registra o que foi deliberadamente
reduzido, com o motivo.

- Liquidação de pedido é resolvida sob demanda em `GET /orders/:id` enquanto a
  camada Socket.IO não está instalada; a partir dela, o evento passa a ser o
  caminho primário e este permanece como reconciliação após refresh/reconexão.
- No Figma os modais de login e cadastro aparecem sobre a página do marketplace.
  Aqui `/entrar` e `/cadastro` são rotas próprias — o que garante acesso direto
  e refresh — e o conteúdo atrás do scrim é o shell, não o catálogo.
- Login social e recuperação de senha estão fora do escopo e são renderizados
  desabilitados.
- "Início" e "Mercado" compartilham a URL da home (hero e catálogo na mesma
  rota), então qual dos dois fica ativo no nav é decidido por scrollspy
  (posição real de rolagem), não pela rota — ver
  `use-catalog-section-active.ts`. O estado visual (negrito/cor de destaque/
  sublinhado) é sempre correto. O `aria-current="page"` do próprio `<Link>` do
  TanStack Router, porém, pode aparecer em ambos os itens simultaneamente
  durante uma visita guiada só por rolagem (sem clicar em "Mercado"), porque o
  Link força seu próprio `aria-current` quando SEU PRÓPRIO casamento de rota
  é verdadeiro — por padrão, ignorando a hash. Uma correção por sincronização
  de hash foi tentada e revertida: ela competia com a navegação do próprio
  clique em "Mercado", podendo desfazer a seleção visual logo após o clique,
  uma regressão pior que a duplicata cosmética de `aria-current`.
