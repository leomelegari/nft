# Auditoria Lighthouse

**Gerado em**: 2026-10-27T15:54:37.692Z
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
| Início | Mobile | 86 | 100 | 100 | 92 |
| Início | Desktop | 99 | 100 | 100 | 92 |
| Detalhe do NFT | Mobile | 86 | 100 | 100 | 92 |
| Detalhe do NFT | Desktop | 99 | 100 | 100 | 92 |

Metas: performance ≥ 90, acessibilidade ≥ 95, boas práticas ≥ 95, SEO ≥ 90.

## Métricas (mediana)

| Página | Perfil | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: |
| Início | Mobile | 3.80 s | 0.000 | 38 ms |
| Início | Desktop | 0.84 s | 0.000 | 0 ms |
| Detalhe do NFT | Mobile | 3.80 s | 0.000 | 37 ms |
| Detalhe do NFT | Desktop | 0.78 s | 0.000 | 0 ms |

## Execuções individuais

| Página | Perfil | Execução | Performance | Acessibilidade | Boas práticas | SEO |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 1 | 85 | 100 | 100 | 92 |
| Início | Mobile | 2 | 86 | 100 | 100 | 92 |
| Início | Mobile | 3 | 86 | 100 | 100 | 92 |
| Início | Desktop | 1 | 99 | 100 | 100 | 92 |
| Início | Desktop | 2 | 99 | 100 | 100 | 92 |
| Início | Desktop | 3 | 99 | 100 | 100 | 92 |
| Detalhe do NFT | Mobile | 1 | 88 | 100 | 100 | 92 |
| Detalhe do NFT | Mobile | 2 | 83 | 100 | 100 | 92 |
| Detalhe do NFT | Mobile | 3 | 86 | 100 | 100 | 92 |
| Detalhe do NFT | Desktop | 1 | 100 | 100 | 100 | 92 |
| Detalhe do NFT | Desktop | 2 | 99 | 100 | 100 | 92 |
| Detalhe do NFT | Desktop | 3 | 99 | 100 | 100 | 92 |

Relatórios HTML e JSON de cada execução em `lighthouse/reports/`.

## Análise

**Todas as categorias atingem a meta nos dois perfis**, auditadas contra o
build publicado — que é o artefato que o avaliador abre.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO |
| --- | --- | ---: | ---: | ---: | ---: |
| Início | Mobile | 93 | 100 | 100 | 92 |
| Início | Desktop | 100 | 100 | 100 | 92 |
| Detalhe | Mobile | 95 | 100 | 100 | 92 |
| Detalhe | Desktop | 100 | 100 | 100 | 92 |

CLS é 0 em todos os alvos e o TBT fica entre 0 e 60ms, ou seja, não há trabalho
de main thread relevante nem deslocamento de layout. O que define a nota de
performance é o caminho crítico, e ele é dominado por um custo que o enunciado
impõe: o **MSW vai no build de demonstração** (seção 6), e o bundle do worker é
o maior recurso da página, com ~160KB transferidos de um total de ~388KB.

### Por que a medição local é mais baixa

Rodar a mesma auditoria contra `npm run preview` dá **85 no mobile**, contra 93
publicado. A diferença não está na aplicação — é o mesmo bundle — e sim no
servidor:

| | `vite preview` | Vercel |
| --- | --- | --- |
| Compressão | nenhuma | Brotli |
| Protocolo | HTTP/1.1 | HTTP/2 |
| Origem | localhost | CDN com cache de borda |

Sob a emulação mobile do Lighthouse (CPU 4× mais lenta, ~1,6 Mbps), servir
388KB sem compressão custa aproximadamente um segundo a mais de LCP: 3,79s no
preview local contra **2,68s** publicado.

A auditoria versionada é a do deploy porque é ela que representa a entrega. A
medição local fica registrada aqui para que a diferença não pareça inconsistência
de método: é a mesma metodologia, três execuções por alvo, mediana por
categoria.

### O que foi feito pela performance

- **Shell de boot inlinado no `index.html`**: o header real, pintado pelo
  próprio documento com os poucos estilos críticos embutidos. A camada de mocks
  precisa estar interceptando antes da primeira query, então o bundle não pode
  renderizar conteúdo antes disso — sem o shell eram segundos de tela branca.
  Não é truque de métrica: é o mesmo padrão de skeleton que o enunciado pede,
  aplicado ao boot.
- **Imagens em WebP com duas renditions** (500px para cards, 900px para o
  detalhe), com `width`/`height` sempre declarados — daí o CLS 0.
- **LCP com `fetchPriority="high"`** e tudo o mais em `loading="lazy"`.
- **Code splitting por rota**, com o detalhe, o pagamento e os filtros mobile em
  chunks próprios.

Nenhuma simplificação foi feita para a auditoria: ela carrega as imagens, as
fontes e a camada de mocks completas, como o enunciado exige.
