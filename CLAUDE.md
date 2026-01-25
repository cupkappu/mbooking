# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-currency personal accounting software with double-entry bookkeeping, Next.js 14 frontend, NestJS 10 backend, PostgreSQL 15, and TypeORM.

## Common Commands

```bash
# Development
npm run dev              # Start frontend + backend concurrently
cd backend && npm run start:dev   # Backend only (port 3001)
cd frontend && npm run dev        # Frontend only (port 3000)

# Testing (CRITICAL: Use Docker test environment)
./scripts/verify-and-test.sh              # Full Docker validation (recommended)
docker compose -f docker-compose.test.yml up -d --build
npm run test:e2e                           # Run Playwright E2E tests
cd backend && npm run test:cov             # Backend Jest with coverage

# Building
npm run build              # Build all workspaces
cd backend && npm run build
cd frontend && npm run build

# Docker
docker-compose up -d       # Dev environment (ports 5432, 8067, 8068)
docker-compose logs -f     # View logs
```

## Architecture

### Backend (NestJS - `backend/src/`)
- **Module pattern**: Each feature in its own directory with `entities/`, `dto/`, `services/`, `validators/`
- **Multi-tenancy**: Row Level Security via `runWithTenant()` helper, never bypass RLS
- **Soft deletes**: Use `deleted_at` column - never hard delete data
- **Money values**: Use `decimal` type, never float
- **API docs**: Swagger at `/api/docs` when running

### Frontend (Next.js App Router - `frontend/`)
- **Route groups**: `(auth)` for login, `(dashboard)` for main app, `(admin)` for admin panel
- **Data fetching**: React Query hooks in `hooks/use-*.ts`
- **API proxy**: `/api/v1/*` rewritten to backend via `next.config.mjs`

### Database
- PostgreSQL 15 with TypeORM
- UUID v4 primary keys on all tables
- Timestamps: `created_at`, `updated_at` on all entities

## Key Patterns

### Validation & DTOs
All input validation uses `class-validator` DTOs. Never expose raw TypeORM entities to API responses.

### CI-Aware Playwright
Tests are configured for CI: `forbidOnly: true`, retries only in CI, sequential workers.

### Docker Ports
| Service | Port | Internal |
|---------|------|----------|
| PostgreSQL | 5432 | 5432 |
| Backend | 8067 | 3001 |
| Frontend | 8068 | 3000 |

## Critical Rules

- **NEVER hard delete data** - use soft delete (`deleted_at`)
- **NEVER bypass RLS** - always filter by tenant
- **NEVER use `float` for money** - use `decimal` type
- **NEVER expose raw TypeORM entities** - use DTOs
- **Always verify in Docker test environment** before committing

## Important Files

| Path | Purpose |
|------|---------|
| `AGENTS.md` | Agent knowledge base with conventions and anti-patterns |
| `docker-compose.test.yml` | Docker test environment config |
| `scripts/verify-and-test.sh` | Automated validation script |
| `playwright.config.ts` | E2E test configuration |
| `docs/requirements/` | Decomposed feature requirements |
