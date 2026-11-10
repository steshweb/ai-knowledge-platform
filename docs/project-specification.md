# AI Knowledge Platform — Project Specification & Development Instructions

## 1. Project Overview

**Project Name:** AI Knowledge Platform  
**Project Type:** Full Stack / Applied AI / RAG / AI Agents / Portfolio Project

Build a modern, full-stack AI-powered knowledge management application where registered
users can upload documents, create personal knowledge bases, and interact with an AI
assistant that answers questions based on their uploaded content.

The application should demonstrate practical skills in Full Stack Engineering, Backend
Architecture, Retrieval-Augmented Generation (RAG), LLM integration, vector databases,
AI agents, tool calling, and AI-first development.

This is an educational and portfolio project intended to be publicly available on GitHub
and deployed as a working demonstration.

### Primary objectives

- Build a complete full-stack application using TypeScript.
- Learn and implement RAG pipelines from first principles.
- Integrate LLM and embedding APIs.
- Implement semantic search using PostgreSQL and pgvector.
- Build a conversational AI assistant with document context.
- Extend the assistant with AI agent capabilities and tool calling.
- Maintain a clean, modular, scalable architecture.
- Keep the backend independent from the frontend.
- Support future LLM provider replacement.
- Deploy using free-tier infrastructure whenever possible.
- Produce a professional GitHub repository suitable for technical interviews.

Prioritize a small, reliable, well-tested MVP over unnecessary complexity.

## 2. Technology Stack

### Frontend

- Next.js with App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui for reusable UI components
- React Hook Form and Zod when appropriate

### Backend

- Node.js
- NestJS
- TypeScript
- REST API
- DTO validation
- Swagger / OpenAPI
- JWT authentication
- Password hashing using Argon2 or bcrypt

### Database

- PostgreSQL
- Supabase Free for remotely hosted PostgreSQL
- pgvector extension
- Prisma ORM
- SQL migrations for pgvector-specific functionality where necessary

### AI

- Google Gemini API as the initial LLM provider
- Gemini embedding model with an available free tier
- Provider abstraction for future LLM integrations
- RAG pipeline implemented using TypeScript
- Native provider SDK initially
- LangChain.js / LangGraph.js only when they provide a clear benefit

### Infrastructure

- GitHub public repository
- pnpm workspaces
- Render Free for frontend and backend deployment, subject to available free-tier limits
- Supabase Free for PostgreSQL
- GitHub Actions for CI
- Environment-based configuration

### Testing

- Jest
- Supertest
- Playwright for critical E2E flows
- Dedicated AI evaluation tests

Avoid introducing unnecessary technologies during the initial implementation.

## 3. Architecture

Use a **Modular Monolith + Independent Backend API + Monorepo** architecture.

The frontend and backend must be separate applications inside one repository. The
frontend communicates with the backend through REST API. The backend must not depend on
Next.js or frontend-specific code.

Use dependency injection and modular architecture to keep business logic maintainable
and testable.

### Monorepo Structure

```text
ai-knowledge-platform/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   │
│   └── api/
│       ├── src/
│       ├── package.json
│       └── ...
│
├── packages/
│   ├── shared-types/
│   └── api-client/
│
├── infrastructure/
├── docs/
│   ├── architecture.md
│   └── decisions.md
├── AGENTS.md
├── pnpm-workspace.yaml
├── package.json
├── pnpm-lock.yaml
├── .gitignore
├── .env.example
└── README.md
```

This is a target structure. Do not create unnecessary packages or empty modules before
they are needed. Use pnpm workspaces without Turborepo initially.

## 4. Authentication and User Model

The MVP supports multiple registered users, but each user has private, independent
knowledge bases. Do not implement organizations, teams, or complex role-based access
control in the MVP.

### Authentication Features

- User registration
- User login
- User logout
- Protected API endpoints
- Secure password hashing
- JWT-based authentication
- Secure browser session handling
- Ownership validation for protected resources

Prefer secure HttpOnly cookies for browser authentication, with appropriate CSRF
protection and cookie configuration. Never store long-lived authentication tokens in
localStorage.

Every knowledge base, document, and conversation must belong to an authenticated user.
A user must never be able to access another user's private information.

Design the ownership model so organizations can be introduced later without a complete
rewrite.

## 5. Knowledge Bases

Each registered user can create multiple knowledge bases.

Example:

```text
Name: Project Documentation
Description: Technical documentation for our SaaS application.
```

Required functionality:

- Create a knowledge base
- List personal knowledge bases
- View knowledge base details
- Update a knowledge base
- Delete a knowledge base
- Upload documents into a knowledge base
- Start conversations associated with a knowledge base

