# Team Chat

Standalone team chat (channels, DMs, threads, reactions, search, presence).

## Local development

1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Start Postgres and Redis: `pnpm docker:up`
   Redis is on the Compose network only (not published on the host). Local `pnpm dev` can keep using a host Redis at `localhost:6379`, or map `6379:6379` in Compose if that port is free.
3. Generate Prisma client and apply schema: `pnpm prisma:generate` then `pnpm --filter api exec prisma db push`
   (workspace users/channels are seeded on API boot when the database is empty.)
4. Run apps: `pnpm dev` (API on `:3000`, web on `:5173`)

Identity is mock-only: the web app sends `x-user-id` / `x-workplace-id` headers. Do not add a real auth system here.

## Docker stack (Nginx + APIs)

Full stack behind Nginx on port 80 (Team Chat web + API, Identity/Workplace stubs, Postgres, Redis):

```bash
pnpm docker:stack
```

Then open http://localhost

| Path | Upstream |
| --- | --- |
| `/` | Team Chat web |
| `/api/` | team-chat-api |
| `/api/identity/` | identity-api stub |
| `/api/workplace/` | workplace-api stub |
| `/socket.io/` | team-chat-api WebSocket |

AI keys are read from `apps/api/.env` at runtime and are not baked into images.

### Load balancing

After the stack is healthy:

```bash
pnpm docker:scale
```

That runs `identity-api`, `workplace-api`, and `team-chat-api` with 2 replicas each. Nginx re-resolves Docker DNS so requests spread across replicas.

**Checks**

- `curl http://localhost/api/health` — `hostname` should rotate across team-chat-api replicas.
- `curl http://localhost/api/identity/health` and `/api/workplace/health` — stub `hostname` should rotate.
- `curl http://localhost/api/identity/session` — both identity replicas share Redis key `session:shared`.
- Open http://localhost, load a channel, send a message (Socket.IO via `/socket.io`).
- Burst `curl` against `/api/health` or `/api/identity/health` to confirm Nginx `429` under `limit_req`.

Stop everything: `pnpm docker:down`
