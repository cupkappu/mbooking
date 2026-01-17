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

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- TanStack Query
- NextAuth.js

### Backend
- NestJS 10
- TypeORM
- PostgreSQL 15
- Passport JWT

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (if not using Docker)

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

5. Or run locally:
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Environment Variables

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

## Project Structure

```
multi_currency_accounting/
├── frontend/              # Next.js frontend
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── accounts/    # Account management
│   │   ├── journal/     # Journal entries
│   │   ├── query/       # Query engine
│   │   ├── rates/       # Exchange rates
│   │   └── ...
│   └── plugins/         # Rate provider plugins
├── shared/              # Shared types
└── docs/                # Documentation
```

## API Documentation

Once the backend is running, access Swagger documentation at:
```
http://localhost:3001/api/docs
```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Docker Production Deployment
```bash
docker-compose -f docker-compose.yml up -d --build
```

## License

MIT
