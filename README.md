# Clipper — Backend

Fastify REST API for **Clipper**, a platform connecting Content Creators with Clippers who turn long-form video into viral short-form content.

## What Is Clipper?

Content Creators launch campaigns with source video content and payout rules. Clippers browse campaigns, create short clips, and submit them for review. Approved clips are tracked for views and Clippers are paid accordingly.

## Main Entities

### Users
Two roles sharing one `users` table:

| Role | Description |
|------|-------------|
| `clipper` | Browses campaigns, submits clips, earns money per views/approvals |
| `content_creator` | Creates campaigns, uploads source content, reviews and approves clips |

Registration requires email verification before login is allowed.

### Campaign
Owned by a Content Creator. Defines clip requirements and payout rules.

| Field | Description |
|-------|-------------|
| `title` | Campaign name |
| `description` | Public description |
| `guidelines` | Specific clipping rules |
| `payout_per_view` | Earnings per view (decimal) |
| `payout_fixed` | Optional flat payment per approved clip |
| `clip_length_max` | Maximum clip duration in seconds |
| `allowed_formats` | JSON array of accepted video formats |
| `status` | `active` / `inactive` / `completed` |

### Clip
Submitted by a Clipper against a Campaign.

| Field | Description |
|-------|-------------|
| `video_url` | URL of the uploaded clip |
| `status` | `pending` → `approved` / `rejected` |
| `rejection_reason` | Set when rejected |
| `views` | Tracked view count |
| `earnings` | Calculated based on views × payout_per_view |

### Payout
A Clipper's withdrawal request from their earned balance. Processed via Stripe.

**Statuses:** `pending` → `completed` / `failed`

### Invoice
Generated for each payout. Includes legal fields (name, date, amount, invoice number). Downloadable as PDF.

### Support Request
User-submitted issue or question, categorised and tracked.

**Categories:** `technical` / `payout` / `account` / `other`

## Tech Stack

- **Fastify v4** + **TypeScript**
- **MySQL** — relational database
- **mysql2** — raw query execution (`?` placeholders)
- **@fastify/jwt** — JWT authentication
- **bcryptjs** — password hashing (cost factor 12)
- **nodemailer** — transactional email (verification)
- **dotenv** — environment configuration

## Project Structure

```
src/
├── db/
│   ├── client.ts           # MySQL pool, query(), queryOne() helpers
│   ├── migrate.ts          # Migration runner
│   └── migrations/
│       └── 001_init.sql    # Full database schema
├── plugins/
│   └── db.ts               # Fastify plugin — DB connection lifecycle
├── routes/
│   └── auth/
│       ├── index.ts        # Route registration
│       ├── register.ts     # POST /api/auth/register
│       ├── login.ts        # POST /api/auth/login
│       ├── me.ts           # GET  /api/auth/me
│       └── verify-email.ts # POST /api/auth/verify-email
├── services/
│   └── email.ts            # sendVerificationEmail()
├── types/
│   ├── index.ts            # User, UserRole, JwtPayload
│   └── fastify.d.ts        # Fastify type augmentations
├── app.ts                  # App factory — registers plugins and routes
└── server.ts               # Entry point
```

## Getting Started

### Prerequisites
- Node.js v18+ (use `nvm use 20`)
- MySQL running on port 3306

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create database (skip if using a hosted provider like ZoneVS — DB already exists)
mysql -u root -p -e "CREATE DATABASE d14401_clipper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials, JWT secret, and SMTP settings

# 4. Run migration
npm run db:migrate:dev

# 5. Start dev server
npm run dev
```

Server runs on [http://localhost:3001](http://localhost:3001).

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled output |
| `npm run db:migrate:dev` | Run migration (TypeScript, dev only) |
| `npm run db:migrate` | Run migration (compiled, production) |

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | Register a new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT token |
| `GET` | `/api/auth/me` | JWT | Get current user |
| `POST` | `/api/auth/verify-email` | — | Verify email with token |
| `GET` | `/api/health` | — | Health check |

## Environment Variables

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_NAME=d14401_clipper
DB_USER=root
DB_PASS=

JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=7d

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<user>
SMTP_PASS=<pass>
SMTP_FROM=noreply@clipper.com
```

> For email testing in dev, use [Ethereal](https://ethereal.email/) — create a free test account and it captures all outgoing emails without sending them.
