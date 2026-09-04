#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: $0 <base-url> <expected-commit-sha> <expected-run-id|-> <preview|production> [attempts] [delay-seconds] [required|optional]" >&2
}

if (( $# < 4 || $# > 7 )); then
  usage
  exit 64
fi

base_url=${1%/}
expected_sha=$2
expected_run_id=$3
environment=$4
attempts=${5:-8}
delay_seconds=${6:-5}
metadata_policy=${7:-required}

if [[ ! "$base_url" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
  echo "Smoke-test URL must be an HTTPS origin without a path or query." >&2
  exit 65
fi

if [[ ! "$expected_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Expected commit SHA must be 40 lowercase hexadecimal characters." >&2
  exit 65
fi

if [[ "$expected_run_id" != "-" && ! "$expected_run_id" =~ ^[1-9][0-9]*$ ]]; then
  echo "Expected workflow run ID must be a positive integer or '-' when unavailable." >&2
  exit 65
fi

if [[ "$environment" != preview && "$environment" != production ]]; then
  echo "Environment must be preview or production." >&2
  exit 65
fi

if [[ "$metadata_policy" != required && "$metadata_policy" != optional ]]; then
  echo "Metadata policy must be required or optional." >&2
  exit 65
fi

if [[ ! "$attempts" =~ ^[1-9][0-9]*$ || ! "$delay_seconds" =~ ^[0-9]+$ ]]; then
  echo "Attempts must be positive and delay must be non-negative." >&2
  exit 65
fi

production_url=${PRODUCTION_URL:-}
if [[ "$environment" == production ]]; then
  production_url=${production_url%/}
  if [[ ! "$production_url" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
    echo "PRODUCTION_URL must be set to a canonical HTTPS origin for production checks." >&2
    exit 65
  fi
fi

tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/pages-smoke.XXXXXX")
trap 'rm -rf "$tmp_dir"' EXIT

curl_common=(
  --silent
  --show-error
  --location
  --connect-timeout 10
  --max-time 30
  --retry 3
  --retry-all-errors
  --retry-delay 2
  --header "Cache-Control: no-cache"
)

metadata_ready=false
metadata_object_seen=false
legacy_compatibility=false
for (( attempt = 1; attempt <= attempts; attempt++ )); do
  metadata_url="$base_url/deploy-meta.json?deploy-check=$expected_sha"
  if curl "${curl_common[@]}" --fail --output "$tmp_dir/deploy-meta.json" "$metadata_url"; then
    if jq -e 'type == "object"' "$tmp_dir/deploy-meta.json" >/dev/null 2>&1; then
      metadata_object_seen=true
      if jq -e \
        --arg sha "$expected_sha" \
        --arg run_id "$expected_run_id" \
        '
          type == "object" and
          (keys | sort) == ["commitSha", "runId"] and
          .commitSha == $sha and
          (.runId | type) == "string" and
          (.runId | test("^[1-9][0-9]*$")) and
          ($run_id == "-" or .runId == $run_id)
        ' \
        "$tmp_dir/deploy-meta.json" >/dev/null; then
        metadata_ready=true
        break
      fi
    fi
  fi

  if (( attempt < attempts )); then
    echo "Waiting for $base_url to serve the expected deployment metadata (attempt $attempt/$attempts)."
    sleep "$delay_seconds"
  fi
done

if [[ "$metadata_ready" != true ]]; then
  if [[ "$metadata_policy" == required || "$metadata_object_seen" == true ]]; then
    echo "$base_url did not serve strict deploy metadata for commit $expected_sha and run $expected_run_id." >&2
    exit 1
  fi
  echo "Warning: deploy metadata was unavailable; continuing with legacy rollback smoke checks." >&2
  legacy_compatibility=true
fi

production_assertion_failed() {
  local message=$1
  if [[ "$legacy_compatibility" == true ]]; then
    echo "Warning: $message Legacy rollback compatibility is active." >&2
    return 0
  fi
  echo "$message" >&2
  return 1
}

cache_buster="deploy-check=$expected_sha"
curl "${curl_common[@]}" --fail --dump-header "$tmp_dir/index.headers" --output "$tmp_dir/index.html" "$base_url/?$cache_buster"

grep -Eq "<title[^>]*>[[:space:]]*Hongzhe Xie[[:space:]]*</title>" "$tmp_dir/index.html" || {
  echo "Homepage title is not 'Hongzhe Xie'." >&2
  exit 1
}

grep -Eiq "<div[^>]+id=['\"]root['\"]" "$tmp_dir/index.html" || {
  echo "Homepage is missing the React root element." >&2
  exit 1
}

if [[ "$environment" == preview ]]; then
  tr -d '\r' < "$tmp_dir/index.headers" | grep -Eiq '^x-robots-tag:.*noindex' || {
    echo "Preview deployment is missing X-Robots-Tag: noindex." >&2
    exit 1
  }
fi

curl "${curl_common[@]}" --fail --output "$tmp_dir/manifest.json" "$base_url/manifest.json?$cache_buster"
jq -e '
  type == "object" and
  .name == "Hongzhe Xie" and
  .short_name == "Hongzhe Xie" and
  .start_url == "." and
  .display == "standalone" and
  .theme_color == "#1e1e1e" and
  .background_color == "#1e1e1e"
' "$tmp_dir/manifest.json" >/dev/null || {
  echo "manifest.json does not match the production web-app contract." >&2
  exit 1
}

grep -Eo "(src|href)=['\"][^'\"]+\.(js|css)(\?[^'\"]*)?['\"]" "$tmp_dir/index.html" \
  > "$tmp_dir/asset-attributes.txt" || true
sed -E "s/^(src|href)=['\"]([^'\"]+)['\"]$/\2/" "$tmp_dir/asset-attributes.txt" \
  | LC_ALL=C sort -u > "$tmp_dir/assets.txt"

if [[ ! -s "$tmp_dir/assets.txt" ]]; then
  echo "Homepage did not reference any JavaScript or CSS assets." >&2
  exit 1
fi

while IFS= read -r asset_path; do
  case "$asset_path" in
    https://*) asset_url=$asset_path ;;
    //*) asset_url="https:$asset_path" ;;
    /*) asset_url="$base_url$asset_path" ;;
    *) asset_url="$base_url/$asset_path" ;;
  esac
  curl "${curl_common[@]}" --fail --output /dev/null "$asset_url"
done < "$tmp_dir/assets.txt"

curl "${curl_common[@]}" --fail \
  --output "$tmp_dir/filesystem.json" "$base_url/data/terminal/filesystem.json?$cache_buster"
resume_filename=$(jq -er '.resumePdf.filename | select(type == "string" and test("^[A-Za-z0-9._-]+[.]pdf$"))' "$tmp_dir/filesystem.json")
resume_sha=$(jq -er '.resumePdf.sha256 | select(type == "string" and test("^[0-9a-f]{64}$"))' "$tmp_dir/filesystem.json")
resume_bytes=$(jq -er '.resumePdf.bytes | select(type == "number" and . > 0 and floor == .) | tostring' "$tmp_dir/filesystem.json")
curl "${curl_common[@]}" --fail --output "$tmp_dir/resume.pdf" "$base_url/resume/$resume_filename?$cache_buster"

if [[ "$(head -c 5 "$tmp_dir/resume.pdf")" != "%PDF-" ]]; then
  echo "Resume asset is not a PDF." >&2
  exit 1
fi
actual_resume_sha=$(sha256sum "$tmp_dir/resume.pdf" | awk '{print $1}')
actual_resume_bytes=$(wc -c < "$tmp_dir/resume.pdf" | tr -d '[:space:]')
if [[ "$actual_resume_sha" != "$resume_sha" || "$actual_resume_bytes" != "$resume_bytes" ]]; then
  echo "Resume PDF does not match its filesystem manifest." >&2
  exit 1
fi

if [[ "$environment" == production ]]; then
  canonical_tag=$(grep -Eio "<link[^>]+rel=['\"]canonical['\"][^>]*>" "$tmp_dir/index.html" | head -n 1 || true)
  if [[ "$canonical_tag" != *"href=\"$production_url/\""* && "$canonical_tag" != *"href='$production_url/'"* ]]; then
    production_assertion_failed "Homepage canonical URL does not match PRODUCTION_URL."
  fi
  og_url_tag=$(
    grep -Eio "<meta[^>]*>" "$tmp_dir/index.html" \
      | grep -Ei "property=['\"]og:url['\"]" \
      | head -n 1 || true
  )
  if [[ "$og_url_tag" != *"content=\"$production_url/\""* && "$og_url_tag" != *"content='$production_url/'"* ]]; then
    production_assertion_failed "Homepage Open Graph URL does not match PRODUCTION_URL."
  fi

  if curl "${curl_common[@]}" --fail --output "$tmp_dir/robots.txt" "$base_url/robots.txt?$cache_buster"; then
    grep -Eiq '^User-agent:[[:space:]]*\*[[:space:]]*$' "$tmp_dir/robots.txt" || {
      production_assertion_failed "robots.txt is missing the wildcard user agent."
    }
    grep -Eiq '^Allow:[[:space:]]*/[[:space:]]*$' "$tmp_dir/robots.txt" || {
      production_assertion_failed "robots.txt does not allow the production site."
    }
    grep -Fqi "Sitemap: $production_url/sitemap.xml" "$tmp_dir/robots.txt" || {
      production_assertion_failed "robots.txt does not reference the canonical sitemap."
    }
  else
    production_assertion_failed "robots.txt could not be downloaded."
  fi

  if curl "${curl_common[@]}" --fail --output "$tmp_dir/sitemap.xml" "$base_url/sitemap.xml?$cache_buster"; then
    grep -Fq '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' "$tmp_dir/sitemap.xml" || {
      production_assertion_failed "sitemap.xml is missing its URL set."
    }
    sitemap_location_count=$(grep -Eoc '<loc>[^<]+</loc>' "$tmp_dir/sitemap.xml" || true)
    if [[ "$sitemap_location_count" != "1" ]]; then
      production_assertion_failed "sitemap.xml must contain exactly one location."
    fi
    grep -Fq "<loc>$production_url/</loc>" "$tmp_dir/sitemap.xml" || {
      production_assertion_failed "sitemap.xml does not contain the canonical production URL."
    }
  else
    production_assertion_failed "sitemap.xml could not be downloaded."
  fi
fi

echo "Smoke checks passed for $base_url ($expected_sha)."
