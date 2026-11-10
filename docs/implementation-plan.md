# Implementation Plan

## Phase 1 — Project Bootstrap

- pnpm workspace with independent Next.js and NestJS applications;
- TypeScript, Tailwind, ESLint, Prettier, Jest, and Supertest foundations;
- shared formatting, linting, typecheck, and test commands;
- optional Prisma/Supabase configuration;
- health endpoint and minimal frontend page;
- repository documentation and development branch.

## Phase 2 — Authentication and Knowledge Bases

Users, secure authentication, ownership checks, and knowledge base CRUD.

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
