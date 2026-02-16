# Clipper Backend — CLAUDE.md

## Meta Rule
**Always update this file when adding new routes, tables, features, or changing conventions.** This keeps the AI context accurate across sessions.

## Project
Fastify REST API for the Clipper platform — a two-sided marketplace where Content Creators launch video campaigns and Clippers create short-form clips to earn money.

## Stack
- **Fastify v4** + **TypeScript**
- **MySQL** via raw `mysql2/promise` queries
- **JWT** via `@fastify/jwt` — stateless auth
- **bcryptjs** — password hashing
- **nodemailer** — email verification
- **dotenv** — environment config

## Critical DB Rules
- Use `?` placeholders (NOT `$1`, `$2` — that's PostgreSQL)
- MySQL has no `RETURNING` clause — pre-generate UUIDs with `uuidv4()`, insert, then SELECT if needed
- All IDs are `VARCHAR(36)` UUIDs generated in application code
- Helper functions: `query<T>()` returns `T[]`, `queryOne<T>()` returns `T | null`

## Folder Structure
```
src/
  db/
    client.ts          # getPool(), query(), queryOne()
    migrate.ts         # runs all *.sql files in migrations/ in filename order
    migrations/
      001_init.sql     # base schema (users, campaigns, clips, payouts, invoices, support_requests)
      002_campaign_sources.sql  # campaign_sources table + guidelines nullable
  plugins/
    db.ts              # Fastify plugin — verifies DB connection on startup
  routes/
    auth/              # register, login, me, verify-email
    campaigns/         # create, list-my, list-active, get-one, update, delete, add-source, remove-source
  services/
    email.ts           # sendVerificationEmail()
  utils/
    youtube.ts         # extractYouTubeVideoId(), youtubeThumbnailUrl(), youtubeEmbedUrl()
  types/
    index.ts           # User, UserRole, JwtPayload
    fastify.d.ts       # Fastify instance type augmentation (authenticate decorator)
  app.ts               # builds and configures Fastify app
  server.ts            # entry point — starts server
```

## Key Conventions
- **Route files**: export `handler` function + `schema` object (JSON Schema for Fastify validation)
- **Routes registered**: in `src/routes/<domain>/index.ts`, imported in `src/app.ts`
- **Auth decorator**: `fastify.authenticate` — add to route as `onRequest: [fastify.authenticate]`
- **Authenticated user**: available as `request.user.sub` (user id), `request.user.role`, `request.user.email`
- **Error responses**: use `@fastify/sensible` helpers — `reply.unauthorized()`, `reply.notFound()`, `reply.conflict()`, `reply.badRequest()`

## User Roles
- `clipper` — browses campaigns, submits clips, tracks earnings
- `content_creator` — creates/manages campaigns, reviews clips, pays clippers

## API Routes
### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register; auto-verifies if `EMAIL_VERIFICATION_ENABLED=false` |
| POST | `/login` | — | Login, returns JWT |
| GET | `/me` | JWT | Current user |
| POST | `/verify-email` | — | Verify email token |

### Campaigns (`/api/campaigns`)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/` | JWT | creator | Create campaign |
| GET | `/my` | JWT | creator | List own campaigns (with source/clip counts + thumbnail_video_id) |
| GET | `/` | JWT | any | List all active campaigns |
| GET | `/:id` | JWT | any | Get campaign + sources array |
| PUT | `/:id` | JWT | creator | Update campaign fields |
| DELETE | `/:id` | JWT | creator | Delete campaign |
| POST | `/:id/sources` | JWT | creator | Add YouTube source URL |
| DELETE | `/:id/sources/:sourceId` | JWT | creator | Remove source |

## Feature Flags (`.env`)
- `EMAIL_VERIFICATION_ENABLED=false` — skip email verification on register/login (dev only)

## Running
```bash
nvm use 20
cp .env.example .env    # then edit with real credentials
npm run db:migrate:dev  # run all migrations in order
npm run dev             # http://localhost:3001
```

## Environment Variables (`.env`)
```
DB_HOST=localhost
DB_NAME=clipper
DB_USER=root
DB_PASS=
JWT_SECRET=<long random string>
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:5173
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
EMAIL_VERIFICATION_ENABLED=true
```

## Adding a New Route Domain
1. Create `src/routes/<domain>/index.ts`
2. Add handlers + schemas in the same folder
3. Register in `src/app.ts` with `app.register(<routes>, { prefix: '/api/<domain>' })`
4. Add any new tables to a new migration file `src/db/migrations/00N_<name>.sql`
5. **Update this CLAUDE.md** — folder structure, API routes table
