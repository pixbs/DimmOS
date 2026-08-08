#!/usr/bin/env bash
set -euo pipefail

bun tests/scripts/assert-test-database.mjs
bun payload migrate
mkdir -p artifacts/vitest artifacts/playwright

case "${TEST_SUITE:-all}" in
  all)
    bun run lint
    bun run typecheck
    bun run test:unit
    bun run test:unit
    bun run test:coverage
    bun run build
    ;;
  integration)
    bun run test:integration:run
    ;;
  e2e)
    bun run test:e2e:run --project=chromium-desktop --project=chromium-mobile
    ;;
  all-browsers)
    bun run test:e2e:run --repeat-each=2
    ;;
  *)
    echo "Unknown TEST_SUITE: ${TEST_SUITE:-}" >&2
    exit 2
    ;;
esac
