# AI Knowledge Platform

An incremental full-stack portfolio project for private knowledge bases, document
retrieval, and a grounded AI assistant. The project is organized as a pnpm monorepo with
an independent Next.js frontend and NestJS REST API.

## Current status

Phase 1 — project bootstrap is in progress. The workspace currently includes:

- Next.js App Router frontend with a minimal landing page;
- NestJS API with `GET /api/health`;
- Prisma configuration prepared for Supabase PostgreSQL;
- shared workspace scripts and development documentation.

Authentication, document ingestion, embeddings, RAG, agents, and deployment are planned
for later phases and are not implemented yet.

## Prerequisites

- Node.js 22 or newer;
- pnpm 10 or newer;
- PostgreSQL is not required to start the Phase 1 applications.

## Local setup

```bash
pnpm install
cp .env.example apps/api/.env
pnpm dev
```

The web app runs at `http://localhost:3000` and the API runs at
`http://localhost:3001`. Verify the API with:

```bash
curl http://localhost:3001/api/health
```

Useful commands:

```bash
pnpm dev:web
pnpm dev:api
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm check
pnpm db:validate
```

## Documentation

- [Project specification](docs/project-specification.md)
- [Architecture](docs/architecture.md)
- [Architectural decisions](docs/decisions.md)
- [Implementation plan](docs/implementation-plan.md)

## Git workflow

Development happens on the `development` branch. Changes are intentionally committed
after each reviewed phase rather than automatically by the development agent.

The GitHub repository can be created and connected after Phase 1 has been verified
locally. This is the safest point for the first push because it provides a clean,
working foundation. The remote can also be added earlier, but it is not required for
local development.
