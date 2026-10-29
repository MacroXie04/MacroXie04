import assert from 'node:assert/strict';
import test from 'node:test';
import { APP_ID, ENVIRONMENT, REPOSITORY, REPOSITORY_ID, githubClient,
  recordResult, selectTrigger, syncCommit, validateCheck } from './sync-cloudflare-status.mjs';

const SHA = 'a'.repeat(40);
const APP = { id: APP_ID, slug: 'cloudflare-workers-and-pages' };
const UUID = '40c83646-4f03-46de-a3b4-3e053fec5a4e';
const URL = 'https://40c83646.dev-aqz.pages.dev';
const suite = () => ({ id: 20, app: APP, head_branch: 'main', head_sha: SHA,
  repository: { id: REPOSITORY_ID, full_name: REPOSITORY } });
const check = () => ({ id: 30, app: APP, name: 'Cloudflare Pages', check_suite: { id: 20 },
  head_sha: SHA, status: 'completed', conclusion: 'success', completed_at: '2026-10-29T12:53:57Z',
  details_url: `https://dash.cloudflare.com/?to=/${'1'.repeat(32)}/pages/view/dev/${UUID}`,
  output: { summary: `<a href='${URL}'>Preview URL</a>` } });
const result = () => validateCheck(check(), suite(), SHA);
const repository = { id: REPOSITORY_ID, full_name: REPOSITORY };

function memoryClient({ initial = [], statuses = {}, checkRuns = [check()], checkSuite = suite(),
  comparison = 'identical' } = {}) {
  const deployments = structuredClone(initial);
  const history = structuredClone(statuses);
  const writes = [];
  let pendingReads = 0;
  const client = {
    deployments, history, writes,
    async request(path, method = 'GET', body) {
      if (method === 'POST') {
        writes.push({ path, body });
        if (path.endsWith('/deployments')) {
          const deployment = { ...body, sha: body.ref, id: 1000 + deployments.length };
          deployments.unshift(deployment);
          return structuredClone(deployment);
        }
        const id = path.match(/deployments\/(\d+)\/statuses$/)?.[1];
        assert.ok(id, `Unexpected POST ${path}`);
        (history[id] ??= []).unshift(body);
        return { id: writes.length, ...body };
      }
      if (path.includes('/compare/')) return { status: comparison };
      if (path.endsWith('/git/ref/heads/main')) return { object: { sha: SHA } };
      if (path.includes('/commits/')) {
        const list = typeof checkRuns === 'function' ? checkRuns(pendingReads++) : checkRuns;
        return { check_runs: structuredClone(list) };
      }
      if (/\/check-runs\/\d+$/.test(path)) return structuredClone(checkRuns[0]);
      if (path.includes('/check-suites/')) return structuredClone(checkSuite);
      if (path.includes('/statuses?')) {
        const id = path.match(/deployments\/(\d+)\/statuses/)?.[1];
        return structuredClone(history[id] ?? []);
      }
      if (path.includes('/deployments?')) return structuredClone(deployments);
      throw new Error(`Unexpected GET ${path}`);
    },
  };
  return client;
}

test('accepts only official production checks with matching immutable URLs', () => {
  const verified = result();
  assert.equal(verified.environmentUrl, URL);
  assert.equal(verified.state, 'success');
  assert.equal(verified.cloudflareDeploymentId, UUID);
  assert.ok(verified.logUrl.startsWith('https://dash.cloudflare.com/'));
  assert.equal(validateCheck(check(), { ...suite(), head_branch: 'feature' }, SHA), null);
});

test('rejects forged Apps, forks, mismatched SHAs/suites, and foreign projects or URLs', () => {
  for (const [c, s] of [
    [{ ...check(), app: { ...APP, id: 123 } }, suite()],
    [check(), { ...suite(), app: { ...APP, slug: 'fake-cloudflare' } }],
    [check(), { ...suite(), repository: { ...repository, id: 123 } }],
    [{ ...check(), head_sha: 'b'.repeat(40) }, suite()],
    [check(), { ...suite(), id: 99 }],
    [{ ...check(), details_url: check().details_url.replace('/dev/', '/another-project/') }, suite()],
    [{ ...check(), details_url: check().details_url.replace('dash.cloudflare.com', 'evil.example') }, suite()],
    [{ ...check(), output: { summary: `<a href='https://evil.example'>Go</a>` } }, suite()],
    [{ ...check(), output: { summary: `<a href='https://11111111.dev-aqz.pages.dev'>Go</a>` } }, suite()],
  ]) assert.throws(() => validateCheck(c, s, SHA));
});

test('does not invent publications for unfinished, skipped, or neutral checks', () => {
  for (const c of [
    { ...check(), status: 'in_progress', conclusion: null },
    { ...check(), conclusion: 'skipped' },
    { ...check(), conclusion: 'neutral' },
  ]) assert.equal(validateCheck(c, suite(), SHA), null);
});

test('records failed checks without publishing an unrelated visit URL', async () => {
  const failed = validateCheck({ ...check(), conclusion: 'failure', output: {} }, suite(), SHA);
  const client = memoryClient();
  await recordResult(client, failed);
  assert.equal(client.writes[1].body.state, 'failure');
  assert.equal(client.writes[1].body.environment_url, undefined);
});

