import { txt } from './handlers/shared';
import { PROFILE } from './data/profile';
import { byName } from './registry';
import { cmdSandwich } from './handlers/funCommands';
export { getCompletions } from './utils/completions';

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function findClosestCommand(cmd) {
  let best = null, bestDist = Infinity;
  // Suggest any dispatchable name (canonical + aliases, including hidden like
  // rm/quit) — anything the user could legitimately have typed.
  for (const c of byName.keys()) {
    const d = levenshtein(cmd, c);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  const threshold = Math.max(2, Math.floor(cmd.length / 2));
  return bestDist <= threshold ? best : null;
}

// Multi-token "commands" that can't be a single-token descriptor are matched
// here, before tokenized lookup. Each entry: { test(lowercasedTrimmed) -> bool, run(ctx) }.
const PHRASES = [
  { test: (s) => /^(sudo\s+)?make me a sandwich$/.test(s), run: (ctx) => cmdSandwich(ctx) },
];

function resolvePhrase(trimmed) {
  const lower = trimmed.toLowerCase();
  return PHRASES.find((p) => p.test(lower)) || null;
}

export function processCommand(input, settings = {}, cmdHistory = []) {
  const { fontSize, theme, accentColor, cwd } = settings;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const name = parts[0].toLowerCase();
  const args = parts.slice(1);

  const ctx = {
    args,
    raw: trimmed,
    name,
    settings: { fontSize, theme, accentColor },
    cmdHistory,
    cwd,
    // Injected so handlers (e.g. `please <cmd>`) can re-dispatch without
    // importing commands.js (which would create a circular import).
    dispatch: (line) => processCommand(line, settings, cmdHistory),
  };

  const phrase = resolvePhrase(trimmed);
  if (phrase) return phrase.run(ctx);

  const cmd = byName.get(name);
  if (cmd) {
    if (cmd.pre) {
      const short = cmd.pre(ctx);
      if (short != null) return short;
    }
    return cmd.run(ctx);
  }

  const suggestion = findClosestCommand(name);
  return {
    output: [
      txt(''),
      txt(`Unknown command: '${name}'.${suggestion ? ` Did you mean '${suggestion}'?` : " Type 'help' for available commands."}`, 't-error'),
      txt(''),
    ],
  };
}

export function getWelcomeOutput() {
  return [
    txt(''),
    PROFILE,
    txt(''),
    txt("Welcome! Type 'help' to see available commands.", 't-dim'),
    txt(''),
  ];
}

export const QUICK_COMMANDS = ['help', 'about', 'experience', 'skills', 'contact', 'ls', 'github', 'resume', 'clear'];
