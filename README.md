# Kurio — Marketplace de NFTs

Implementação do desafio frontend: um marketplace de NFTs em React + TypeScript,
com backend inteiramente simulado (REST via MSW e tempo real via Socket.IO).

> 🚧 Em construção. Esta seção é preenchida a cada etapa da entrega.

## Stack

| Responsabilidade | Tecnologia          |
| ---------------- | ------------------- |
| Interface        | React 19            |
| Linguagem        | TypeScript (strict) |
| Build            | Vite                |
| Roteamento       | TanStack Router     |
| Estado remoto    | TanStack Query      |
| Cliente HTTP     | Axios               |
| Tempo real       | Socket.IO           |
| Estilização      | Tailwind CSS v4     |
| Componentes      | shadcn/ui           |
| Mocking          | MSW                 |
| Testes E2E       | Playwright          |
| Auditoria        | Lighthouse          |

## Começando

```bash
npm install
cp .env.example .env
npm run dev
```

A aplicação sobe em `http://localhost:5173` com a camada de mocks ativa.

## Scripts

| Comando              | Descrição                             |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Desenvolvimento com mocks             |
| `npm run build`      | Checagem de tipos + build de produção |
| `npm run preview`    | Serve o build de produção             |
| `npm run typecheck`  | Checagem de tipos                     |
| `npm run lint`       | Lint (oxlint)                         |
| `npm run format`     | Formatação (Prettier)                 |
| `npm run test:e2e`   | Testes Playwright                     |
| `npm run lighthouse` | Auditoria Lighthouse                  |

## Documentação

Decisões de arquitetura, contratos REST, eventos de tempo real, política de cache e
limitações conhecidas estão em [`ARCHITECTURE.md`](./ARCHITECTURE.md).
