#!/bin/sh
set -eu

echo "[entrypoint] Starting backend container"

if [ -n "${DATABASE_URL:-}" ]; then
  echo "[entrypoint] Waiting for database to be reachable..."
  # Wait up to ~60s (60 * 1s)
  i=0
  until node -e 'const { Client } = require("pg"); const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false }); c.connect().then(()=>c.end()).then(()=>process.exit(0)).catch(()=>process.exit(1));' >/dev/null 2>&1
  do
    i=$((i+1))
    if [ "$i" -ge 60 ]; then
      echo "[entrypoint] Database not reachable after 60s" >&2
      break
    fi
    sleep 1
  done

  echo "[entrypoint] Applying Prisma migrations (prisma migrate deploy)..."
  npx prisma migrate deploy --config ./prisma.config.ts || {
    echo "[entrypoint] prisma migrate deploy failed" >&2
    exit 1
  }
else
  echo "[entrypoint] DATABASE_URL is not set; skipping migrations"
fi

echo "[entrypoint] Starting server..."
exec npm start
