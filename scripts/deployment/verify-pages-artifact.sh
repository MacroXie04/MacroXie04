#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: $0 <artifact-directory> <expected-commit-sha> <expected-run-id>" >&2
}

if (( $# != 3 )); then
  usage
  exit 64
fi

artifact_dir=$1
expected_sha=$2
expected_run_id=$3

if [[ ! "$expected_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Expected commit SHA must be 40 lowercase hexadecimal characters." >&2
  exit 65
fi

if [[ ! "$expected_run_id" =~ ^[1-9][0-9]*$ ]]; then
  echo "Expected workflow run ID must be a positive integer." >&2
  exit 65
fi

if [[ ! -d "$artifact_dir" ]]; then
  echo "Pages artifact directory does not exist: $artifact_dir" >&2
  exit 66
fi

if [[ -L "$artifact_dir" ]]; then
  echo "Pages artifact directory must not be a symbolic link." >&2
  exit 65
fi

metadata_path="$artifact_dir/deploy-meta.json"
checksums_path="$artifact_dir/SHA256SUMS"

if [[ ! -f "$metadata_path" || -L "$metadata_path" ]]; then
  echo "Missing regular deploy metadata file: $metadata_path" >&2
  exit 66
fi

if [[ ! -f "$checksums_path" || -L "$checksums_path" ]]; then
  echo "Missing regular checksum manifest: $checksums_path" >&2
  exit 66
fi

if find "$artifact_dir" -type l -print -quit | grep -q .; then
  echo "Pages artifacts must not contain symbolic links." >&2
  exit 65
fi

jq -e \
  --arg sha "$expected_sha" \
  --arg run_id "$expected_run_id" \
  'type == "object" and (keys | sort) == ["commitSha", "runId"] and .commitSha == $sha and .runId == $run_id' \
  "$metadata_path" >/dev/null || {
  echo "deploy-meta.json does not match the trusted upstream commit and workflow run." >&2
  exit 65
}

verification_tmp_dir=$(mktemp -d "${TMPDIR:-/tmp}/pages-artifact.XXXXXX")
trap 'rm -rf "$verification_tmp_dir"' EXIT
checksum_paths_file="$verification_tmp_dir/checksum-paths"
artifact_paths_file="$verification_tmp_dir/artifact-paths"
sorted_checksum_paths_file="$verification_tmp_dir/checksum-paths.sorted"
sorted_artifact_paths_file="$verification_tmp_dir/artifact-paths.sorted"
: > "$checksum_paths_file"
: > "$artifact_paths_file"

while IFS= read -r checksum_line; do
  if [[ ! "$checksum_line" =~ ^[0-9a-f]{64}\ \ (.+)$ ]]; then
    echo "Malformed entry in SHA256SUMS." >&2
    exit 65
  fi

  checksum_path=${BASH_REMATCH[1]}
  if [[
    -z "$checksum_path" ||
    "$checksum_path" == /* ||
    "$checksum_path" == ./* ||
    "$checksum_path" == ".." ||
    "$checksum_path" == ../* ||
    "$checksum_path" == */../* ||
    "$checksum_path" == *\\* ||
    "$checksum_path" == *$'\n'* ||
    "$checksum_path" == *$'\r'* ||
    "$checksum_path" == "SHA256SUMS"
  ]]; then
    echo "Unsafe path in SHA256SUMS: $checksum_path" >&2
    exit 65
  fi

  printf '%s\n' "$checksum_path" >> "$checksum_paths_file"
done < "$checksums_path"

while IFS= read -r -d '' artifact_path; do
  relative_path=${artifact_path#"$artifact_dir"/}
  if [[ "$relative_path" != "SHA256SUMS" ]]; then
    printf '%s\n' "$relative_path" >> "$artifact_paths_file"
  fi
done < <(find "$artifact_dir" -type f -print0)

LC_ALL=C sort "$checksum_paths_file" > "$sorted_checksum_paths_file"
LC_ALL=C sort "$artifact_paths_file" > "$sorted_artifact_paths_file"

if ! cmp -s "$sorted_checksum_paths_file" "$sorted_artifact_paths_file"; then
  echo "SHA256SUMS does not cover every regular artifact file exactly once." >&2
  exit 65
fi

(
  cd "$artifact_dir"
  sha256sum -c SHA256SUMS
)

echo "Verified Pages artifact for commit $expected_sha."
