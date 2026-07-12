# Odoo Boilerplate

A production-minded Next.js 16 App Router template with TypeScript, Tailwind CSS 4, Shadcn UI, Prisma 6, PostgreSQL, Zustand, Zod, Meilisearch-backed user search, and Loki-compatible structured logging.

## Features

- Next.js 16 App Router with server-first routing and compact responsive UI.
- Strict TypeScript, Zod validation, Prisma-backed PostgreSQL persistence, and sanitized API errors.
- Users CRUD with pagination, filters, sorting, debounced search, mobile card layout, and polished loading states.
- Meilisearch service for typo-tolerant semantic-style search with a safe PostgreSQL fallback.
- Loki logging integration using the `grafana/loki` Docker image plus structured JSON console logs.
- Security headers configured in `next.config.ts`.
- Health endpoint at `/api/health` for database, search, and logging readiness checks.

## Quick Start

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:generate
pnpm users:populate
pnpm users:index
pnpm dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` and adjust secrets before production:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/odoo_db?schema=public"
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="masterKey"
MEILISEARCH_USERS_INDEX="users"
LOKI_PUSH_URL="http://localhost:3100/loki/api/v1/push"
LOG_LEVEL="info"
```

Use a strong Meilisearch key and database password outside local development.

## Infrastructure

`docker-compose.yml` includes:

- `postgres`: primary relational database with a persistent volume.
- `meilisearch`: search engine for users search bars.
- `loki`: log aggregation target for server-side structured logs.

All services include health checks and persistent volumes.

## Useful Scripts

- `pnpm dev`: start the Next.js development server.
- `pnpm build`: create a production build.
- `pnpm lint`: run ESLint.
- `pnpm db:migrate`: apply Prisma migrations.
- `pnpm db:generate`: regenerate Prisma Client.
- `pnpm users:populate`: generate and seed demo users.
- `pnpm users:index`: index existing users into Meilisearch.
- `pnpm db:wipe`: wipe all database tables.

## Project Structure

```text
app/                  Next.js layouts, pages, route handlers, and error states
components/           Reusable UI, layout, modal, landing, page, and table components
hooks/                Client hooks for UI and data synchronization
lib/                  API helpers, Prisma client, search, logging, query builders
prisma/               Schema and migrations
scripts/              Data generation, seeding, wiping, and search indexing utilities
store/                Zustand slices and selectors
types/                Shared Zod schemas and TypeScript types
```

## Production Notes

- Keep all incoming API payloads behind Zod validation.
- Keep Meilisearch and Loki network access private in deployed environments.
- Replace local Docker secrets before exposing the stack.
- Re-run `pnpm users:index` after bulk imports or migrations that bypass route handlers.
- Add real server-side authentication before protecting business data in production.
