#!/usr/bin/env bash

set -euo pipefail

readonly max_attempts=3
readonly timeout_seconds=180
last_status=1

for ((attempt = 1; attempt <= max_attempts; attempt += 1)); do
  echo "npm audit attempt ${attempt}/${max_attempts} (timeout: ${timeout_seconds}s)"

  set +e
  timeout --foreground --kill-after=5s "${timeout_seconds}s" \
    npm audit --audit-level=high
  last_status=$?
  set -e

  if [[ ${last_status} -eq 0 ]]; then
    exit 0
  fi

  if [[ ${attempt} -lt ${max_attempts} ]]; then
    sleep $((attempt * 5))
  fi
done

echo "npm audit failed after ${max_attempts} bounded attempts" >&2
exit "${last_status}"
