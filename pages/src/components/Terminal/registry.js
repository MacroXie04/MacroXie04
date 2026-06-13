// ============================================================================
// Command registry — the SINGLE source of truth for the terminal's commands.
//
// Every command is one plain-object descriptor in COMMANDS. The dispatcher in
// commands.js builds a `ctx` and calls descriptor.run(ctx); help, man, which,
// tab-completion and the "did you mean" Levenshtein search all derive from this
// one array. Adding a command = add one descriptor here + its handler export.
//
// Handlers themselves live in handlers/*.js (one file per family) — the registry
// only references them, so no file regrows into a monolith.
//
// ctx shape (built once per command in processCommand):
//   { args, raw, name, settings: { fontSize, theme, accentColor },
//     cmdHistory, cwd, vfs, dispatch }
//
// Descriptor fields:
//   name       required, unique, lowercase canonical
//   aliases    string[]; each resolves to this same descriptor via byName
//   category   'core'|'info'|'fs'|'appearance'|'util'|'fun' (groups help output)
//   summary    one-line help text (omitted for hidden commands)
//   man        manual text — set ONLY where an entry exists today, so cmdMan
//              still prints "No manual entry" for the rest
//   path       fake binary path — set ONLY where an entry exists today, so
//              cmdWhich still prints "not found" for the rest
//   hidden     dispatchable but excluded from help / completion / Levenshtein
//   completer  optional (ctx) => string[] arg-completion source
//   pre        optional (ctx) => result|null; non-null short-circuits run
//   run        required (ctx) => result
// ============================================================================

import { handleSudo, isDestructiveRm } from './handlers/sudo';
import { txt } from './handlers/shared';
import { completeChildren } from './data/filesystem';
import {
  cmdHelp, cmdAbout, cmdExperience, cmdSkills, cmdContact, cmdSeventeen,
  cmdProjects, cmdEducation, cmdStack,
} from './handlers/infoCommands';
import {
  cmdLs, cmdCat, cmdGithub, cmdPwd, cmdEcho, cmdCd,
} from './handlers/fsCommands';
import {
  cmdUname, cmdDate, cmdUptime, cmdPing, cmdExit,
  cmdHistory, cmdSettings, cmdFont, cmdTheme, cmdColor,
  cmdMan, cmdWhich, cmdPrint, cmdDownloadCv, cmdCal,
  cmdSeq, cmdExpr, cmdBc, cmdEnv, cmdBasename, cmdDirname, cmdId, cmdLess, cmdYes, cmdSleep,
} from './handlers/utilCommands';
import {
  cmdGrep, cmdWc, cmdHead, cmdTail, cmdTree, cmdFind, cmdStat, cmdFile,
  cmdSort, cmdUniq, cmdDiff, cmdReadOnlyFs,
} from './handlers/utilFsCommands';
import {
  cmdNeofetch, cmdCowsay, cmdFiglet, cmdFortune, cmdEditorTrap,
  cmdLolcat, cmdSl, cmdMatrix, cmdWeather, cmdHtop, cmdPlease, cmdSandwich,
  cmdTelnet, cmdAafire, cmdCoffee, cmdAscii, cmdHollywood, cmdClaude,
} from './handlers/funCommands';

// Shared arg-completer for commands that take a path: returns the VFS children
// of the directory the user has typed so far (see completions.js).
const pathCompleter = (ctx) => completeChildren(ctx.cwd, ctx.dirPart);

