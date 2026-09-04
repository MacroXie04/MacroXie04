#!/usr/bin/env node

import { appendFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ALLOWED_CHANGE_TYPES = new Set(["added", "removed"]);
const ALLOWED_SCOPES = new Set(["development", "runtime", "unknown"]);
const ALLOWED_SEVERITIES = new Set(["critical", "high", "low", "moderate"]);
const BLOCKING_SEVERITIES = new Set(["critical", "high"]);
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function assertObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}

function validateSha(value, label) {
  if (!/^[0-9a-f]{40}$/i.test(value ?? "")) {
    throw new Error(`${label} must be a 40-character commit SHA.`);
  }
  return value.toLowerCase();
}

export function validateDependencyChanges(payload) {
  if (!Array.isArray(payload)) {
    throw new Error("Dependency Review API response must be an array.");
  }

  return payload.map((change, changeIndex) => {
    const changeLabel = `Dependency change ${changeIndex}`;
    assertObject(change, changeLabel);

    if (!ALLOWED_CHANGE_TYPES.has(change.change_type)) {
      throw new Error(`${changeLabel}.change_type is invalid.`);
    }

    const scope = change.scope ?? "unknown";
    if (!ALLOWED_SCOPES.has(scope)) {
      throw new Error(`${changeLabel}.scope is invalid.`);
    }

    const vulnerabilities = change.vulnerabilities ?? [];
    if (!Array.isArray(vulnerabilities)) {
      throw new Error(`${changeLabel}.vulnerabilities must be an array.`);
    }

    return {
      changeType: change.change_type,
      ecosystem: assertString(change.ecosystem, `${changeLabel}.ecosystem`),
      manifest: assertString(change.manifest, `${changeLabel}.manifest`),
      name: assertString(change.name, `${changeLabel}.name`),
      packageUrl: assertString(change.package_url, `${changeLabel}.package_url`),
      scope,
      version: assertString(change.version, `${changeLabel}.version`),
      vulnerabilities: vulnerabilities.map((vulnerability, vulnerabilityIndex) => {
        const vulnerabilityLabel = `${changeLabel}.vulnerabilities[${vulnerabilityIndex}]`;
        assertObject(vulnerability, vulnerabilityLabel);

        if (!ALLOWED_SEVERITIES.has(vulnerability.severity)) {
          throw new Error(`${vulnerabilityLabel}.severity is invalid.`);
        }

        return {
          advisoryId: assertString(
            vulnerability.advisory_ghsa_id,
            `${vulnerabilityLabel}.advisory_ghsa_id`,
          ),
          advisorySummary: assertString(
            vulnerability.advisory_summary,
            `${vulnerabilityLabel}.advisory_summary`,
          ),
          advisoryUrl: assertString(
            vulnerability.advisory_url,
            `${vulnerabilityLabel}.advisory_url`,
          ),
          severity: vulnerability.severity,
        };
      }),
    };
  });
}

export function reviewDependencyChanges(changes) {
  const additions = changes.filter((change) => change.changeType === "added");
  const removals = changes.filter((change) => change.changeType === "removed");
  const findings = additions.flatMap((change) =>
    change.vulnerabilities
      .filter((vulnerability) => BLOCKING_SEVERITIES.has(vulnerability.severity))
      .map((vulnerability) => ({ change, vulnerability })),
  );

  return {
    addedCount: additions.length,
    blockedCount: findings.length,
    changedCount: changes.length,
    findings,
    passed: findings.length === 0,
    removedCount: removals.length,
  };
}

function markdownCell(value) {
  return String(value).replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");
}

