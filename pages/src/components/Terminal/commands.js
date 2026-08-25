import { txt } from './handlers/shared';
import { PROFILE } from './data/profile';
import { ALL_NAMES, byName } from './registry';
import { cmdSandwich } from './handlers/funCommands';
import { tokenizeShell } from './utils/shell';
import terminal from '@assets/data/terminal/terminal.json';
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
  // Hidden commands are intentionally omitted from discovery surfaces.
  for (const c of ALL_NAMES) {
    const d = levenshtein(cmd, c);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  const threshold = Math.max(2, Math.floor(cmd.length / 2));
  return bestDist <= threshold ? best : null;
}

// Multi-token easter eggs that cannot be represented by one descriptor.
const PHRASES = [
  { test: (s) => /^(sudo\s+)?make me a sandwich$/.test(s), run: (ctx) => cmdSandwich(ctx) },
];

function resolvePhrase(words) {
  const lower = words.map((word) => word.toLowerCase()).join(' ');
  return PHRASES.find((p) => p.test(lower)) || null;
}

export function processCommand(input, settings = {}, cmdHistory = []) {
  const { fontSize, theme, accentColor, cwd } = settings;
  const source = String(input ?? '');
  if (!source.trim()) return null;

  const parsed = tokenizeShell(source);
  if (parsed.error) {
    return {
      output: [
        txt(''),
        txt(`Shell parse error: ${parsed.error}.`, 't-error'),
        txt(''),
      ],
    };
  }

  const parts = parsed.tokens.map((token) => token.value);
  const name = parts[0].toLowerCase();
  const args = parts.slice(1);
  const trimmed = source.trim();

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

  const phrase = resolvePhrase(parts);
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
      txt(`Unknown command: '${name}'.${suggestion ? ` Did you mean '${suggestion}'?` : " Type 'help' for essential commands."}`, 't-error'),
      txt(''),
    ],
  };
}

export function getWelcomeOutput() {
  return [
    txt(''),
    PROFILE,
    txt(''),
    txt(terminal.welcomeMessage, 't-dim'),
    txt(''),
  ];
}

export const QUICK_COMMANDS = terminal.quickCommands;
