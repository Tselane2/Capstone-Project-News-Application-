# Deployment Plan
## The Press Room — News Portal Platform

---

## 1. Prerequisites

Before deploying, ensure the following are installed on the host:

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 24.x | Use `.nvmrc` or `nvm use 24` |
| pnpm | 9.x | `npm install -g pnpm` |
| PostgreSQL | 15+ | Local or managed (e.g. Supabase, Neon, Railway) |

---

## 2. Environment Variables

Create a `.env` file in the project root (never commit this file).

```env
# Database connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/pressroom

# JWT signing secret — use a long random string in production
# Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=your-very-long-random-secret-here
```

The API server reads both variables at startup and will throw an error if either is missing.

---

## 3. Initial Setup

Run these commands once when setting up the project for the first time:

```bash
# 1. Clone the repository and enter the project directory
git clone <repo-url>
cd the-press-room

# 2. Install all workspace dependencies
pnpm install

# 3. Set environment variables (copy the template and fill in values)
cp .env.example .env
# Edit .env with your DATABASE_URL and SESSION_SECRET

# 4. Push the database schema (creates all tables)
pnpm --filter @workspace/db run push

# 5. (Optional) Seed the database with demo accounts and sample content
pnpm --filter @workspace/scripts run seed
```

---

## 4. Running in Development

```bash
# Start the API server (Express, port 8080)
pnpm --filter @workspace/api-server run dev

# In a second terminal — start the frontend (Vite React, port 21440)
pnpm --filter @workspace/news-portal run dev
```

Both services are accessible through the Replit reverse proxy:
- Frontend: `http://localhost:80/`
- API: `http://localhost:80/api`

---

## 5. Code Generation (after OpenAPI changes)

Whenever `lib/api-spec/openapi.yaml` is modified, regenerate the Zod schemas and React Query hooks:

```bash
pnpm --filter @workspace/api-spec run codegen
```

Then restart both services for the changes to take effect.

---

## 6. Running Schema Migrations

```bash
# Push schema changes to the database (development only — destructive)
pnpm --filter @workspace/db run push

# For production — generate a SQL migration file first and review it
pnpm --filter @workspace/db run generate
# Then apply it manually or via your migration tool
```

> **Warning:** `pnpm --filter @workspace/db run push` drops and recreates tables if the schema changes significantly. Never run this against a production database without reviewing the generated migration first.

---

## 7. Type Checking

Before deploying, verify the entire codebase type-checks cleanly:

```bash
# Build composite libs (db, api-spec, api-zod, api-client-react)
pnpm run typecheck:libs

# Then typecheck all leaf packages (api-server, news-portal)
pnpm run typecheck
```

A successful run produces no output — any error must be fixed before deploying.

---

## 8. Running Tests

```bash
# Run all unit and integration tests
pnpm run test

# Run tests with coverage report
pnpm run test --coverage

# Run end-to-end tests (requires both services to be running)
pnpm --filter @workspace/news-portal run test:e2e
```

---

## 9. Building for Production

```bash
# Build the API server (outputs a CJS bundle to artifacts/api-server/dist/)
pnpm --filter @workspace/api-server run build

# Build the frontend (outputs static files to artifacts/news-portal/dist/)
pnpm --filter @workspace/news-portal run build
```

---

## 10. Starting the Production Server

```bash
# Start the API server in production mode
NODE_ENV=production node artifacts/api-server/dist/index.js
```

To run the frontend in production, serve the `artifacts/news-portal/dist/` directory with any static file server (nginx, Caddy, or a CDN).

**Recommended nginx config for the frontend:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/press-room/dist;
    index index.html;

    # Serve React app for all routes (client-side routing)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the Express server
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 11. Configuring PostgreSQL

```sql
-- Connect to PostgreSQL as superuser and run:

-- Create the application database
CREATE DATABASE pressroom;

-- Create a dedicated application user (do not use the superuser in production)
CREATE USER pressroom_user WITH ENCRYPTED PASSWORD 'your-strong-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pressroom TO pressroom_user;
```

Then update `DATABASE_URL` in your `.env`:
```
DATABASE_URL=postgresql://pressroom_user:your-strong-password@localhost:5432/pressroom
```

---

## 12. Production Checklist

Before going live, confirm each of the following:

- [ ] `SESSION_SECRET` is a cryptographically random string (minimum 64 characters)
- [ ] `DATABASE_URL` points to the production database
- [ ] `NODE_ENV=production` is set
- [ ] Database migrations have been applied (`pnpm --filter @workspace/db run push` or migration files)
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] All tests pass (`pnpm run test`)
- [ ] Production build completes successfully
- [ ] HTTPS is configured (TLS termination at reverse proxy or load balancer)
- [ ] CORS origin is restricted to your production domain (not `*`)
- [ ] Log output is directed to a file or log aggregator (pino supports JSON output)
- [ ] A process manager (PM2, systemd) is configured to restart the server on crash

---

## 13. Demo Accounts (Seeded Data)

After running the seed script, the following accounts are available:

| Email | Password | Role |
|-------|----------|------|
| alice@pressroom.com | password123 | editor |
| ben@pressroom.com | password123 | journalist |
| cara@pressroom.com | password123 | journalist |
| dan@pressroom.com | password123 | reader |

> Remove or change these accounts before launching in a public production environment.

---

## 14. Deploying to Replit

The project is pre-configured for Replit deployment:

1. Open the project in Replit
2. Ensure `DATABASE_URL` and `SESSION_SECRET` are set in **Secrets** (not `.env`)
3. Click **Deploy** in the Replit UI
4. Replit handles TLS, health checks, and routing automatically
5. The app is served at `https://your-project.replit.app`
