#!/usr/bin/env bash
set -euo pipefail

APP_NAME="hongzhe-i2g"
REPO_URL="https://github.com/MacroXie04/MacroXie04"
REPO_SLUG="MacroXie04/MacroXie04"
REGION="${AWS_REGION:-us-west-2}"
AMPLIFY_BRANCH="${AMPLIFY_BRANCH:-main}"
ROOT_DOMAIN="i2g.ucmerced.edu"
SUBDOMAIN_PREFIX="hongzhe"

log() {
  printf '[setup-amplify] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

upsert_record() {
  local hosted_zone_id="$1"
  local name="$2"
  local rtype="$3"
  local value="$4"

  local change_batch
  change_batch=$(python - "$name" "$rtype" "$value" <<'PY'
import json
import sys

name, rtype, value = sys.argv[1], sys.argv[2], sys.argv[3]
print(json.dumps({
    "Comment": "Managed by scripts/setup_amplify.sh",
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": name,
                "Type": rtype,
                "TTL": 300,
                "ResourceRecords": [{"Value": value}],
            },
        }
    ],
}))
PY
)

  aws route53 change-resource-record-sets \
    --hosted-zone-id "$hosted_zone_id" \
    --change-batch "$change_batch" >/dev/null
}

sync_domain_dns_records() {
  local app_id="$1"
  local hosted_zone_id="$2"
  local domain_json

  domain_json=$(aws amplify get-domain-association \
    --app-id "$app_id" \
    --domain-name "$ROOT_DOMAIN" \
    --region "$REGION" \
    --output json)

  local records_file
  records_file=$(mktemp)

  DOMAIN_JSON="$domain_json" python - "$ROOT_DOMAIN" >"${records_file}" <<'PY'
import json
import os
import sys

root_domain = sys.argv[1]
data = json.loads(os.environ["DOMAIN_JSON"]).get("domainAssociation", {})
records = []

cert_record = data.get("certificateVerificationDNSRecord")
if cert_record:
    records.append(cert_record)

for sub in data.get("subDomains", []):
    dns_record = sub.get("dnsRecord")
    if dns_record:
        records.append(dns_record)

seen = set()
for record in records:
    parts = record.split()
    if len(parts) < 3:
        continue
    name = parts[0].rstrip(".") + "."
    rtype = parts[1].upper()
    value = " ".join(parts[2:])
    if rtype not in {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "SRV"}:
        continue
    key = (name, rtype, value)
    if key in seen:
        continue
    seen.add(key)
    print(f"{name}\t{rtype}\t{value}")
PY

  while IFS=$'\t' read -r name rtype value; do
    if [ -z "${name}" ] || [ -z "${rtype}" ] || [ -z "${value}" ]; then
      continue
    fi

    case "$name" in
      "${ROOT_DOMAIN}."|*"."${ROOT_DOMAIN}".")
        ;;
      *)
        log "Skip DNS record outside ${ROOT_DOMAIN}: ${name}"
        continue
        ;;
    esac

    upsert_record "$hosted_zone_id" "$name" "$rtype" "$value"
  done <"${records_file}"

  rm -f "${records_file}"
}

require_cmd aws
require_cmd python

log "Running AWS identity pre-check"
aws sts get-caller-identity --output json >/dev/null

log "Checking hosted zone for ${ROOT_DOMAIN}"
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name "${ROOT_DOMAIN}" \
  --max-items 10 \
  --query "HostedZones[?Name=='${ROOT_DOMAIN}.']|[0].Id" \
  --output text)

if [ -z "${HOSTED_ZONE_ID}" ] || [ "${HOSTED_ZONE_ID}" = "None" ]; then
  log "Hosted zone ${ROOT_DOMAIN} not found in this AWS account; exiting without changes."
  exit 1
fi

HOSTED_ZONE_ID="${HOSTED_ZONE_ID##*/}"
log "Using hosted zone ID ${HOSTED_ZONE_ID}"

log "Resolving Amplify app ${APP_NAME}"
APP_ID=$(aws amplify list-apps \
  --region "${REGION}" \
  --query "apps[?name=='${APP_NAME}']|[0].appId" \
  --output text)

if [ -z "${APP_ID}" ] || [ "${APP_ID}" = "None" ]; then
  GH_ACCESS_TOKEN="${GITHUB_ACCESS_TOKEN:-}"
  if [ -z "${GH_ACCESS_TOKEN}" ] && command -v gh >/dev/null 2>&1; then
    GH_ACCESS_TOKEN="$(gh auth token 2>/dev/null || true)"
  fi

  if [ -z "${GH_ACCESS_TOKEN}" ]; then
    log "Amplify app missing and no GitHub access token found."
    log "Set GITHUB_ACCESS_TOKEN or login with gh, then rerun."
    exit 1
  fi

  log "Creating Amplify app ${APP_NAME}"
  APP_ID=$(aws amplify create-app \
    --name "${APP_NAME}" \
    --repository "${REPO_URL}" \
    --access-token "${GH_ACCESS_TOKEN}" \
    --platform WEB \
    --enable-branch-auto-build \
    --region "${REGION}" \
    --query 'app.appId' \
    --output text)