export function renderReviewSummary(result) {
  const lines = [
    "# Dependency Review",
    "",
    `Result: ${result.passed ? "Passed" : "Failed"}`,
    "",
    "| Check | Count |",
    "| --- | ---: |",
    `| Dependency changes | ${result.changedCount} |`,
    `| Added or updated dependencies | ${result.addedCount} |`,
    `| Removed dependencies | ${result.removedCount} |`,
    `| High or critical vulnerabilities introduced | ${result.blockedCount} |`,
    "",
  ];

  if (result.passed) {
    lines.push("No high or critical vulnerabilities were introduced.", "");
  } else {
    lines.push(
      "The following high or critical vulnerabilities were introduced:",
      "",
      "| Package | Version | Scope | Severity | Advisory |",
      "| --- | --- | --- | --- | --- |",
      ...result.findings.map(
        ({ change, vulnerability }) =>
          `| ${markdownCell(change.name)} | ${markdownCell(change.version)} | ${markdownCell(change.scope)} | ${markdownCell(vulnerability.severity)} | ${markdownCell(vulnerability.advisoryId)} |`,
      ),
      "",
    );
  }

  return lines.join("\n");
}

export function renderFailureSummary(message) {
  return [
    "# Dependency Review",
    "",
    "Result: Failed",
    "",
    `The dependency review could not complete: ${markdownCell(message)}`,
    "",
  ].join("\n");
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function fetchDependencyChanges({
  apiUrl,
  baseSha,
  fetchImpl = fetch,
  headSha,
  repository,
  retryDelay = wait,
  token,
  attempts = 3,
  timeoutMs = 30_000,
}) {
  const [owner, repo, ...extraParts] = repository?.split("/") ?? [];
  if (!owner || !repo || extraParts.length > 0) {
    throw new Error("GITHUB_REPOSITORY must have the form owner/repository.");
  }
  if (!token) {
    throw new Error("GITHUB_TOKEN is required for dependency review.");
  }
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error("Dependency review attempts must be a positive integer.");
  }

  const normalizedBaseSha = validateSha(baseSha, "Dependency review base SHA");
  const normalizedHeadSha = validateSha(headSha, "Dependency review head SHA");
  const baseUrl = new URL(apiUrl);
  const comparison = `${normalizedBaseSha}...${normalizedHeadSha}`;
  const endpoint = new URL(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/dependency-graph/compare/${comparison}`,
    baseUrl,
  );
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    console.log(`Dependency Review API attempt ${attempt}/${attempts}`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response;

    try {
      response = await fetchImpl(endpoint, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "MacroXie04-dependency-review",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: controller.signal,
      });
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("GitHub Dependency Review API request failed.");
    } finally {
      clearTimeout(timer);
    }

    if (response?.ok) {
      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error("GitHub Dependency Review API returned invalid JSON.");
      }
      return validateDependencyChanges(payload);
    }

    if (response) {
      const statusError = new Error(
        `GitHub Dependency Review API returned HTTP ${response.status}.`,
      );
      if (!RETRYABLE_STATUS_CODES.has(response.status)) {
        throw statusError;
      }
      lastError = statusError;
    }

    if (attempt < attempts) {
      await retryDelay(attempt * 2_000);
    }
  }

  throw lastError ?? new Error("GitHub Dependency Review API request failed.");
}

async function writeSummary(summary) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    throw new Error("GITHUB_STEP_SUMMARY is required in CI.");
  }
  await appendFile(summaryPath, summary, "utf8");
}

export async function main() {
  try {
    const changes = await fetchDependencyChanges({
      apiUrl: process.env.GITHUB_API_URL ?? "https://api.github.com",
      baseSha: process.env.DEPENDENCY_REVIEW_BASE_SHA,
      headSha: process.env.DEPENDENCY_REVIEW_HEAD_SHA,
      repository: process.env.GITHUB_REPOSITORY,
      token: process.env.GITHUB_TOKEN,
    });
    const result = reviewDependencyChanges(changes);
    await writeSummary(renderReviewSummary(result));

    if (!result.passed) {
      console.error(
        `Dependency Review detected ${result.blockedCount} high or critical vulnerability finding(s).`,
      );
      process.exitCode = 1;
      return;
    }

    console.log(
      `Dependency Review passed: ${result.addedCount} added or updated dependency change(s), no high or critical vulnerabilities introduced.`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected dependency review failure.";
    try {
      await writeSummary(renderFailureSummary(message));
    } catch (summaryError) {
      console.error(
        summaryError instanceof Error ? summaryError.message : "Could not write Dependency Review summary.",
      );
    }
    console.error(message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
