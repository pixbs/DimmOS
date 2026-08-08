#!/usr/bin/env bash
set -euo pipefail

suite="${1:-all}"
case "$suite" in
  all|coverage|integration|e2e|all-browsers) ;;
  *)
    echo "Unknown test suite: $suite" >&2
    exit 2
    ;;
esac

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to run the repository test gate." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed, but its daemon is not running." >&2
  exit 1
fi

project="dimmos-test-${PPID}-$$"
project="${project//[^a-zA-Z0-9_-]/-}"
compose=(docker compose --project-name "$project" --file docker-compose.yml)

cleanup() {
  "${compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

mkdir -p artifacts
export TEST_SUITE="$suite"
"${compose[@]}" up --build --abort-on-container-exit --exit-code-from tests tests
