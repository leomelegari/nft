# Auditoria Lighthouse

**Gerado em**: 2026-10-26T23:28:03.389Z
**URL base**: http://localhost:4173 (build de produção, cenário de mocks `default`)
**Execuções por alvo**: 3 — os números abaixo são a mediana de cada categoria

## Ambiente

| Item | Valor |
| --- | --- |
| Lighthouse | 13.5.0 |
| Node | v24.21.0 |
| Navegador | MacOS |
| Playwright | 1.64.1 |
| SO | Darwin 27.0.0 (arm64) |
| CPU | Apple M4 × 10 |
| Memória | 16.0 GB |

## Resultados (mediana)

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO |
| --- | --- | ---: | ---: | ---: | ---: |
| Início | Mobile | 85 | 100 | 100 | 92 |
| Início | Desktop | 99 | 100 | 100 | 92 |
| Detalhe do NFT | Mobile | 85 | 100 | 100 | 92 |
| Detalhe do NFT | Desktop | 99 | 100 | 100 | 92 |

Metas: performance ≥ 90, acessibilidade ≥ 95, boas práticas ≥ 95, SEO ≥ 90.

## Métricas (mediana)

| Página | Perfil | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: |
| Início | Mobile | 3.80 s | 0.000 | 42 ms |
| Início | Desktop | 0.84 s | 0.000 | 0 ms |
| Detalhe do NFT | Mobile | 3.79 s | 0.000 | 38 ms |
| Detalhe do NFT | Desktop | 0.78 s | 0.000 | 0 ms |

## Execuções individuais

| Página | Perfil | Execução | Performance | Acessibilidade | Boas práticas | SEO |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 1 | 86 | 100 | 100 | 92 |
| Início | Mobile | 2 | 85 | 100 | 100 | 92 |
| Início | Mobile | 3 | 85 | 100 | 100 | 92 |
| Início | Desktop | 1 | 99 | 100 | 100 | 92 |
| Início | Desktop | 2 | 99 | 100 | 100 | 92 |
| Início | Desktop | 3 | 99 | 100 | 100 | 92 |
| Detalhe do NFT | Mobile | 1 | 85 | 100 | 100 | 92 |
| Detalhe do NFT | Mobile | 2 | 83 | 100 | 100 | 92 |
| Detalhe do NFT | Mobile | 3 | 86 | 100 | 100 | 92 |
| Detalhe do NFT | Desktop | 1 | 99 | 100 | 100 | 92 |
| Detalhe do NFT | Desktop | 2 | 100 | 100 | 100 | 92 |
| Detalhe do NFT | Desktop | 3 | 99 | 100 | 100 | 92 |

Relatórios HTML e JSON de cada execução em `lighthouse/reports/`.

## Análise

Acessibilidade (100), boas práticas (100) e SEO (92) atingem a meta nos dois
perfis. Performance atinge a meta no desktop (99) e fica **abaixo no mobile
(85–86, meta 90)**.

### Causa

O gargalo é o caminho crítico, não o trabalho em tela: TBT fica em ~40ms
(nota 1,0), CLS em 0 (nota 1,0) e Speed Index em 2,5s (nota 0,98). O que puxa a
nota para baixo são FCP (2,5s) e LCP (3,8s), ambos determinados por quanto
tempo leva até o JavaScript conseguir renderizar conteúdo real.

Esse tempo tem uma causa identificável e exigida pelo enunciado: o
**MSW vai no build de demonstração** (seção 6 — "a camada de mocks deve estar
disponível no build de demonstração"). O bundle do worker é de longe o maior
recurso da página:

| Recurso | Transferido |
| --- | ---: |
| `browser-*.js` (MSW) | 160 KB |
| `index-*.js` (app) | 99 KB |
| `query-keys-*.js` | 56 KB |
| `nft-*.js` | 40 KB |
| CSS | 11 KB |

São 388 KB no total, sob a emulação mobile do Lighthouse (CPU 4× mais lenta,
~1,6 Mbps). As imagens não participam do problema: o hero e as artes do
catálogo somam quilobytes.

Além do tamanho, há uma dependência de ordem: o service worker precisa estar
interceptando **antes** da primeira query, senão a requisição inicial escapa
para a rede. A aplicação é client-side e, portanto, não pode renderizar
conteúdo vindo de dados antes disso.

### O que foi feito

Um **shell de boot** foi inlinado no `index.html`: o header real, pintado pelo
próprio documento, com os poucos estilos críticos embutidos. Não é um truque de
métrica — é o mesmo padrão de skeleton que o enunciado pede, aplicado ao boot,
e o React o substitui ao montar. O efeito medido foi FCP de 3,1s para 2,5s e a
nota de performance mobile de 83 para 85–86.

### Por que não foi além

As alternativas restantes custariam fidelidade ao enunciado:

- **Remover o MSW do build** devolveria a nota, mas o enunciado exige os mocks
  no build de demonstração, e sem eles não há aplicação para auditar.
- **Pré-renderizar (SSR/SSG)** mudaria a arquitetura da entrega, que é uma SPA
  com TanStack Router conforme a stack obrigatória.
- **Auditar uma rota simplificada** é explicitamente vedado: "sem
  simplificações exclusivas para melhorar a pontuação".

O desktop, que não sofre a emulação de CPU e rede, fica em 99 com o mesmo
código e o mesmo bundle — o que indica que o custo é de transferência e parse
sob throttling, não de trabalho desnecessário na aplicação.