else
  log "Reusing existing Amplify app ${APP_ID}"
fi

BRANCH_EXISTS=$(aws amplify list-branches \
  --app-id "${APP_ID}" \
  --region "${REGION}" \
  --query "branches[?branchName=='${AMPLIFY_BRANCH}']|[0].branchName" \
  --output text)

if [ -z "${BRANCH_EXISTS}" ] || [ "${BRANCH_EXISTS}" = "None" ]; then
  log "Creating branch ${AMPLIFY_BRANCH}"
  aws amplify create-branch \
    --app-id "${APP_ID}" \
    --branch-name "${AMPLIFY_BRANCH}" \
    --stage PRODUCTION \
    --enable-auto-build \
    --environment-variables DEPLOY_TARGET=amplify \
    --region "${REGION}" >/dev/null
else
  log "Updating branch ${AMPLIFY_BRANCH}"
  aws amplify update-branch \
    --app-id "${APP_ID}" \
    --branch-name "${AMPLIFY_BRANCH}" \
    --stage PRODUCTION \
    --enable-auto-build \
    --environment-variables DEPLOY_TARGET=amplify \
    --region "${REGION}" >/dev/null
fi

log "Ensuring domain association for ${ROOT_DOMAIN}"
if aws amplify get-domain-association \
  --app-id "${APP_ID}" \
  --domain-name "${ROOT_DOMAIN}" \
  --region "${REGION}" >/dev/null 2>&1; then
  set +e
  UPDATE_OUTPUT=$(aws amplify update-domain-association \
    --app-id "${APP_ID}" \
    --domain-name "${ROOT_DOMAIN}" \
    --sub-domain-settings "prefix=${SUBDOMAIN_PREFIX},branchName=${AMPLIFY_BRANCH}" \
    --certificate-settings type=AMPLIFY_MANAGED \
    --region "${REGION}" 2>&1 >/dev/null)
  UPDATE_EXIT=$?
  set -e

  if [ "${UPDATE_EXIT}" -ne 0 ]; then
    if echo "${UPDATE_OUTPUT}" | grep -qi "certificate is updating"; then
      log "Domain association update is temporarily locked by certificate update; continuing to wait."
    else
      echo "${UPDATE_OUTPUT}" >&2
      exit 1
    fi
  fi
else
  aws amplify create-domain-association \
    --app-id "${APP_ID}" \
    --domain-name "${ROOT_DOMAIN}" \
    --sub-domain-settings "prefix=${SUBDOMAIN_PREFIX},branchName=${AMPLIFY_BRANCH}" \
    --certificate-settings type=AMPLIFY_MANAGED \
    --region "${REGION}" >/dev/null
fi

DOMAIN_AVAILABLE=0
for attempt in $(seq 1 60); do
  sync_domain_dns_records "${APP_ID}" "${HOSTED_ZONE_ID}"

  DOMAIN_STATUS=$(aws amplify get-domain-association \
    --app-id "${APP_ID}" \
    --domain-name "${ROOT_DOMAIN}" \
    --region "${REGION}" \
    --query 'domainAssociation.domainStatus' \
    --output text)

  log "Domain status (attempt ${attempt}): ${DOMAIN_STATUS}"

  if [ "${DOMAIN_STATUS}" = "AVAILABLE" ]; then
    DOMAIN_AVAILABLE=1
    break
  fi

  if [ "${DOMAIN_STATUS}" = "FAILED" ] || [ "${DOMAIN_STATUS}" = "UPDATE_FAILED" ]; then
    log "Domain association failed with status ${DOMAIN_STATUS}"
    exit 1
  fi

  sleep 20
done

if [ "${DOMAIN_AVAILABLE}" -ne 1 ]; then
  log "Timed out waiting for domain association to become AVAILABLE"
  exit 1
fi

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  log "Updating GitHub repository variables"
  gh variable set AWS_REGION --body "${REGION}" -R "${REPO_SLUG}" >/dev/null
  gh variable set AMPLIFY_BRANCH --body "${AMPLIFY_BRANCH}" -R "${REPO_SLUG}" >/dev/null
  gh variable set AMPLIFY_APP_ID --body "${APP_ID}" -R "${REPO_SLUG}" >/dev/null
fi

log "Setup complete"
log "AMPLIFY_APP_ID=${APP_ID}"
