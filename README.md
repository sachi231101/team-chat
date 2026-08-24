# Team Chat

Standalone team chat (channels, DMs, threads, reactions, search, presence).

## Local development

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Start Postgres: `pnpm docker:up`
3. Generate Prisma client and apply schema: `pnpm prisma:generate` then `pnpm --filter api exec prisma db push`
   (workspace users/channels are seeded on API boot when the database is empty.)
4. Run apps: `pnpm dev` (API on `:3000`, web on `:5173`)

Identity is mock-only: the web app sends `x-user-id` / `x-workplace-id` headers. Do not add a real auth system here.