test('validates trigger provenance and rejects PR, fork, and non-main dispatch inputs', () => {
  assert.deepEqual(selectTrigger('workflow_dispatch', { repository }, SHA, 'refs/heads/main'), { sha: SHA });
  const event = { repository, action: 'completed', workflow_run: { workflow_id: 342066728,
    head_repository: repository, head_branch: 'main', head_sha: SHA, event: 'push' } };
  assert.deepEqual(selectTrigger('workflow_run', event), { sha: SHA });
  assert.throws(() => selectTrigger('workflow_dispatch', { repository }, SHA, 'refs/heads/topic'));
  assert.throws(() => selectTrigger('workflow_dispatch', { repository }, 'main', 'refs/heads/main'));
  assert.throws(() => selectTrigger('workflow_run', { ...event, workflow_run: { ...event.workflow_run, event: 'pull_request' } }));
  assert.throws(() => selectTrigger('workflow_run', { ...event, workflow_run: { ...event.workflow_run, head_repository: { id: 123 } } }));
  assert.throws(() => selectTrigger('check_run', { repository, action: 'completed', check_run: { ...check(), app: { id: 123 } } }));
});

test('records the exact SHA and evidence, and replays without duplicate records/statuses', async () => {
  const client = memoryClient();
  await syncCommit(client, { sha: SHA }, { attempts: 1 });
  assert.equal(client.deployments.length, 1);
  assert.equal(client.deployments[0].sha, SHA);
  assert.equal(client.deployments[0].environment, ENVIRONMENT);
  assert.equal(client.deployments[0].production_environment, true);
  assert.equal(client.deployments[0].auto_merge, false);
  assert.deepEqual(client.deployments[0].required_contexts, []);
  assert.equal(client.writes[1].body.environment_url, URL);
  const replay = await syncCommit(client, { sha: SHA }, { attempts: 1 });
  assert.equal(replay.duplicate, true);
  assert.equal(client.writes.length, 2);
});

test('rejects commits outside main and preview checks without writing deployments', async () => {
  const foreign = memoryClient({ comparison: 'diverged' });
  await assert.rejects(syncCommit(foreign, { sha: SHA }), /not on main/);
  assert.equal(foreign.writes.length, 0);
  const preview = memoryClient({ checkSuite: { ...suite(), head_branch: 'topic' } });
  assert.equal((await syncCommit(preview, { sha: SHA }, { attempts: 1 })).skipped, true);
  assert.equal(preview.writes.length, 0);
});

test('waits for Cloudflare completion and fails without a record on timeout', async () => {
  const waits = [];
  const client = memoryClient({ checkRuns: read => read === 0 ? [] : [check()] });
  await syncCommit(client, { sha: SHA }, { attempts: 2, wait: async ms => waits.push(ms) });
  assert.deepEqual(waits, [15000]);
  const missing = memoryClient({ checkRuns: [] });
  await assert.rejects(syncCommit(missing, { sha: SHA }, { attempts: 1 }), /did not finish/);
  assert.equal(missing.writes.length, 0);
});

test('late historical results and retries never reactivate an older publication', async () => {
  const client = memoryClient();
  const older = result();
  const newer = { ...result(), sha: 'b'.repeat(40), checkId: 31, completedAt: '2026-10-29T13:00:00Z' };
  await recordResult(client, newer);
  const latestId = client.deployments[0].id;
  await recordResult(client, older);
  const oldId = client.deployments[0].id;
  assert.equal(client.history[latestId][0].state, 'success');
  assert.equal(client.history[oldId][0].state, 'inactive');
  const count = client.writes.length;
  await recordResult(client, older);
  assert.equal(client.history[oldId][0].state, 'inactive');
  assert.equal(client.writes.length, count);
});

test('a successful new release supersedes the old success; failed attempts do not', async () => {
  const client = memoryClient();
  await recordResult(client, result());
  const oldId = client.deployments[0].id;
  await recordResult(client, { ...result(), state: 'failure', conclusion: 'failure', environmentUrl: null,
    checkId: 31, completedAt: '2026-10-29T13:00:00Z' });
  assert.equal(client.history[oldId][0].state, 'success');
  await recordResult(client, { ...result(), checkId: 32, completedAt: '2026-10-29T13:01:00Z' });
  assert.equal(client.history[oldId][0].state, 'inactive');
});

test('a retry resumes interrupted supersession without adding another success', async () => {
  const client = memoryClient();
  await recordResult(client, result());
  const oldId = client.deployments[0].id;
  const next = { ...result(), checkId: 31, completedAt: '2026-10-29T13:00:00Z' };
  await recordResult(client, next);
  client.history[oldId].shift(); // Model interruption before the old status was written.
  const before = client.writes.length;
  await recordResult(client, next);
  assert.equal(client.history[oldId][0].state, 'inactive');
  assert.equal(client.writes.length, before + 1);
});

test('a reused Cloudflare check ID still records a distinct later publication', async () => {
  const client = memoryClient();
  await recordResult(client, result());
  const previousId = client.deployments[0].id;
  const republished = { ...check(), completed_at: '2026-10-29T13:00:00Z',
    details_url: check().details_url.replace('40c83646-', '11111111-'),
    output: { summary: "<a href='https://11111111.dev-aqz.pages.dev'>Preview URL</a>" } };
  await recordResult(client, validateCheck(republished, suite(), SHA));
  assert.equal(client.deployments.length, 2);
  assert.equal(client.history[previousId][0].state, 'inactive');
  assert.equal(client.history[client.deployments[0].id][0].environment_url,
    'https://11111111.dev-aqz.pages.dev');
});

test('GitHub credentials cannot be sent to another host or followed through redirects', async () => {
  const requests = [];
  const client = githubClient('test-token', async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({}) };
  });
  await assert.rejects(client.request('https://evil.example'), /Unexpected/);
  await client.request(`/repos/${REPOSITORY}/check-runs/30`);
  assert.equal(requests.length, 1);
  assert.ok(requests[0].url.startsWith('https://api.github.com/repos/'));
  assert.equal(requests[0].options.redirect, 'error');
});
