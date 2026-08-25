// ============================================================================
// Virtual filesystem — a dependency-free, read-only, in-memory tree that backs
// ls / cd / pwd / cat / tree / find / grep / wc / head / tail / stat / file / ...
//
// It is the SINGLE filesystem source: every fs/text command walks this tree, so
// `tree` and `ls` always agree and file sizes are computed once from real
// content length. Pure module — no React, no localStorage, no console, no
// import.meta.env — and it lives under components/Terminal/** so it stays
// excluded from coverage collection.
//
// Tree structure and authored file contents are editable in
// assets/data/terminal/filesystem.json. Node spec strings:
//   "@motd"                    → /etc/motd content from terminal.json motd
//   "@section:<key>:<lang>"    → ref to data/sections/<key> (readme/experience/skills)
//   "@file:<key>[:<lang>]"     → content from filesystem.json files[key]
//   "@pdf"                     → resume PDF metadata from resumePdf
// `{name}` / `{email}` / ... placeholders in file contents are filled from PROFILE.
// ============================================================================

import { readme } from '../../../data/sections/readme';
import { experience } from '../../../data/sections/experience';
import { skills } from '../../../data/sections/skills';
import terminal from '@assets/data/terminal/terminal.json';
import filesystem from '@assets/data/terminal/filesystem.json';
import { PROFILE } from './profile';

export const HOME = filesystem.home;
const MTIME = filesystem.mtime;
const RESUME_PDF = filesystem.resumePdf || {};

const SECTIONS = { readme, experience, skills };

const fill = (s) => s.replace(/\{(\w+)\}/g, (m, k) => (PROFILE[k] !== undefined ? String(PROFILE[k]) : m));

// ── Node constructors ───────────────────────────────────────────────────────
const dir = (name, children) => ({ type: 'dir', name, children });
const file = (name, lang, content, extra = {}) => ({ type: 'file', name, lang, content, ...extra });
const ref = (name, lang, refObj) => ({ type: 'file', name, lang, ref: refObj });

function build(name, spec) {
  if (spec && typeof spec === 'object') {
    const children = {};
    for (const [childName, childSpec] of Object.entries(spec)) {
      children[childName] = build(childName, childSpec);
    }
    return dir(name, children);
  }
  const s = String(spec);
  if (s === '@pdf') {
    return file(name, null, '', {
      pdf: true,
      bytes: RESUME_PDF.bytes,
      pdfVersion: RESUME_PDF.version,
      pages: RESUME_PDF.pages,
      mtime: RESUME_PDF.mtime,
      downloadName: RESUME_PDF.filename,
    });
  }
  if (s === '@motd') return file(name, null, terminal.motd.join('\n'));
  if (s.startsWith('@section:')) {
    const [, key, lang] = s.split(':');
    return ref(name, lang || null, SECTIONS[key]);
  }
  if (s.startsWith('@file:')) {
    const [key, lang] = s.slice(6).split(':');
    return file(name, lang || null, filesystem.files[key].map(fill).join('\n'));
  }
  throw new Error(`filesystem.json: unknown node spec "${s}"`);
}

export const ROOT = build('/', filesystem.tree);

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

// Count the bytes a string occupies when encoded as UTF-8. String#length
// counts UTF-16 code units, which under-reports emoji and most non-ASCII text.
export function utf8Size(value) {
  let bytes = 0;
  for (const char of String(value ?? '')) {
    const cp = char.codePointAt(0);
    bytes += cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function rawSize(node) {
  if (!node) return 0;
  if (node.type === 'dir') return Object.keys(node.children).length * 64 + 64;
  if (Number.isFinite(node.bytes)) return node.bytes;
  return utf8Size(fileContent(node));
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
    pdfVersion: node.pdfVersion || null,
    pages: Number.isFinite(node.pages) ? node.pages : null,
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
export function completeChildren(cwd, dirPart, opts = {}) {
  const node = getNode(resolvePath(cwd, dirPart || '.'));
  if (!isDir(node)) return [];
  const lastDirSegment = splitPath(dirPart).slice(-1)[0] || '';
  const includeHidden = !!opts.all || lastDirSegment.startsWith('.');
  return listDir(node, { all: includeHidden })
    .filter((n) => !opts.directoriesOnly || isDir(n))
    .map((n) => (isDir(n) ? n.name + '/' : n.name));
}
