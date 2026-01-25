# Multi-Currency Personal Accounting Software

A beautiful, full-featured personal accounting software with multi-currency support and double-entry bookkeeping.

## Features

- **Double-Entry Bookkeeping**: Full support for the five account categories (Assets, Liabilities, Equity, Revenue, Expense)
- **Multi-Currency**: Native support for multiple currencies with exchange rate tracking
- **Hierarchical Accounts**: Unlimited nested account structure
- **Query Engine**: Flexible balance queries with depth merging and progressive loading
- **Budget Management**: Support for periodic and non-periodic budgets
- **Reports**: Balance sheet and income statement generation
- **Plugin System**: Extendable rate providers (JS plugins + REST API)
- **Authentication**: Auth.js with OAuth and Authelia support
- **Multi-Tenancy**: Row Level Security (RLS) for data isolation

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- React Query (TanStack Query)
- Auth.js

### Backend
- NestJS 10
- TypeORM
- PostgreSQL 15
- Passport JWT

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd multi_currency_accounting
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start with Docker Compose:
```bash
docker-compose up -d
```

5. Access the application:
   - Frontend: http://localhost:8068
   - Backend API: http://localhost:8067
   - API Docs: http://localhost:8067/api/docs

### Local Development

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run start:dev

# Terminal 2 - Frontend (port 3000)
cd frontend && npm run dev
```

## Project Structure

```
multi_currency_accounting/
├── frontend/              # Next.js 14 frontend (App Router)
│   ├── app/              # Pages and layouts
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and configurations
│   └── types/            # TypeScript types
├── backend/              # NestJS 10 backend
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── accounts/     # Account management
│   │   ├── journal/      # Journal entries
│   │   ├── query/        # Query engine
│   │   ├── rates/        # Exchange rates
│   │   └── users/        # User management
│   └── plugins/          # Rate provider plugins
├── docs/                 # Documentation
│   ├── requirements/     # Feature requirements
│   └── plans/            # Design documents
└── scripts/              # Utility scripts
```

## Development

### Running Tests

**Using Docker test environment (recommended):**
```bash
./scripts/verify-and-test.sh
```

**Or manually:**
```bash
# Start test containers
docker compose -f docker-compose.test.yml up -d --build

# Run E2E tests
npm run test:e2e

# Backend tests with coverage
cd backend && npm run test:cov
```

### Building for Production
```bash
npm run build
```

### Docker Production Deployment
```bash
docker-compose up -d --build
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_HOST | PostgreSQL host | localhost |
| DATABASE_PORT | PostgreSQL port | 5432 |
| DATABASE_USER | Database user | accounting |
| DATABASE_PASSWORD | Database password | secret |
| DATABASE_NAME | Database name | accounting |
| JWT_SECRET | JWT signing secret | - |
| NEXTAUTH_SECRET | NextAuth secret | - |
| NEXTAUTH_URL | NextAuth URL | http://localhost:3000 |
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:3001 |

## Docker Services

| Service | Port | Internal |
|---------|------|----------|
| PostgreSQL | 5432 | 5432 |
| Backend | 8067 | 3001 |
| Frontend | 8068 | 3000 |

## Documentation

- [Product Requirements](/docs/PRD.md)
- [API Requirements](/docs/requirements/REQUIREMENTS_API.md)
- [Database Schema](/docs/requirements/REQUIREMENTS_DATABASE.md)
- [Agent Conventions](/docs/requirements/AGENTS.md)

## Contributing

1. Follow the conventions in `docs/requirements/AGENTS.md`
2. Ensure all tests pass before submitting
3. Use feature branches and create pull requests
4. Add proper documentation for new features

## License

MIT
