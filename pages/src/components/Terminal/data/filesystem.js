// ============================================================================
// Virtual filesystem — a dependency-free, read-only, in-memory tree that backs
// ls / cd / pwd / cat / tree / find / grep / wc / head / tail / stat / file / ...
//
// It is the SINGLE filesystem source: every fs/text command walks this tree, so
// `tree` and `ls` always agree and file sizes are computed once from real
// content length. Pure module — no React, no localStorage, no console, no
// import.meta.env — and it lives under components/Terminal/** so it stays
// excluded from coverage collection.
// ============================================================================

import { readme } from '../../../data/sections/readme';
import { experience } from '../../../data/sections/experience';
import { skills } from '../../../data/sections/skills';
import { PROFILE } from './profile';

export const HOME = '/home/visitor';
const MTIME = 'Feb 22 10:30';

// ── Authored inline content (net-new text, derived from PROFILE) ────────────
const ABOUT_TXT = [
  PROFILE.name,
  PROFILE.role,
  PROFILE.education,
  '',
  `"${PROFILE.tagline}"`,
  '',
  "Type 'about' for the full profile card, or 'help' to explore.",
  '',
].join('\n');

const CONTACT_TXT = [
  `Email:   ${PROFILE.email}`,
  `GitHub:  ${PROFILE.github}`,
  `Phone:   ${PROFILE.phone}`,
  '',
].join('\n');

const PROFILE_RC = [
  '# ~/.profile — sourced at login',
  'export EDITOR=vim',
  "export PS1='visitor@hongzhe:\\w$ '",
  "alias ll='ls -la'",
  '',
  "# tip: try 'neofetch', 'cowsay hello', or 'fortune'",
  '',
].join('\n');

const SECRET_TXT = [
  'You found the secret file. 🎉',
  '',
  'The cake is a lie, but the job search is real.',
  "Liked poking around? I'm open to opportunities — let's talk:",
  `  ${PROFILE.email}`,
  '',
].join('\n');

const MOTD = [
  'Welcome to hongzhe-portfolio (GNU/Linux 6.8.0)',
  '',
  " * Documentation:  type 'help'",
  " * Source code:    type 'github'",
  " * Resume:         type 'cv'",
  '',
  'Last login: just now from a curious browser',
  '',
].join('\n');

const PORTFOLIO_MD = [
  '# Portfolio Terminal',
  '',
  'This site — a terminal/CLI-style resume.',
  '',
  '- **Stack:** React + Vite, hooks-first, zero runtime deps for the shell',
  '- **Features:** virtual filesystem, tab completion, theming, 60+ commands',
  '- **Deploy:** GitHub Pages + AWS Amplify',
  '',
  'Run `github` to see the source.',
  '',
].join('\n');

const BACKEND_MD = [
  '# Django REST Backend',
  '',
  'Production web systems for UC Merced Innovate to Grow.',
  '',
  '- **Stack:** Django 5, DRF, JWT auth (email login), DynamoDB + SQLite split',
  '- **CMS:** block-based content, server-side bleach sanitization',
  '- **Infra:** Docker, GitHub Actions CI/CD, AWS (EC2 · S3 · RDS)',
  '',
].join('\n');

const ADK_MD = [
  '# AI Agent Systems',
  '',
  'Autonomous agents built on the Google Agent Development Kit (ADK).',
  '',
  '- **Design:** multi-agent workflows, shared context stores, tool use',
  '- **LLM:** streaming, function calling, structured outputs',
  '- **Quality:** automated evals and trace-level observability',
  '',
].join('\n');

// ── Node constructors ───────────────────────────────────────────────────────
const dir = (name, children) => ({ type: 'dir', name, children });
const file = (name, lang, content, extra = {}) => ({ type: 'file', name, lang, content, ...extra });
const ref = (name, lang, refObj) => ({ type: 'file', name, lang, ref: refObj });

export const ROOT = dir('/', {
  etc: dir('etc', {
    motd: file('motd', null, MOTD),
  }),
  home: dir('home', {
    visitor: dir('visitor', {
      'about.txt': file('about.txt', null, ABOUT_TXT),
      'contact.txt': file('contact.txt', null, CONTACT_TXT),
      'README.md': ref('README.md', 'markdown', readme),
      'experience.py': ref('experience.py', 'python', experience),
      'skills.sql': ref('skills.sql', 'SQL', skills),
      '.profile': file('.profile', null, PROFILE_RC),
      '.secret': file('.secret', null, SECRET_TXT),
      projects: dir('projects', {
        'portfolio.md': file('portfolio.md', 'markdown', PORTFOLIO_MD),
        'backend.md': file('backend.md', 'markdown', BACKEND_MD),
        'adk-agents.md': file('adk-agents.md', 'markdown', ADK_MD),
      }),
      resume: dir('resume', {
        'resume.pdf': file('resume.pdf', null, '', { pdf: true }),
      }),
    }),
  }),
});

