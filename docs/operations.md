# Operations runbook

## Environment

Development can use the checked-in SQLite path. Production must set:

```text
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<long-random-secret>
DJANGO_ALLOWED_HOSTS=api.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
CSRF_TRUSTED_ORIGINS=https://app.example.com
DB_ENGINE=postgres
DB_NAME=answer
DB_USER=questlab
DB_PASSWORD=<secret>
DB_HOST=<postgres-host>
DB_PORT=5432
```

The settings module fails fast when production secrets, hosts, or PostgreSQL configuration are missing. Management keys and invite/access codes are accepted as write-only API fields and are kept in the local prototype client storage; authentication and RBAC remain intentionally outside this scope.

## Deploy

From the repository checkout on the server:

```bash
./backend/scripts/deploy-backend.sh
./scripts/deploy-frontend.sh
```

The backend script migrates the database, collects static files, runs `check --deploy`, starts Gunicorn under PM2 (or a scoped PID/log fallback when PM2 is unavailable), and verifies `/api/health/`. The default production ports are API `8001` and web `3001`; override them with `QUESTLAB_API_BIND`, `QUESTLAB_WEB_PORT`, and related `QUESTLAB_*_PID_FILE`/`*_LOG_FILE` variables. Put Nginx or another TLS reverse proxy in front of Gunicorn; the app enables HTTPS security headers when `DJANGO_DEBUG=false`.

## Backups and recovery

Use the PostgreSQL-native tools and keep encrypted, off-host copies:

```bash
pg_dump --format=custom --file=questlab-$(date +%F).dump "$DATABASE_URL"
pg_restore --clean --if-exists --dbname="$DATABASE_URL" questlab-YYYY-MM-DD.dump
```

Run a restore drill before relying on a backup. Never put `DATABASE_URL`, passwords, or production `.env` files into git or build logs.

## Health and observability

- Liveness/readiness: `GET /health/` or `GET /api/health/`.
- Django and request failures are emitted through the standard process log; PM2 should forward those logs to the host log collector.
- Submitted sessions store an immutable result snapshot. `python manage.py rebuild_result_snapshots` backfills snapshots created before the migration and is safe to schedule as a maintenance job.
- Existing tests and packs use deactivation (`draft` / `is_active=false`) when history exists, avoiding destructive deletion of historical records.

## Release gates

Run locally before merging:

```bash
npm ci
npm run lint
npm run build
backend/.venv/bin/python backend/manage.py check
backend/.venv/bin/python backend/manage.py makemigrations --check --dry-run
backend/.venv/bin/python backend/manage.py test learning
```

GitHub Actions is intentionally disabled. These gates are run locally or from the deployment host before a release.