Each knowledge base contains independent documents and conversations.

## 6. Document Upload and Ingestion

### Supported MVP Formats

- PDF containing extractable text
- TXT
- Markdown
- DOCX

OCR is not required.

### Document Processing Pipeline

```text
Upload document
       |
       v
Validate file
       |
       v
Extract text
       |
       v
Normalize text
       |
       v
Split into chunks
       |
       v
Generate embeddings
       |
       v
Store chunks and vectors
       |
       v
Update document status
```

Validate authentication, knowledge base ownership, file size, supported format, file
content and MIME type, and upload limits.

Document statuses:

- `pending`
- `processing`
- `completed`
- `failed`

For the MVP, process small documents directly in the backend. Use conservative file-size
limits. Store extracted chunks and embeddings in PostgreSQL. The original file does not
need permanent storage in the initial MVP; document this limitation clearly.

Ensure temporary files and buffers are cleaned up. When deleting a document, remove its
associated chunks and embeddings. Avoid Redis or BullMQ until background processing
becomes necessary.

## 7. Embeddings and Vector Database

Use PostgreSQL with the pgvector extension. Use Gemini embeddings initially, provided
the selected model and free quota are available.

```typescript
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

The exact interface may be refined during implementation.

Important requirements:

- Use compatible embedding configurations for documents and search queries.
- Track the embedding model used to generate vectors.
- Ensure the pgvector column dimension matches the selected embedding model.
- Use appropriate vector similarity operations.
- Support top-K retrieval.
- Filter retrieval by knowledge base and authenticated user.
- Use parameterized SQL for raw database queries.
- Handle embedding API errors and rate limits.
- Support future reindexing when changing embedding models.

Prisma should manage standard relational entities. Use PostgreSQL SQL migrations and
parameterized queries where pgvector operations are not supported directly by Prisma. Do
not implement a separate vector database service.

## 8. RAG Pipeline

### Query Pipeline

```text
User question
      |
      v
Validate user access
      |
      v
Generate query embedding
      |
      v
Vector similarity search
      |
      v
Retrieve relevant chunks
      |
      v
Build LLM context
      |
      v
Generate grounded answer
      |
      v
