import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'ts-node --transpile-only prisma/seed.ts',
  },
  datasource: {
    // Fallback allows `prisma generate` / postinstall without a live .env.
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/cafe_menu?schema=public',
  },
});
