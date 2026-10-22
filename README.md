# Cafe Menu Backend

Backend API for the Persian cafe and restaurant menu application.

**Stack:** NestJS · TypeScript (strict) · Prisma · PostgreSQL · Scalar

## Prerequisites

- Node.js >= 20
- PostgreSQL 14+

## Setup

```bash
cp .env.example .env
# edit .env with your DATABASE_URL and secrets

npm install
npx prisma generate
npm run prisma:reset
npm run prisma:seed
npm run start:dev
```

- API base: `http://localhost:3000/api/v1`
- API docs (Scalar): `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`
- Health: `GET /api/v1/health`

## Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile |
| `npm run format` | Prettier write |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:push` | Create/apply migrations |
| `npm run prisma:seed` | Seed demo data |

## Branching

See project `01-git-workflow.md`. Work only on `dev_ai_<agent>` branches and open PRs to `dev`.
