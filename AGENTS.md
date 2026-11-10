# Development Rules

The complete product requirements and phased roadmap are documented in
[`docs/project-specification.md`](docs/project-specification.md). Read it before making
architectural changes.

- Work incrementally and keep each phase small and reviewable.
- Make changes on `development`; do not create commits unless explicitly requested.
- Keep the frontend and NestJS API independent and use strict TypeScript.
- Do not add authentication, RAG, AI agents, or deployment before their planned phase.
- Never commit secrets or `.env` files.
- Do not run destructive database commands against shared environments.
- Run relevant checks before handing off work and document important decisions.
