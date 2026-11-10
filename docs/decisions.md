# Architectural Decisions

## ADR-001: pnpm workspace without Turborepo

Use pnpm workspaces for the initial monorepo. The project is small enough that recursive
pnpm scripts are sufficient and this avoids introducing orchestration complexity before
it is needed.

## ADR-002: Independent Next.js and NestJS applications

The frontend and backend are separate applications. This preserves a clear API boundary,
allows independent deployment, and keeps the backend reusable by future clients.

## ADR-003: Optional database connection during Phase 1

Prisma is configured for Supabase PostgreSQL, but Phase 1 startup must not require a live
database. Database-dependent modules will be introduced only when their phase begins.

## ADR-004: Development branch workflow

Implementation takes place on `development`. Each phase should produce a reviewable
commit. Deployment branch policy will be decided after the application foundation and
CI/deployment requirements are clearer.

## ADR-005: Project specification as the source of truth

The complete requirements are maintained in
[`project-specification.md`](project-specification.md). This file records decisions that
refine or constrain those requirements over time.