export const COMMANDS = [
  // ── core ──────────────────────────────────────────────────────────────
  { name: 'help', category: 'core', summary: 'List available commands',
    run: (ctx) => cmdHelp(visibleCommands(), ctx.args[0], getCommand) },
  { name: 'clear', category: 'core', summary: 'Clear terminal',
    man: 'Clear terminal screen', path: '/usr/bin/clear',
    run: () => ({ clear: true }) },
  { name: 'quit', category: 'core', hidden: true,
    run: () => ({ quit: true }) },
  { name: 'exit', category: 'core', summary: 'Exit terminal',
    run: () => cmdExit() },
  { name: 'history', category: 'core', summary: 'Command history',
    run: (ctx) => cmdHistory(ctx.cmdHistory) },
  { name: 'sudo', category: 'core', summary: 'Execute a command as another user',
    man: 'Execute a command as another user', path: '/usr/bin/sudo',
    run: (ctx) => handleSudo(ctx.args) },
  { name: 'rm', category: 'core', hidden: true,
    pre: (ctx) => (isDestructiveRm(ctx.args) ? { bomb: true, output: [] } : null),
    run: () => ({ output: [txt(''), txt('rm: permission denied', 't-error'), txt('')] }) },
  { name: 'cv', aliases: ['resume', 'download'], category: 'core', summary: 'Download resume PDF',
    run: () => cmdDownloadCv() },

  // ── info ──────────────────────────────────────────────────────────────
  { name: 'about', aliases: ['whoami'], category: 'info', summary: 'About me and contact info',
    run: () => cmdAbout() },
  { name: 'experience', category: 'info', summary: 'Work experience',
    run: () => cmdExperience() },
  { name: 'skills', category: 'info', summary: 'Technical skills',
    run: () => cmdSkills() },
  { name: 'contact', category: 'info', summary: 'Contact information',
    run: () => cmdContact() },
  { name: 'projects', aliases: ['work', 'portfolio'], category: 'info',
    summary: 'Showcase projects  (projects <name>, --links)',
    run: (ctx) => cmdProjects(ctx.args) },
  { name: 'education', aliases: ['edu', 'school'], category: 'info',
    summary: 'Academic background  (-v, --courses)',
    run: (ctx) => cmdEducation(ctx.args) },
  { name: 'stack', aliases: ['tools', 'tech'], category: 'info',
    summary: 'Toolbox grouped by domain  (--flat)',
    run: (ctx) => cmdStack(ctx.args) },

  // ── fs ────────────────────────────────────────────────────────────────
  { name: 'ls', category: 'fs', summary: 'List files  (-l long, -a all, -la combined)',
    man: 'List directory contents', path: '/bin/ls', completer: pathCompleter,
    run: (ctx) => cmdLs(ctx.args, ctx.cwd) },
  { name: 'cat', category: 'fs', summary: 'View a file (path-aware, syntax-highlighted)',
    man: 'Concatenate and print files', path: '/bin/cat', completer: pathCompleter,
    run: (ctx) => ({ output: cmdCat(ctx.args, ctx.cwd) }) },
  { name: 'cd', category: 'fs', summary: 'Change directory',
    completer: pathCompleter,
    run: (ctx) => cmdCd(ctx.args, ctx.cwd) },
  { name: 'pwd', category: 'fs', summary: 'Print working directory',
    man: 'Return working directory name', path: '/bin/pwd',
    run: (ctx) => cmdPwd(ctx.cwd) },
  { name: 'echo', category: 'fs', summary: 'Print text',
    man: 'Write arguments to stdout', path: '/bin/echo',
    run: (ctx) => cmdEcho(ctx.args) },
  { name: 'github', category: 'fs', summary: 'Open GitHub profile',
    run: () => cmdGithub() },
  { name: 'tree', category: 'fs', summary: 'Print the directory tree  (-a hidden)',
    man: 'List contents of directories in a tree-like format', path: '/usr/bin/tree',
    completer: pathCompleter, run: (ctx) => cmdTree(ctx.args, ctx.cwd) },
  { name: 'find', category: 'fs', summary: 'Search the tree  (-name glob, -type f|d)',
    man: 'Search for files in a directory hierarchy', path: '/usr/bin/find',
    completer: pathCompleter, run: (ctx) => cmdFind(ctx.args, ctx.cwd) },
  { name: 'stat', category: 'fs', summary: 'Show file metadata',
    man: 'Display file or file system status', path: '/usr/bin/stat',
    completer: pathCompleter, run: (ctx) => cmdStat(ctx.args, ctx.cwd) },
  { name: 'file', category: 'fs', summary: 'Identify a file type',
    man: 'Determine file type', path: '/usr/bin/file',
    completer: pathCompleter, run: (ctx) => cmdFile(ctx.args, ctx.cwd) },
  { name: 'touch', aliases: ['mkdir', 'rmdir', 'mv', 'cp'], category: 'fs',
    summary: 'Modify files (read-only filesystem: denied)',
    completer: pathCompleter, run: (ctx) => cmdReadOnlyFs(ctx.name, ctx.args) },

  // ── appearance ─────────────────────────────────────────────────────────
  { name: 'settings', category: 'appearance', summary: 'Show current settings',
    run: (ctx) => cmdSettings({ fontSize: ctx.settings.fontSize, theme: ctx.settings.theme, color: ctx.settings.accentColor }) },
  { name: 'font', category: 'appearance', summary: 'Change font size (small|medium|large|xlarge)',
    run: (ctx) => cmdFont(ctx.args, ctx.settings.fontSize) },
  { name: 'theme', category: 'appearance', summary: 'Change background (default|dracula|nord|solarized|light)',
    run: (ctx) => cmdTheme(ctx.args, ctx.settings.theme) },
  { name: 'color', category: 'appearance', summary: 'Change accent color (green|blue|purple|orange|cyan)',
    run: (ctx) => cmdColor(ctx.args, ctx.settings.accentColor) },

  // ── util ──────────────────────────────────────────────────────────────
  { name: 'uname', category: 'util', summary: 'System info',
    man: 'Print operating system name', path: '/usr/bin/uname',
    run: (ctx) => cmdUname(ctx.args) },
  { name: 'date', category: 'util', summary: 'Current date',
    man: 'Display or set date and time', path: '/bin/date',
    run: () => cmdDate() },
  { name: 'uptime', category: 'util', summary: 'System uptime',
    run: () => cmdUptime() },
  { name: 'ping', category: 'util', summary: 'Ping a host',
    run: (ctx) => cmdPing(ctx.args) },
  { name: 'man', category: 'util', summary: 'Manual page',
    man: 'Format and display manual pages', path: '/usr/bin/man',
    run: (ctx) => cmdMan(ctx.args, getCommand) },
  { name: 'which', category: 'util', summary: 'Locate command',
    path: '/usr/bin/which',
    run: (ctx) => cmdWhich(ctx.args, getCommand) },
  { name: 'print', category: 'util', summary: 'Open resume PDF for printing',
    run: () => cmdPrint() },
  { name: 'grep', aliases: ['egrep', 'fgrep'], category: 'util',
    summary: 'Search files for text  (-i -n -v -c)',
    man: 'Print lines that match patterns', path: '/usr/bin/grep',
    completer: pathCompleter, run: (ctx) => cmdGrep(ctx.args, ctx.cwd) },
  { name: 'wc', category: 'util', summary: 'Count lines / words / bytes  (-l -w -c)',
    man: 'Print newline, word, and byte counts', path: '/usr/bin/wc',
    completer: pathCompleter, run: (ctx) => cmdWc(ctx.args, ctx.cwd) },
  { name: 'head', category: 'util', summary: 'First lines of a file  (-n N)',
    man: 'Output the first part of files', path: '/usr/bin/head',
    completer: pathCompleter, run: (ctx) => cmdHead(ctx.args, ctx.cwd) },
  { name: 'tail', category: 'util', summary: 'Last lines of a file  (-n N)',
    man: 'Output the last part of files', path: '/usr/bin/tail',
    completer: pathCompleter, run: (ctx) => cmdTail(ctx.args, ctx.cwd) },
  { name: 'sort', category: 'util', summary: 'Sort file lines  (-r -u -f)',
    man: 'Sort lines of text files', path: '/usr/bin/sort',
    completer: pathCompleter, run: (ctx) => cmdSort(ctx.args, ctx.cwd) },
  { name: 'uniq', category: 'util', summary: 'Collapse adjacent duplicate lines  (-c -d -i)',
    man: 'Report or omit repeated lines', path: '/usr/bin/uniq',
    completer: pathCompleter, run: (ctx) => cmdUniq(ctx.args, ctx.cwd) },
  { name: 'diff', category: 'util', summary: 'Compare two files',
    man: 'Compare files line by line', path: '/usr/bin/diff',
    completer: pathCompleter, run: (ctx) => cmdDiff(ctx.args, ctx.cwd) },
  { name: 'cal', category: 'util', summary: 'Display a calendar',
    man: 'Display a calendar', path: '/usr/bin/cal',
    run: () => cmdCal() },
  { name: 'seq', category: 'util', summary: 'Print a sequence of numbers',
    man: 'Print a sequence of numbers', path: '/usr/bin/seq',
    run: (ctx) => cmdSeq(ctx.args) },
  { name: 'expr', category: 'util', summary: 'Evaluate one integer expression',
    man: 'Evaluate expressions', path: '/usr/bin/expr',
    run: (ctx) => cmdExpr(ctx.args) },
  { name: 'bc', category: 'util', summary: 'Calculator (with precedence)',
    man: 'An arbitrary precision calculator language', path: '/usr/bin/bc',
    run: (ctx) => cmdBc(ctx.args) },
  { name: 'env', aliases: ['printenv'], category: 'util', summary: 'Print environment variables',
    man: 'Run a program in a modified environment', path: '/usr/bin/env',
    run: (ctx) => cmdEnv(ctx.cwd) },
  { name: 'basename', category: 'util', summary: 'Strip directory from a path',
    man: 'Strip directory and suffix from filenames', path: '/usr/bin/basename',
    run: (ctx) => cmdBasename(ctx.args) },
  { name: 'dirname', category: 'util', summary: 'Strip last component from a path',
    man: 'Strip last component from file name', path: '/usr/bin/dirname',
    run: (ctx) => cmdDirname(ctx.args) },
  { name: 'id', aliases: ['groups'], category: 'util', summary: 'Print user / group identity',
    man: 'Print real and effective user and group IDs', path: '/usr/bin/id',
    run: (ctx) => cmdId(ctx.name) },
  { name: 'less', aliases: ['more'], category: 'util', summary: 'Pager (use cat here)',
    man: 'Opposite of more', path: '/usr/bin/less',
    completer: pathCompleter, run: (ctx) => cmdLess(ctx.args, ctx.name) },
  { name: 'yes', category: 'util', summary: 'Repeat a string (capped)',
    man: 'Output a string repeatedly until killed', path: '/usr/bin/yes',
    run: (ctx) => cmdYes(ctx.args) },
  { name: 'sleep', category: 'util', summary: 'Wait (simulated)',
    man: 'Delay for a specified amount of time', path: '/usr/bin/sleep',
    run: (ctx) => cmdSleep(ctx.args) },

  // ── fun ───────────────────────────────────────────────────────────────
  { name: 'seventeen', aliases: ['svt'], category: 'fun', summary: 'A little easter egg',
    run: () => cmdSeventeen() },
  { name: 'neofetch', aliases: ['screenfetch'], category: 'fun', summary: 'System info + ASCII logo',
    run: () => cmdNeofetch() },
  { name: 'cowsay', aliases: ['cowthink'], category: 'fun', summary: 'An ASCII cow says something',
    run: (ctx) => cmdCowsay(ctx.args, ctx.name) },
  { name: 'figlet', aliases: ['banner', 'toilet'], category: 'fun', summary: 'Big ASCII letters',
    run: (ctx) => cmdFiglet(ctx.args, ctx.name) },
  { name: 'fortune', category: 'fun', summary: 'A random adage',
    run: () => cmdFortune() },
  { name: 'vim', aliases: ['vi', 'emacs', 'nano'], category: 'fun', summary: 'How do I exit this thing?',
    run: (ctx) => cmdEditorTrap(ctx.name) },
  { name: 'lolcat', aliases: ['rainbow'], category: 'fun', summary: 'Rainbow-colored text',
    run: (ctx) => cmdLolcat(ctx.args) },
  { name: 'sl', aliases: ['choochoo'], category: 'fun', summary: 'Steam locomotive (the ls typo)',
    run: () => cmdSl() },
  { name: 'matrix', aliases: ['cmatrix'], category: 'fun', summary: 'Green digital rain',
    run: () => cmdMatrix() },
  { name: 'weather', aliases: ['wttr'], category: 'fun', summary: 'Canned offline forecast',
    run: () => cmdWeather() },
  { name: 'htop', aliases: ['top'], category: 'fun', summary: 'Fake process monitor',
    run: () => cmdHtop() },
  { name: 'please', aliases: ['thanks', 'thx'], category: 'fun', summary: 'Ask politely (re-runs a command)',
    run: (ctx) => cmdPlease(ctx) },
  { name: 'sandwich', category: 'fun', summary: 'xkcd 149',
    run: (ctx) => cmdSandwich(ctx) },
  { name: 'telnet', category: 'fun', summary: 'Connect somewhere fun',
    run: (ctx) => cmdTelnet(ctx.args) },
  { name: 'aafire', aliases: ['fire'], category: 'fun', summary: 'ASCII flames',
    run: () => cmdAafire() },
  { name: 'coffee', aliases: ['brew', 'tea'], category: 'fun', summary: 'Brew a beverage',
    run: (ctx) => cmdCoffee(ctx.name) },
  { name: 'ascii', aliases: ['logo'], category: 'fun', summary: 'Branded ASCII wordmark',
    run: () => cmdAscii() },
  { name: 'hollywood', aliases: ['hacker'], category: 'fun', summary: 'Hack the mainframe',
    run: () => cmdHollywood() },
  { name: 'claude', aliases: ['anthropic', 'ask'], category: 'fun', summary: 'Say hi to Claude (built this terminal)',
    run: (ctx) => cmdClaude(ctx.args) },
];

// ── Derived structures (built once at module load) ────────────────────────

// byName maps every canonical name AND every alias to its descriptor.
export const byName = (() => {
  const m = new Map();
  for (const cmd of COMMANDS) {
    if (m.has(cmd.name)) {
      throw new Error(`registry: duplicate command name '${cmd.name}'`);
    }
    m.set(cmd.name, cmd);
    for (const alias of cmd.aliases || []) {
      if (m.has(alias)) {
        throw new Error(`registry: alias '${alias}' collides with an existing name/alias`);
      }
      m.set(alias, cmd);
    }
  }
  return m;
})();

// ALL_NAMES = canonical names + non-hidden aliases (for completion + Levenshtein).
export const ALL_NAMES = (() => {
  const names = [];
  for (const cmd of COMMANDS) {
    if (cmd.hidden) continue;
    names.push(cmd.name);
    for (const alias of cmd.aliases || []) names.push(alias);
  }
  return names;
})();

export function getCommand(name) {
  return byName.get(String(name).toLowerCase()) || null;
}

// Visible (non-hidden) descriptors, in registry order — used by help.
export function visibleCommands() {
  return COMMANDS.filter((c) => !c.hidden);
}
