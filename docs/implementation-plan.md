# Implementation Plan

## Phase 1 — Project Bootstrap

- pnpm workspace with independent Next.js and NestJS applications;
- TypeScript, Tailwind, ESLint, Prettier, Jest, and Supertest foundations;
- shared formatting, linting, typecheck, and test commands;
- optional Prisma/Supabase configuration;
- health endpoint and minimal frontend page;
- repository documentation and development branch.

## Phase 2 — Authentication and Knowledge Bases

In progress. The backend foundation includes `User`, `AuthSession`, and `KnowledgeBase`
Prisma models, Argon2 password hashing, JWT access tokens, HttpOnly refresh cookies,
refresh-session rotation, protected authentication endpoints, and ownership-scoped
knowledge base CRUD. The initial frontend slice now includes English-only dark responsive
login/register screens, in-memory access token state, refresh-cookie session restoration,
logout, and protected knowledge base dashboard CRUD.

## Phase 3 — Document Ingestion

Upload validation, PDF/TXT/Markdown/DOCX extraction, chunking, statuses, and deletion.

## Phase 4 — RAG Chat

Gemini provider, embeddings, pgvector retrieval, grounded answers, citations, and
conversation history.

## Phase 5 — AI Agent

Read-only tools, Gemini function calling, authorization, execution limits, and failure
handling.

## Phase 6 — Production Improvements

Evaluations, rate limits, usage tracking, observability, CI/CD, deployment, and demo data.

Each phase is implemented, checked, reviewed, and committed separately.
