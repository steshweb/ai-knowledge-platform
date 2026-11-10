# Architecture

## Current foundation

The repository uses a pnpm workspace monorepo with two independent applications:

```text
Browser
   |
   v
apps/web (Next.js App Router)
   |
   | REST over HTTP
   v
apps/api (NestJS modular monolith)
   |
   v
Supabase PostgreSQL + pgvector (introduced in later phases)
```

The API does not import frontend code. The frontend communicates with the API through
HTTP and will not connect directly to PostgreSQL.

## Planned backend boundaries

Future modules will be introduced only when needed: authentication, users, knowledge
bases, documents, conversations, AI providers, retrieval, and usage tracking. Prisma
will manage relational data, while parameterized SQL migrations will cover pgvector
features that are not represented cleanly by Prisma.

## Environment strategy

Environment variables are documented in `.env.example`. Database credentials and AI
provider keys belong only to the backend. Phase 1 keeps the database connection
optional so the health endpoint and frontend can start without Supabase access.

See the [project specification](project-specification.md) for the target architecture,
security model, RAG pipeline, deployment strategy, and phased scope.
