#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage:
  cloudflare-pages-api.sh current-production-id
  cloudflare-pages-api.sh validate-rollback-target <deployment-id>
  cloudflare-pages-api.sh rollback <deployment-id> <expected-commit-sha>
  cloudflare-pages-api.sh wait-for-production <deployment-id> [attempts] [delay-seconds]

Required environment variables:
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ACCOUNT_ID
  CLOUDFLARE_PAGES_PROJECT
EOF
}

if (( $# < 1 )); then
  usage
  exit 64
fi

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"
: "${CLOUDFLARE_PAGES_PROJECT:?CLOUDFLARE_PAGES_PROJECT is required}"

if [[ ! "$CLOUDFLARE_ACCOUNT_ID" =~ ^[0-9a-f]{32}$ ]]; then
  echo "CLOUDFLARE_ACCOUNT_ID must be 32 lowercase hexadecimal characters." >&2
  exit 65
fi

if [[ ! "$CLOUDFLARE_PAGES_PROJECT" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "CLOUDFLARE_PAGES_PROJECT contains unsupported characters." >&2
  exit 65
fi

api_base="https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$CLOUDFLARE_PAGES_PROJECT"

request() {
  local method=$1
  local path=$2
  local body=${3:-}
  local args=(
    --silent
    --show-error
    --fail-with-body
    --request "$method"
    --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
    --header "Content-Type: application/json"
    --connect-timeout 10
    --max-time 30
    --retry 3
    --retry-all-errors
    --retry-delay 2
  )

  if [[ -n "$body" ]]; then
    args+=(--data "$body")
  fi

  curl "${args[@]}" "$api_base$path"
}

validate_deployment_id() {
  local deployment_id=$1
  if [[ ! "$deployment_id" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
    echo "Deployment ID must be a lowercase UUID." >&2
    exit 65
  fi
}

validate_commit_sha() {
  local commit_sha=$1
  if [[ ! "$commit_sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Expected commit SHA must be 40 lowercase hexadecimal characters." >&2
    exit 65
  fi
}

deployment_json() {
  local deployment_id=$1
  request GET "/deployments/$deployment_id"
}

assert_rollback_target() {
  local deployment_id=$1
  local expected_sha=${2:-}
  local response

  validate_deployment_id "$deployment_id"
  if [[ -n "$expected_sha" ]]; then
    validate_commit_sha "$expected_sha"
  fi
  response=$(deployment_json "$deployment_id")

  jq -e \
    --arg id "$deployment_id" \
    --arg sha "$expected_sha" \
    '
      .success == true and
      .result.id == $id and
      (.result.environment | ascii_downcase) == "production" and
      (.result.url | type) == "string" and
      (.result.url | startswith("https://")) and
      (
        .result.deployment_trigger.metadata.commit_hash as $commit |
        ($commit | type) == "string" and
        ($commit | test("^[0-9a-f]{40}$")) and
        ($sha == "" or $commit == $sha)
      ) and
      (
        .result.latest_stage.status == "success" or
        any(.result.stages[]?; .name == "deploy" and .status == "success")
      )
    ' <<<"$response" >/dev/null || {
      echo "Rollback target is not a successful production deployment with valid commit metadata." >&2
      exit 65
    }

  printf '%s\n' "$response"
}

command=$1
shift

case "$command" in
  current-production-id)
    if (( $# != 0 )); then
      usage
      exit 64
    fi
    response=$(request GET "")
    current_id=$(jq -er '.result.canonical_deployment.id' <<<"$response")
    validate_deployment_id "$current_id"
    printf '%s\n' "$current_id"
    ;;

  validate-rollback-target)
    if (( $# != 1 )); then
      usage
      exit 64
    fi
    response=$(assert_rollback_target "$1")
    jq -c '{id: .result.id, url: .result.url, commit: .result.deployment_trigger.metadata.commit_hash}' <<<"$response"
    ;;

  rollback)
    if (( $# != 2 )); then
      usage
      exit 64
    fi
    assert_rollback_target "$1" "$2" >/dev/null
    response=$(request POST "/deployments/$1/rollback")
    jq -e '.success == true' <<<"$response" >/dev/null || {
      echo "Cloudflare did not accept the rollback request." >&2
      exit 1
    }
    jq -c '{id: .result.id, url: .result.url}' <<<"$response"
    ;;

  wait-for-production)
    if (( $# < 1 || $# > 3 )); then
      usage
      exit 64
    fi
    deployment_id=$1
    attempts=${2:-12}
    delay_seconds=${3:-5}
    validate_deployment_id "$deployment_id"

    if [[ ! "$attempts" =~ ^[1-9][0-9]*$ || ! "$delay_seconds" =~ ^[0-9]+$ ]]; then
      echo "Attempts must be positive and delay must be non-negative." >&2
      exit 65
    fi

    for (( attempt = 1; attempt <= attempts; attempt++ )); do
      response=$(request GET "")
      current_id=$(jq -r '.result.canonical_deployment.id // empty' <<<"$response")
      if [[ "$current_id" == "$deployment_id" ]]; then
        echo "Cloudflare production now points to deployment $deployment_id."
        exit 0
      fi
      if (( attempt < attempts )); then
        echo "Waiting for Cloudflare production pointer (attempt $attempt/$attempts)."
        sleep "$delay_seconds"
      fi
    done

    echo "Cloudflare production did not move to deployment $deployment_id." >&2
    exit 1
    ;;

  *)
    usage
    exit 64
    ;;
esac
