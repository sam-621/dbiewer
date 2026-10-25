#!/usr/bin/env bash
set -u

compose="docker compose -f docker-compose.test.yml -p dbiewer-api-test"

if ! $compose up -d --wait; then
  $compose down -v
  exit 1
fi

ADMIN_DATABASE_URL=postgres://postgres:postgres@localhost:54329/dbiewer_test tsx scripts/migrate.ts
status=$?

if [ $status -eq 0 ]; then
  vitest run -c vitest.e2e.config.ts "$@"
  status=$?
fi

$compose down -v
exit $status