Return answer with citations
```

The user selects a knowledge base and asks a question. The backend retrieves relevant
document chunks from PostgreSQL, passes context to the LLM with the question, and returns
an answer grounded in documentation with references to source documents and chunks.

If documentation is insufficient, the assistant must explicitly communicate uncertainty
or lack of evidence. Do not invent unsupported answers.

### Conversational Context

Support multi-turn conversations and store history in PostgreSQL. Follow-up questions
should consider previous messages, but the entire conversation must not be sent
indefinitely. Implement reasonable history limits or context management and retrieve
relevant document context for new questions as needed.

Implement and understand document chunking, chunk overlap, embedding generation, vector
similarity, top-K retrieval, context construction, prompt engineering, source
attribution, hallucination reduction, conversation history, and retrieval evaluation.

Initially implement a straightforward RAG pipeline. Do not introduce advanced retrieval
frameworks before the basic pipeline works.

## 9. LLM Integration

Use Google Gemini API initially, preferably a model with an available free tier and the
required capabilities. Keep integration behind a provider abstraction.

```typescript
interface LLMProvider {
  generate(messages: ChatMessage[], options?: GenerationOptions): Promise<LLMResponse>;
}
```

Initially implement only the Gemini provider. Future providers may include OpenAI,
Anthropic Claude, and other compatible APIs.

Provider-specific capabilities such as streaming, tool calling, structured outputs, and
context limits must be handled explicitly. Do not create unnecessary provider
implementations before they are required. API credentials must only be stored on the
backend and never exposed to the browser.

## 10. AI Agent — Post-MVP Phase

After the basic RAG assistant, extend it with agent capabilities and Gemini function
calling/tool calling.

Initial read-only tools:

```text
searchKnowledgeBase
listDocuments
getDocumentDetails
summarizeDocument
```

Possible future tool:

```text
searchAcrossKnowledgeBases
```

Requirements:

- Execute tools through NestJS services.
- Validate authentication and authorization for every invocation.
- Limit maximum agent execution steps.
- Handle tool failures.
- Log metadata without leaking sensitive content.
- Prevent unauthorized document access.
- Treat retrieved documents as untrusted input.
- Require confirmation before sensitive or destructive actions.

Initially implement read-only tools and avoid complex multi-agent architectures.

## 11. Preliminary Database Schema

### User

`id`, `email`, `passwordHash`, `createdAt`, `updatedAt`

### KnowledgeBase

`id`, `userId`, `name`, `description`, `createdAt`, `updatedAt`

### Document

`id`, `knowledgeBaseId`, `filename`, `mimeType`, `size`, `status`, `errorMessage`,
`createdAt`, `updatedAt`

### DocumentChunk

`id`, `documentId`, `content`, `chunkIndex`, `embedding`, `metadata`, `createdAt`

### Conversation

`id`, `knowledgeBaseId`, `userId`, `createdAt`, `updatedAt`

### Message

`id`, `conversationId`, `role`, `content`, `createdAt`

### AIUsage

`id`, `userId`, `provider`, `model`, `inputTokens`, `outputTokens`, `estimatedCost`,
`createdAt`

Review relationships, constraints, indexes, deletion behavior, embedding dimensions,
and ownership before creating migrations. Do not implement the entire schema during
project bootstrap.

## 12. REST API

The backend exposes a versioned REST API with Swagger/OpenAPI documentation.

### Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Knowledge Bases

```http
POST   /api/v1/knowledge-bases
GET    /api/v1/knowledge-bases
GET    /api/v1/knowledge-bases/:id
PATCH  /api/v1/knowledge-bases/:id
DELETE /api/v1/knowledge-bases/:id
```

### Documents

```http
POST   /api/v1/knowledge-bases/:id/documents
GET    /api/v1/knowledge-bases/:id/documents
GET    /api/v1/documents/:id/status
DELETE /api/v1/documents/:id
```

### Chat and health

```http
POST /api/v1/chat
GET  /api/v1/conversations/:id
GET  /api/health
```

Future endpoints:

```http
POST /api/v1/agents/run
GET  /api/v1/usage
```

Validate request payloads and return consistent error responses.

## 13. Frontend Requirements

Build a clean, modern, responsive application with these screens:

- Landing page
- Registration page
- Login page
- Dashboard
- Knowledge base list
- Knowledge base details
- Document upload
- Document processing status
- AI chat interface
- Conversation history

Use minimal, professional, responsive, accessible UI with clear loading states, error
notifications, empty states, upload feedback, and source citations. Use shadcn/ui where
appropriate and avoid unnecessary visual complexity.

## 14. Security Requirements

Implement authentication, resource ownership validation, input validation, file-size and
file-type validation, rate limiting, secure API key management, safe error handling, CORS
configuration, secure cookie handling, prompt injection protection, data isolation, safe
document deletion, and AI usage limits.

All vector searches must be scoped to documents accessible to the authenticated user.
Never rely on the LLM to enforce authorization. Treat uploaded document content as
untrusted data and never execute instructions found inside uploaded documents.

Never expose secrets or private document contents in logs. Use prepared demonstration
documents for public testing. Warn users not to upload confidential documents when using
AI providers under free-tier data-processing terms.

## 15. AI Usage Limits

Implement configurable limits during later development phases. Suggested initial limits:

- Maximum document size: 2–5 MB
- Maximum documents per user: 3
- Maximum AI questions per user per day: 10–20
- Maximum concurrent ingestion operations
- Maximum agent execution steps
- Request timeout limits

These are configurable application-level limits. Handle provider rate-limit errors
gracefully and do not assume external AI APIs provide unlimited free usage.

## 16. Deployment

Target infrastructure:

| Component     | Service              |
| ------------- | -------------------- |
| Frontend      | Render Free          |
| Backend       | Render Free          |
| PostgreSQL    | Supabase Free        |
| Vector Search | pgvector             |
| LLM           | Gemini API free tier |
| Embeddings    | Gemini API free tier |
| CI            | GitHub Actions       |

Verify actual free-tier limits and supported deployment configurations before
implementation.

Deployment requirements:

- Independent frontend and backend services;
- both connected to the same monorepo;
- separate environment variables;
- secure database connection;
- production Prisma migrations;
- appropriate build and start commands;
- proper CORS and cookie configuration;
- public demonstration URL;
- health endpoint.

Use one remotely hosted Supabase PostgreSQL database for local NestJS development and
deployed NestJS on Render. The frontend must communicate with the backend API rather than
connecting directly to PostgreSQL. Using the same database during local development and
deployment is acceptable for the educational MVP, but avoid destructive development
operations against shared data. Do not use Prisma reset commands against shared data;
prefer migrations and controlled seed data. Document the risks of one database across
environments.

Important constraints: backend services may sleep; free databases may have inactivity
limits; AI APIs have rate limits; uploaded files must not depend on persistent local
disk; and free-tier infrastructure is for demonstration, not guaranteed production
availability.

## 17. Testing

### Unit tests

- File validation
- Text chunking
- Provider adapters
- Ownership checks
- Document status transitions
- RAG context construction

### Integration tests

- Authentication
- Knowledge base CRUD
- Document ingestion
- Database persistence
- pgvector retrieval
- Authorization
- API error handling

### E2E tests

- User registration
- Login
- Knowledge base creation
- Document upload
- Document indexing
- AI question
- Grounded answer with sources

### AI evaluations

Create a small dataset of sample documents and questions. Evaluate retrieval relevance,
answer correctness, groundedness, source attribution, missing-information behavior,
cross-user data isolation, and prompt injection resistance. Do not rely exclusively on
LLM-generated evaluations; include deterministic tests.

## 18. Observability

Track document processing time, embedding generation time, retrieval latency, LLM response
latency, total request latency, retrieved chunk count, input and output tokens, estimated
AI cost, provider errors, and rate-limit errors. Avoid logging private document content
and keep observability lightweight during the MVP.

## 19. Development Phases

### Phase 1 — Project Bootstrap

- Initialize monorepo and pnpm workspaces.
- Initialize Next.js and NestJS.
- Configure TypeScript, Tailwind, ESLint, and formatting.
- Install Prisma and prepare Supabase connection configuration.
- Create backend health endpoint.
- Create minimal frontend landing page.
- Add environment examples, README, architecture documentation, and `AGENTS.md`.
- Verify local startup.

**Result:** Both applications start locally and the backend is ready for database
integration.

### Phase 2 — Authentication and Knowledge Bases

Prisma schema, registration, login/logout, JWT authentication, knowledge base CRUD,
ownership validation, and basic dashboard.

**Result:** Users can register and manage private knowledge bases.

### Phase 3 — Document Ingestion

Document upload, PDF/TXT/MD/DOCX parsing, text chunking, embedding generation, pgvector
persistence, statuses, and deletion.

**Result:** Documents are processed and indexed.

### Phase 4 — RAG Chat

Query embeddings, vector search, context construction, Gemini integration, grounded
answers, source citations, and conversation history.

**Result:** Complete functional RAG MVP.

### Phase 5 — AI Agent

Tool calling, read-only knowledge tools, agent execution loop, authorization checks, tool
execution limits, and error handling.

**Result:** AI assistant with agent capabilities.

### Phase 6 — Production Improvements

AI evaluations, rate limiting, usage tracking, CI/CD, deployment, demonstration data, and
documentation improvements.

**Result:** Publicly accessible portfolio application.

## 20. AI-First Development Workflow

Development is done collaboratively with Codex in VS Code. Codex acts as a collaborative
software engineer, not an autonomous system that implements the entire project without
review.

Workflow:

1. Discuss the current task.
2. Review architecture and requirements.
3. Propose a small implementation plan.
4. Implement only the approved scope.
5. Run relevant checks and tests.
6. Explain architectural decisions.
7. Review changes.
8. Suggest an appropriate Git commit message.
9. Wait for the next task.

Rules:

- Do not implement all project phases at once.
- Do not introduce unnecessary dependencies or unused abstractions.
- Prefer readable TypeScript and NestJS conventions.
- Keep the backend independent.
- Validate external input and handle errors explicitly.
- Never hardcode credentials or commit `.env` files.
- Do not run destructive database commands without explicit approval.
- Explain significant architectural decisions.
- Keep each development step small and reviewable.
- Ask before major architectural changes.
- Do not create Git commits automatically unless explicitly requested.

## 21. Portfolio Quality Requirements

The public repository should demonstrate:

### Full Stack Engineering

Next.js, React, NestJS, TypeScript, PostgreSQL, Prisma, REST API, authentication, and
testing.

### AI Engineering

Gemini integration, embeddings, RAG, vector search, context management, prompt
engineering, source attribution, tool calling, AI agents, and AI evaluations.

### Software Architecture

Monorepo, modular backend, dependency injection, provider abstraction, security, error
handling, data isolation, and CI/CD.

The README should include project overview, architecture diagram, technology stack,
features, local setup instructions, environment variables, screenshots, demo URL, API
documentation, limitations, and future improvements. Only document features as completed
after they have been implemented and tested.

## 22. Repository and delivery workflow

The implementation branch is `development`. Complete each phase in a separate,
reviewable change and create a commit after verification and user review. A GitHub remote
is not required during local bootstrap. The recommended first push is after Phase 1 is
verified, using the initial commit message:

```text
chore: bootstrap AI Knowledge Platform monorepo
```

The deployment branch strategy (`development` directly or merge to `main`) will be
decided when deployment work begins.
