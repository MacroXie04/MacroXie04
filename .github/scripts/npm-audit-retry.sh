#!/usr/bin/env bash

set -euo pipefail

readonly max_retries=3
readonly max_attempts=$((max_retries + 1))
readonly fetch_timeout_ms=180000
readonly timeout_seconds=210
readonly audit_report="$(mktemp)"
trap 'rm -f "${audit_report}"' EXIT

last_status=1

for ((attempt = 1; attempt <= max_attempts; attempt += 1)); do
  echo "npm audit attempt ${attempt}/${max_attempts} (timeout: ${timeout_seconds}s)"

  set +e
  NPM_CONFIG_FETCH_RETRIES=0 \
    NPM_CONFIG_FETCH_TIMEOUT="${fetch_timeout_ms}" \
    timeout --foreground --kill-after=5s "${timeout_seconds}s" \
    npm audit --audit-level=high --json | tee "${audit_report}"
  last_status=${PIPESTATUS[0]}
  set -e

  audit_classification="$(
    node -e '
      const { readFileSync } = require("node:fs");
      try {
        const report = JSON.parse(readFileSync(process.argv[1], "utf8"));
        const counts = report?.metadata?.vulnerabilities;
        if (!counts) {
          process.stdout.write("invalid");
        } else if (Number(counts.high) > 0 || Number(counts.critical) > 0) {
          process.stdout.write("vulnerable");
        } else {
          process.stdout.write("safe");
        }
      } catch {
        process.stdout.write("invalid");
      }
    ' "${audit_report}"
  )"

  if [[ ${audit_classification} == "vulnerable" ]]; then
    echo "npm audit confirmed a high or critical vulnerability." >&2
    exit 1
  fi

  if [[ ${last_status} -eq 0 && ${audit_classification} == "safe" ]]; then
    exit 0
  fi

  if [[ ${attempt} -lt ${max_attempts} ]]; then
    if [[ ${last_status} -eq 124 ]]; then
      echo "npm audit attempt ${attempt} exceeded its timeout; retrying." >&2
    else
      echo "npm audit attempt ${attempt} failed with status ${last_status}; retrying." >&2
    fi
    sleep $((attempt * 5))
  fi
done

echo "npm audit failed after ${max_attempts} bounded attempts" >&2
exit 1