// ── Path helpers (all pure) ─────────────────────────────────────────────────
export function splitPath(p) {
  return String(p || '').split('/').filter(Boolean);
}

// Resolve `arg` (absolute, relative, ~, ., ..) against `cwd` into a normalized
// absolute path. '' resolves to cwd; '..' is clamped at root.
export function resolvePath(cwd, arg) {
  let a = (arg === undefined || arg === null) ? '' : String(arg);
  if (a === '') a = '.';
  if (a === '~') a = HOME;
  else if (a.startsWith('~/')) a = HOME + a.slice(1);

  const segs = a.startsWith('/')
    ? splitPath(a)
    : [...splitPath(cwd || HOME), ...splitPath(a)];

  const out = [];
  for (const s of segs) {
    if (s === '.') continue;
    if (s === '..') { out.pop(); continue; }
    out.push(s);
  }
  return '/' + out.join('/');
}

function findChild(dirNode, name) {
  if (dirNode.children[name]) return dirNode.children[name];
  const lower = name.toLowerCase();
  for (const key of Object.keys(dirNode.children)) {
    if (key.toLowerCase() === lower) return dirNode.children[key];
  }
  return null;
}

// Walk ROOT to the node at `absPath`, or null. Segment match is
// case-insensitive (so `cat readme.md` still works).
export function getNode(absPath) {
  let node = ROOT;
  for (const seg of splitPath(absPath)) {
    if (!node || node.type !== 'dir') return null;
    node = findChild(node, seg);
    if (!node) return null;
  }
  return node;
}

export const isDir = (n) => !!n && n.type === 'dir';
export const isFile = (n) => !!n && n.type === 'file';

export function fileContent(node) {
  if (!node) return '';
  return node.ref ? node.ref.content : (node.content || '');
}

export function readFile(node) {
  return { lines: fileContent(node).split('\n'), lang: (node && node.lang) || null };
}

export function listDir(node, opts = {}) {
  if (!isDir(node)) return [];
  let children = Object.values(node.children);
  if (!opts.all) children = children.filter((c) => !c.name.startsWith('.'));
  return children.sort((a, b) => a.name.localeCompare(b.name));
}

export function rawSize(node) {
  if (!node) return 0;
  if (node.type === 'dir') return Object.keys(node.children).length * 64 + 64;
  return fileContent(node).length;
}

export function humanSize(bytes) {
  if (bytes < 1024) return String(bytes);
  return (bytes / 1024).toFixed(1) + 'K';
}

export function stat(absPath) {
  const node = getNode(absPath);
  if (!node) return null;
  const d = isDir(node);
  return {
    type: node.type,
    name: node.name,
    bytes: rawSize(node),
    size: humanSize(rawSize(node)),
    perm: d ? 'drwxr-xr-x' : (node.name.startsWith('.') ? '-rw-------' : '-rw-r--r--'),
    mtime: node.mtime || MTIME,
    lang: node.lang || null,
    pdf: !!node.pdf,
  };
}

function joinPath(base, name) {
  return base === '/' ? '/' + name : base + '/' + name;
}

// Recursively yield [absPath, node] for the node at absPath and all descendants
// (dirs first-listed, children sorted). Used by tree and find.
export function walk(absPath) {
  const start = getNode(absPath);
  const results = [];
  if (!start) return results;
  const startPath = '/' + splitPath(absPath).join('/');
  (function rec(node, path) {
    results.push([path === '' ? '/' : path, node]);
    if (node.type === 'dir') {
      for (const child of Object.values(node.children).sort((a, b) => a.name.localeCompare(b.name))) {
        rec(child, joinPath(path === '' ? '/' : path, child.name));
      }
    }
  })(start, startPath);
  return results;
}

// Candidate names for tab-completion of a path argument, given the current cwd
// and the directory portion the user has typed so far (e.g. 'projects/').
export function completeChildren(cwd, dirPart) {
  const node = getNode(resolvePath(cwd, dirPart || '.'));
  if (!isDir(node)) return [];
  return listDir(node, {}).map((n) => (isDir(n) ? n.name + '/' : n.name));
}
