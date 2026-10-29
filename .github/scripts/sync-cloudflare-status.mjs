import { appendFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const REPOSITORY = 'MacroXie04/MacroXie04';
export const REPOSITORY_ID = 1084109393;
export const APP_ID = 85455;
export const ENVIRONMENT = 'Cloudflare Production';
const SOURCE = 'cloudflare-github-app-status-v1';
const TASK = 'record-cloudflare-publication';
const PREFIX = `/repos/${REPOSITORY}`;
const SHA = /^[a-f0-9]{40}$/;
const UUID = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';

export function validateSha(value) {
  if (!SHA.test(value ?? '')) throw new Error('Expected a full lowercase commit SHA.');
  return value;
}

function officialApp(app) {
  return app?.id === APP_ID && app.slug === 'cloudflare-workers-and-pages';
}

export function validateCheck(check, suite, sha) {
  if (!officialApp(check.app) || !officialApp(suite.app) || check.name !== 'Cloudflare Pages') {
    throw new Error('Check was not published by the official Cloudflare App.');
  }
  if (check.head_sha !== sha || suite.head_sha !== sha || check.check_suite?.id !== suite.id) {
    throw new Error('Cloudflare check and suite do not identify the requested commit.');
  }
  if (suite.repository?.id !== REPOSITORY_ID || suite.repository.full_name !== REPOSITORY) {
    throw new Error('Cloudflare check belongs to another repository.');
  }
  if (suite.head_branch !== 'main') return null;
  if (!Number.isSafeInteger(check.id) || check.id <= 0) throw new Error('Invalid check ID.');
  if (check.status !== 'completed') return null;
  if (['skipped', 'neutral', 'stale'].includes(check.conclusion)) return null;

  const states = { success: 'success', failure: 'failure', timed_out: 'error',
    cancelled: 'error', action_required: 'error', startup_failure: 'error' };
  const state = states[check.conclusion];
  if (!state) throw new Error('Unrecognized Cloudflare conclusion.');
  if (!Number.isFinite(Date.parse(check.completed_at))) throw new Error('Missing completion time.');

  const log = new URL(check.details_url);
  if (log.protocol !== 'https:' || log.hostname !== 'dash.cloudflare.com' ||
      log.username || log.password || log.port || log.hash) throw new Error('Untrusted Cloudflare log URL.');
  const path = log.searchParams.get('to') ?? log.pathname;
  if ([...log.searchParams.keys()].some(key => key !== 'to')) throw new Error('Unexpected log URL query.');
  const match = path.match(new RegExp(`^/[a-f0-9]{32}/pages/view/dev/(${UUID})$`));
  if (!match) throw new Error('Check does not identify the configured Pages project.');
  const deploymentId = match[1];
  const expectedUrl = `https://${deploymentId.slice(0, 8)}.dev-aqz.pages.dev`;
  const links = [...(check.output?.summary ?? '').matchAll(/\bhref=['"]([^'"]+)['"]/g)]
    .map(match => match[1]);
  // A successful check must link its own immutable deployment, not an arbitrary host.
  const immutableUrl = links.find(link => link === expectedUrl || link === `${expectedUrl}/`);
  if (state === 'success' && !immutableUrl) throw new Error('Success lacks its matching immutable deployment URL.');
  return {
    sha, checkId: check.id, state, conclusion: check.conclusion,
    completedAt: check.completed_at, cloudflareDeploymentId: deploymentId,
    logUrl: `https://dash.cloudflare.com${path}`,
    environmentUrl: state === 'success' ? expectedUrl : null,
  };
}

export function selectTrigger(eventName, event, requestedSha, ref) {
  if (event.repository?.id !== REPOSITORY_ID || event.repository.full_name !== REPOSITORY) {
    throw new Error('Unexpected event repository.');
  }
  if (eventName === 'workflow_dispatch') {
    if (ref !== 'refs/heads/main') throw new Error('Manual reconciliation must run from main.');
    return { sha: requestedSha ? validateSha(requestedSha) : null };
  }
  if (eventName === 'workflow_run') {
    const run = event.workflow_run;
    if (event.action !== 'completed' || run?.workflow_id !== 342066728 ||
        run.head_repository?.id !== REPOSITORY_ID || run.head_branch !== 'main' ||
        !['push', 'workflow_dispatch'].includes(run.event)) throw new Error('Untrusted CI trigger.');
    return { sha: validateSha(run.head_sha) };
  }
  if (eventName === 'check_run') {
    const check = event.check_run;
    if (event.action !== 'completed' || !officialApp(check?.app) || check.name !== 'Cloudflare Pages' ||
        !Number.isSafeInteger(check.id) || check.id <= 0) throw new Error('Untrusted check trigger.');
    return { sha: validateSha(check.head_sha), checkId: check.id };
  }
  throw new Error('Unsupported status sync trigger.');
}

export function githubClient(token, fetchImpl = fetch) {
  if (!token) throw new Error('GITHUB_TOKEN is required.');
  return {
    async request(path, method = 'GET', body) {
      if (!path.startsWith(`${PREFIX}/`)) throw new Error('Unexpected GitHub API path.');
      // Never send the GitHub credential to a redirect or a Cloudflare endpoint.
      const response = await fetchImpl(`https://api.github.com${path}`, {
        method, redirect: 'error', signal: AbortSignal.timeout(30_000),
        headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (!response.ok) throw new Error(`GitHub API ${method} failed: HTTP ${response.status}.`);
      return response.json();
    },
  };
}

async function allPages(client, path) {
  const items = [];
  for (let page = 1; page <= 100; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const batch = await client.request(`${path}${separator}per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error('Invalid GitHub list response.');
    items.push(...batch);
    if (batch.length < 100) return items;
  }
  throw new Error('GitHub pagination limit reached.');
}

function owned(deployment) {
  return deployment.environment === ENVIRONMENT && deployment.task === TASK &&
    deployment.payload?.source === SOURCE;
}

function comparePublication(a, b) {
  return Date.parse(a.completedAt) - Date.parse(b.completedAt) || a.checkId - b.checkId;
}

export async function recordResult(client, result) {
  const list = () => allPages(client, `${PREFIX}/deployments?environment=${encodeURIComponent(ENVIRONMENT)}&task=${TASK}`);
  const deployments = (await list()).filter(owned);
  let deployment = deployments.find(item => item.payload.checkId === result.checkId &&
    item.payload.cloudflareDeploymentId === result.cloudflareDeploymentId &&
    item.payload.completedAt === result.completedAt);
  if (deployment && deployment.sha !== result.sha) throw new Error('Existing deployment commit mismatch.');
  if (!deployment) {
    deployment = await client.request(`${PREFIX}/deployments`, 'POST', {
      ref: result.sha, task: TASK, auto_merge: false, required_contexts: [],
      environment: ENVIRONMENT, production_environment: true, transient_environment: false,
      description: `Cloudflare App publication: ${result.conclusion}`,
      payload: { source: SOURCE, checkId: result.checkId, completedAt: result.completedAt,
        conclusion: result.conclusion,
        cloudflareDeploymentId: result.cloudflareDeploymentId,
        immutableUrl: result.environmentUrl, productionUrl: 'https://hongzhexie.com' },
    });
    if (deployment.sha !== result.sha || !owned(deployment)) throw new Error('GitHub did not create the expected deployment.');
    deployments.push(deployment);
  }
  const statuses = await allPages(client, `${PREFIX}/deployments/${deployment.id}/statuses`);
  // Replays must not reactivate a historical publication already marked inactive.
  const duplicate = statuses.some(status => status.state === result.state);
  const newer = result.state === 'success' && deployments.some(item =>
    item.id !== deployment.id && item.payload?.immutableUrl &&
    comparePublication(item.payload, result) > 0);
  if (!duplicate) {
    await client.request(`${PREFIX}/deployments/${deployment.id}/statuses`, 'POST', {
      state: result.state, log_url: result.logUrl, auto_inactive: false,
      description: `Cloudflare App: ${result.conclusion} (${result.completedAt})`,
      ...(result.environmentUrl ? { environment_url: result.environmentUrl } : {}),
    });
  }
  if (result.state === 'success') {
    const superseded = newer ? [deployment] : deployments.filter(item =>
      item.id !== deployment.id && item.payload?.immutableUrl &&
      comparePublication(item.payload, result) < 0);
    for (const previous of superseded) {
      const history = await allPages(client, `${PREFIX}/deployments/${previous.id}/statuses`);
      if (history[0]?.state !== 'success') continue;
      await client.request(`${PREFIX}/deployments/${previous.id}/statuses`, 'POST', {
        state: 'inactive', auto_inactive: false,
        description: 'Superseded by a later verified Cloudflare publication.',
      });
    }
  }
  return { deploymentId: deployment.id, state: result.state, inactive: Boolean(newer), duplicate };
}

export async function syncCommit(client, trigger, { attempts = 40,
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const sha = validateSha(trigger.sha ?? (await client.request(`${PREFIX}/git/ref/heads/main`)).object.sha);
  const comparison = await client.request(`${PREFIX}/compare/${sha}...main`);
  if (!['ahead', 'identical'].includes(comparison.status)) throw new Error('Requested commit is not on main.');
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let checks;
    if (trigger.checkId) {
      checks = [await client.request(`${PREFIX}/check-runs/${trigger.checkId}`)];
    } else {
      checks = [];
      for (let page = 1; page <= 100; page += 1) {
        const batch = await client.request(`${PREFIX}/commits/${sha}/check-runs?check_name=Cloudflare%20Pages&filter=all&per_page=100&page=${page}`);
        if (!Array.isArray(batch.check_runs)) throw new Error('Invalid check run response.');
        checks.push(...batch.check_runs);
        if (batch.check_runs.length < 100) break;
        if (page === 100) throw new Error('Check pagination limit reached.');
      }
    }
    const candidates = checks.filter(check => officialApp(check.app) && check.name === 'Cloudflare Pages')
      .sort((a, b) => b.id - a.id);
    let unfinished = candidates.length === 0;
    for (const check of candidates) {
      const suite = await client.request(`${PREFIX}/check-suites/${check.check_suite.id}`);
      if (suite.head_branch !== 'main') continue;
      if (check.status !== 'completed') { unfinished = true; break; }
      const result = validateCheck(check, suite, sha);
      if (!result) return { skipped: true, reason: `Cloudflare concluded ${check.conclusion}; no publication to record.` };
      return { ...await recordResult(client, result), ...result };
    }
    if (!unfinished) return { skipped: true, reason: 'No production-branch Cloudflare check.' };
    if (attempt < attempts) await wait(15_000);
  }
  throw new Error('Cloudflare check did not finish within the bounded reconciliation window; rerun manually.');
}

export async function main() {
  if (process.env.GITHUB_REPOSITORY !== REPOSITORY) throw new Error('Unexpected workflow repository.');
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const trigger = selectTrigger(process.env.GITHUB_EVENT_NAME, event,
    process.env.SYNC_COMMIT_SHA, process.env.GITHUB_REF);
  const result = await syncCommit(githubClient(process.env.GITHUB_TOKEN), trigger);
  const summary = result.skipped ? result.reason :
    `Recorded Cloudflare **${result.conclusion}** for \`${result.sha}\` in **${ENVIRONMENT}**.\n\n` +
    (result.environmentUrl ? `[Visit this deployment](${result.environmentUrl}) · ` : '') +
    `[Cloudflare build log](${result.logUrl})\n\n` +
    `Deployment record: ${result.deploymentId}${result.duplicate ? ' (already synced)' : ''}.`;
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
