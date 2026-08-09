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
    bun run test:component
    bun run test:component
    bun run test:integration:run
    bun run test:coverage:run
    bun run test:e2e:seed
    bun run build
    bun run test:e2e:run --project=chromium-desktop --project=chromium-mobile
    ;;
  coverage)
    bun run test:coverage:run
    ;;
  integration)
    bun run test:integration:run
    ;;
  e2e)
    bun run test:e2e:seed
    bun run build
    bun run test:e2e:run --project=chromium-desktop --project=chromium-mobile
    ;;
  all-browsers)
    for pass in 1 2; do
      VITEST_BROWSER_MATRIX=all \
        VITEST_JUNIT_OUTPUT="artifacts/vitest/junit-component-cross-browser-${pass}.xml" \
        bun run test:component
    done
    bun run test:e2e:seed
    bun run build
    bun run test:e2e:run \
      --project=chromium-desktop \
      --project=chromium-mobile \
      --project=firefox-desktop \
      --project=firefox-mobile \
      --project=webkit-desktop \
      --project=webkit-mobile \
      --repeat-each=2
    ;;
  failure-check)
    echo "Intentional failure used to verify container and volume cleanup." >&2
    exit 86
    ;;
  *)
    echo "Unknown TEST_SUITE: ${TEST_SUITE:-}" >&2
    exit 2
    ;;
esac
