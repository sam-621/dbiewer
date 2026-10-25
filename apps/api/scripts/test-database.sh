#!/usr/bin/env bash
set -u

config=$1
shift

compose="docker compose -f docker-compose.test.yml -p dbiewer-api-test"

if [ -n "$($compose ps -q)" ]; then
  echo "The test database is already running: another test suite is using it. Wait for it to finish; integration and e2e never run at the same time." >&2
  exit 1
fi

if ! $compose up -d --wait; then
  $compose down -v
  exit 1
fi

ADMIN_DATABASE_URL=postgres://postgres:postgres@localhost:54329/dbiewer_test tsx scripts/migrate.ts
status=$?

if [ $status -eq 0 ]; then
  vitest run -c "$config" "$@"
  status=$?
fi

$compose down -v
exit $status
