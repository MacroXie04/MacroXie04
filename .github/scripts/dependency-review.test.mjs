import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchDependencyChanges,
  renderFailureSummary,
  renderReviewSummary,
  reviewDependencyChanges,
  validateDependencyChanges,
} from "./dependency-review.mjs";

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);

function dependency({ changeType = "added", severity, scope = "runtime" } = {}) {
  return {
    change_type: changeType,
    ecosystem: "npm",
    license: "MIT",
    manifest: "pages/package-lock.json",
    name: "example-package",
    package_url: "pkg:npm/example-package@1.0.0",
    scope,
    source_repository_url: "https://github.com/example/example-package",
    version: "1.0.0",
    vulnerabilities: severity
      ? [
          {
            advisory_ghsa_id: "GHSA-aaaa-bbbb-cccc",
            advisory_summary: "Example advisory",
            advisory_url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc",
            severity,
          },
        ]
      : [],
  };
}

test("passes when no dependencies changed", () => {
  const result = reviewDependencyChanges(validateDependencyChanges([]));

  assert.equal(result.passed, true);
  assert.equal(result.blockedCount, 0);
  assert.match(renderReviewSummary(result), /Result: Passed/);
});

test("allows low and moderate findings", () => {
  const changes = validateDependencyChanges([
    dependency({ severity: "low" }),
    dependency({ severity: "moderate", scope: "development" }),
  ]);

  assert.equal(reviewDependencyChanges(changes).passed, true);
});

test("blocks high and critical findings in every dependency scope", () => {
  const changes = validateDependencyChanges([
    dependency({ severity: "high", scope: "runtime" }),
    dependency({ severity: "critical", scope: "development" }),
    dependency({ severity: "high", scope: "unknown" }),
  ]);
  const result = reviewDependencyChanges(changes);

  assert.equal(result.passed, false);
  assert.equal(result.blockedCount, 3);
  assert.match(renderReviewSummary(result), /Result: Failed/);
});

test("does not block removal of a vulnerable dependency", () => {
  const changes = validateDependencyChanges([
    dependency({ changeType: "removed", severity: "critical" }),
  ]);
  const result = reviewDependencyChanges(changes);

  assert.equal(result.passed, true);
  assert.equal(result.removedCount, 1);
});

test("fails closed on an invalid API schema", () => {
  assert.throws(
    () => validateDependencyChanges({ changes: [] }),
    /response must be an array/,
  );
  assert.throws(
    () => validateDependencyChanges([dependency({ severity: "unknown" })]),
    /severity is invalid/,
  );
});

test("retries transient API responses and validates the successful response", async () => {
  const statuses = [503, 200];
  const delays = [];
  const changes = await fetchDependencyChanges({
    apiUrl: "https://api.github.com",
    attempts: 3,
    baseSha: SHA_A,
    fetchImpl: async () => {
      const status = statuses.shift();
      return new Response(status === 200 ? JSON.stringify([dependency()]) : "", {
        headers: { "Content-Type": "application/json" },
        status,
      });
    },
    headSha: SHA_B,
    repository: "owner/repository",
    retryDelay: async (milliseconds) => delays.push(milliseconds),
    token: "test-token",
  });

  assert.equal(changes.length, 1);
  assert.deepEqual(delays, [2_000]);
});

test("fails after bounded retries when the API remains unavailable", async () => {
  let attempts = 0;

  await assert.rejects(
    fetchDependencyChanges({
      apiUrl: "https://api.github.com",
      attempts: 3,
      baseSha: SHA_A,
      fetchImpl: async () => {
        attempts += 1;
        return new Response("", { status: 503 });
      },
      headSha: SHA_B,
      repository: "owner/repository",
      retryDelay: async () => {},
      token: "test-token",
    }),
    /HTTP 503/,
  );

  assert.equal(attempts, 3);
});

test("does not retry a non-transient API rejection", async () => {
  let attempts = 0;

  await assert.rejects(
    fetchDependencyChanges({
      apiUrl: "https://api.github.com",
      attempts: 3,
      baseSha: SHA_A,
      fetchImpl: async () => {
        attempts += 1;
        return new Response("", { status: 403 });
      },
      headSha: SHA_B,
      repository: "owner/repository",
      retryDelay: async () => {},
      token: "test-token",
    }),
    /HTTP 403/,
  );

  assert.equal(attempts, 1);
});

test("rejects malformed JSON without retrying", async () => {
  let attempts = 0;

  await assert.rejects(
    fetchDependencyChanges({
      apiUrl: "https://api.github.com",
      attempts: 3,
      baseSha: SHA_A,
      fetchImpl: async () => {
        attempts += 1;
        return new Response("not-json", {
          headers: { "Content-Type": "application/json" },
          status: 200,
        });
      },
      headSha: SHA_B,
      repository: "owner/repository",
      retryDelay: async () => {},
      token: "test-token",
    }),
    /invalid JSON/,
  );

  assert.equal(attempts, 1);
});

test("all generated summaries are free of emoji", () => {
  const passedSummary = renderReviewSummary(
    reviewDependencyChanges(validateDependencyChanges([])),
  );
  const blockedSummary = renderReviewSummary(
    reviewDependencyChanges(
      validateDependencyChanges([dependency({ severity: "critical" })]),
    ),
  );
  const failedSummary = renderFailureSummary("Service unavailable");

  assert.doesNotMatch(passedSummary, /\p{Extended_Pictographic}/u);
  assert.doesNotMatch(blockedSummary, /\p{Extended_Pictographic}/u);
  assert.doesNotMatch(failedSummary, /\p{Extended_Pictographic}/u);
});
