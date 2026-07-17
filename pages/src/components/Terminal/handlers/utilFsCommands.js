import { txt, html, escapeHtml } from './shared';
import { renderFileLine } from './fsCommands';
import {
  resolvePath, getNode, readFile, fileContent, walk, stat, isDir,
} from '../data/filesystem';

// Fixed green that survives the accent-color remap (--t-green is overridden by
// data-color, so semantic green must be inline, not class t-green).
const HL = 'color:#39D353;font-weight:600';

function notFound(cmd, f) { return txt(`${cmd}: ${f}: No such file or directory`, 't-error'); }
function isADir(cmd, f) { return txt(`${cmd}: ${f}: Is a directory`, 't-error'); }

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatches(line, pattern, ignoreCase) {
  if (!pattern) return escapeHtml(line);
  const re = new RegExp(escapeRegex(pattern), ignoreCase ? 'gi' : 'g');
  let result = '', last = 0, m;
  while ((m = re.exec(line)) !== null) {
    result += escapeHtml(line.slice(last, m.index));
    result += `<span style="${HL}">${escapeHtml(m[0])}</span>`;
    last = m.index + m[0].length;
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return result + escapeHtml(line.slice(last));
}

// grep / egrep / fgrep — literal substring search (no regex flavor difference
// here; egrep/fgrep are aliases). Flags: -i -n -v -c.
export function cmdGrep(args = [], cwd) {
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const rest = args.filter((a) => !a.startsWith('-'));
  const ignoreCase = flags.includes('i');
  const showNum = flags.includes('n');
  const invert = flags.includes('v');
  const countOnly = flags.includes('c');
  const pattern = rest[0];
  const files = rest.slice(1);
  if (pattern === undefined || files.length === 0) {
    return { output: [txt(''), txt('Usage: grep [-invc] PATTERN FILE...', 't-error'), txt('')] };
  }
  const needle = ignoreCase ? pattern.toLowerCase() : pattern;
  const multi = files.length > 1;
  const out = [txt('')];
  for (const f of files) {
    const node = getNode(resolvePath(cwd, f));
    if (!node) { out.push(notFound('grep', f)); continue; }
    if (isDir(node)) { out.push(isADir('grep', f)); continue; }
    const { lines } = readFile(node);
    let count = 0;
    lines.forEach((line, i) => {
      const hay = ignoreCase ? line.toLowerCase() : line;
      const hit = hay.includes(needle);
      if (hit !== invert) {
        count++;
        if (!countOnly) {
          const prefix = (multi ? `${f}:` : '') + (showNum ? `${i + 1}:` : '');
          const safePrefix = prefix ? `<span class="t-dim">${escapeHtml(prefix)}</span>` : '';
          const body = invert ? escapeHtml(line) : highlightMatches(line, pattern, ignoreCase);
          out.push(html(safePrefix + body));
        }
      }
    });
    if (countOnly) out.push(txt(`${multi ? f + ':' : ''}${count}`, 't-dim'));
  }
  out.push(txt(''));
  return { output: out };
}

// wc — line / word / byte counts. Flags: -l -w -c (default: all three).
export function cmdWc(args = [], cwd) {
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const files = args.filter((a) => !a.startsWith('-'));
  const wantL = flags.includes('l'), wantW = flags.includes('w'), wantC = flags.includes('c');
  const all = !wantL && !wantW && !wantC;
  if (files.length === 0) {
    return { output: [txt(''), txt('Usage: wc [-lwc] FILE...', 't-error'), txt('')] };
  }
  const out = [txt('')];
  let tl = 0, tw = 0, tc = 0, valid = 0;
  const row = (l, w, c, label) => {
    const parts = [];
    if (all || wantL) parts.push(String(l).padStart(7));
    if (all || wantW) parts.push(String(w).padStart(7));
    if (all || wantC) parts.push(String(c).padStart(7));
    return txt(parts.join('') + ' ' + label, 't-dim');
  };
  for (const f of files) {
    const node = getNode(resolvePath(cwd, f));
    if (!node) { out.push(notFound('wc', f)); continue; }
    if (isDir(node)) { out.push(isADir('wc', f)); continue; }
    const content = fileContent(node);
    const l = (content.match(/\n/g) || []).length;
    const w = content.split(/\s+/).filter(Boolean).length;
    const c = content.length;
    tl += l; tw += w; tc += c; valid++;
    out.push(row(l, w, c, f));
  }
  if (valid > 1) out.push(row(tl, tw, tc, 'total'));
  out.push(txt(''));
  return { output: out };
}

function parseN(args) {
  let n = 10;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-n') { const v = parseInt(args[++i], 10); if (!Number.isNaN(v)) n = v; }
    else if (/^-n\d+$/.test(a)) n = parseInt(a.slice(2), 10);
    else if (/^-\d+$/.test(a)) n = parseInt(a.slice(1), 10);
    else if (!a.startsWith('-')) files.push(a);
  }
  return { n: Math.max(0, n), files };
}

function headTail(args, cwd, which) {
  const { n, files } = parseN(args);
  if (files.length === 0) {
    return { output: [txt(''), txt(`Usage: ${which} [-n N] FILE...`, 't-error'), txt('')] };
  }
  const out = [txt('')];
  const multi = files.length > 1;
  files.forEach((f, idx) => {
    const node = getNode(resolvePath(cwd, f));
    if (!node) { out.push(notFound(which, f)); return; }
    if (isDir(node)) { out.push(isADir(which, f)); return; }
    if (multi) { if (idx > 0) out.push(txt('')); out.push(txt(`==> ${f} <==`, 't-dim')); }
    const { lines, lang } = readFile(node);
    const slice = which === 'head' ? lines.slice(0, n) : lines.slice(-n);
    for (const line of slice) out.push(renderFileLine(line, lang));
  });
  out.push(txt(''));
  return { output: out };
}
export function cmdHead(args = [], cwd) { return headTail(args, cwd, 'head'); }
export function cmdTail(args = [], cwd) { return headTail(args, cwd, 'tail'); }

// tree — recursive ASCII tree. -a includes hidden entries.
export function cmdTree(args = [], cwd) {
  const showAll = args.includes('-a');
  const target = args.find((a) => !a.startsWith('-'));
  const abs = resolvePath(cwd, target);
  const root = getNode(abs);
  if (!root) {
    return { output: [txt(''), txt(`tree: ${target}: No such file or directory`, 't-error'), txt('')] };
  }
  const out = [txt(''), txt(target || abs, 't-blue')];
  let dirs = 0, files = 0;
  (function rec(node, prefix) {
    if (node.type !== 'dir') return;
    const children = Object.values(node.children)
      .filter((c) => showAll || !c.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name));
    children.forEach((c, i) => {
      const last = i === children.length - 1;
      const d = c.type === 'dir';
      if (d) dirs++; else files++;
      out.push(txt(prefix + (last ? '└── ' : '├── ') + c.name + (d ? '/' : ''), d ? 't-blue' : ''));
      if (d) rec(c, prefix + (last ? '    ' : '│   '));
    });
  })(root, '');
  out.push(txt(''));
  out.push(txt(`${dirs} ${dirs === 1 ? 'directory' : 'directories'}, ${files} ${files === 1 ? 'file' : 'files'}`, 't-dim'));
  out.push(txt(''));
  return { output: out };
}

function globToRegex(glob) {
  const esc = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp('^' + esc + '$', 'i');
}

// find [path] [-name glob] [-type f|d]
export function cmdFind(args = [], cwd) {
  let startArg = '.';
  let namePat = null, typeFilter = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-name') namePat = args[++i];
    else if (args[i] === '-type') typeFilter = args[++i];
    else if (!args[i].startsWith('-') && i === 0) startArg = args[i];
  }
  const abs = resolvePath(cwd, startArg);
  if (!getNode(abs)) {
    return { output: [txt(''), txt(`find: '${startArg}': No such file or directory`, 't-error'), txt('')] };
  }
  const rx = namePat ? globToRegex(namePat) : null;
  const out = [txt('')];
  let any = false;
  for (const [p, node] of walk(abs)) {
    if (typeFilter === 'f' && node.type !== 'file') continue;
    if (typeFilter === 'd' && node.type !== 'dir') continue;
    if (rx && !rx.test(node.name)) continue;
    out.push(txt(p, node.type === 'dir' ? 't-blue' : ''));
    any = true;
  }
  if (!any) out.push(txt('(no matches)', 't-dim'));
  out.push(txt(''));
  return { output: out };
}

// stat <path>
export function cmdStat(args = [], cwd) {
  const t = args.find((a) => !a.startsWith('-'));
  if (!t) return { output: [txt(''), txt('Usage: stat <file>', 't-error'), txt('')] };
  const abs = resolvePath(cwd, t);
  const s = stat(abs);
  if (!s) return { output: [txt(''), txt(`stat: ${t}: No such file or directory`, 't-error'), txt('')] };
  const type = s.type === 'dir' ? 'directory' : (s.pdf ? 'PDF document' : 'regular file');
  return {
    output: [
      txt(''),
      txt(`  File: ${abs}`, 't-dim'),
      txt(`  Size: ${s.bytes}\tBlocks: 8\t${type}`, 't-dim'),
      txt(`Access: (${s.perm})\tUid: ( 1000/ visitor)\tGid: ( 1000/  staff)`, 't-dim'),
      txt(`Modify: ${s.mtime}`, 't-dim'),
      txt(''),
    ],
  };
}

// file <path>
export function cmdFile(args = [], cwd) {
  const t = args.find((a) => !a.startsWith('-'));
  if (!t) return { output: [txt(''), txt('Usage: file <file>', 't-error'), txt('')] };
  const node = getNode(resolvePath(cwd, t));
  if (!node) return { output: [txt(''), txt(`${t}: cannot open (No such file or directory)`, 't-error'), txt('')] };
  let desc = 'ASCII text';
  if (isDir(node)) desc = 'directory';
  else if (node.pdf) desc = 'PDF document, version 1.7';
  else if (node.lang === 'python') desc = 'Python script, ASCII text executable';
  else if (node.lang === 'SQL') desc = 'ASCII text, SQL';
  else if (node.lang === 'markdown') desc = 'ASCII text, Markdown document';
  return { output: [txt(''), txt(`${t}: ${desc}`, 't-dim'), txt('')] };
}

// sort — sort file lines. -r reverse, -u unique, -f fold case.
export function cmdSort(args = [], cwd) {
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const files = args.filter((a) => !a.startsWith('-'));
  const rev = flags.includes('r'), uniq = flags.includes('u'), fold = flags.includes('f');
  if (!files.length) return { output: [txt(''), txt('Usage: sort [-ruf] FILE...', 't-error'), txt('')] };
  const out = [txt('')];
  let lines = [];
  for (const f of files) {
    const node = getNode(resolvePath(cwd, f));
    if (!node) { out.push(notFound('sort', f)); continue; }
    if (isDir(node)) { out.push(isADir('sort', f)); continue; }
    lines = lines.concat(readFile(node).lines);
  }
  lines.sort((a, b) => {
    const x = fold ? a.toLowerCase() : a;
    const y = fold ? b.toLowerCase() : b;
    return x < y ? -1 : x > y ? 1 : 0;
  });
  if (rev) lines.reverse();
  if (uniq) lines = lines.filter((l, i) => i === 0 || l !== lines[i - 1]);
  for (const l of lines) out.push(txt(l, 't-dim'));
  out.push(txt(''));
  return { output: out };
}

// uniq — collapse adjacent duplicate lines. -c count, -d dups only, -i ignore case.
export function cmdUniq(args = [], cwd) {
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const files = args.filter((a) => !a.startsWith('-'));
  const count = flags.includes('c'), dupsOnly = flags.includes('d'), ic = flags.includes('i');
  if (!files.length) return { output: [txt(''), txt('Usage: uniq [-cdi] FILE', 't-error'), txt('')] };
  const node = getNode(resolvePath(cwd, files[0]));
  if (!node) return { output: [txt(''), notFound('uniq', files[0]), txt('')] };
  if (isDir(node)) return { output: [txt(''), isADir('uniq', files[0]), txt('')] };
  const lines = readFile(node).lines;
  const eq = (a, b) => (ic ? a.toLowerCase() === b.toLowerCase() : a === b);
  const out = [txt('')];
  for (let i = 0; i < lines.length;) {
    let j = i + 1;
    while (j < lines.length && eq(lines[j], lines[i])) j++;
    const n = j - i;
    if (!dupsOnly || n > 1) {
      out.push(txt(count ? `${String(n).padStart(4)} ${lines[i]}` : lines[i], 't-dim'));
    }
    i = j;
  }
  out.push(txt(''));
  return { output: out };
}

// diff — naive line-by-line comparison of two files.
export function cmdDiff(args = [], cwd) {
  const files = args.filter((a) => !a.startsWith('-'));
  if (files.length < 2) return { output: [txt(''), txt('Usage: diff FILE1 FILE2', 't-error'), txt('')] };
  const n1 = getNode(resolvePath(cwd, files[0]));
  const n2 = getNode(resolvePath(cwd, files[1]));
  if (!n1) return { output: [txt(''), notFound('diff', files[0]), txt('')] };
  if (!n2) return { output: [txt(''), notFound('diff', files[1]), txt('')] };
  if (isDir(n1) || isDir(n2)) return { output: [txt(''), txt('diff: directories are not supported', 't-error'), txt('')] };
  const a = readFile(n1).lines;
  const b = readFile(n2).lines;
  const out = [txt('')];
  let same = true;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    same = false;
    if (a[i] !== undefined) out.push(html(`<span style="color:#FF6B6B">- ${escapeHtml(a[i])}</span>`));
    if (b[i] !== undefined) out.push(html(`<span style="color:#39D353">+ ${escapeHtml(b[i])}</span>`));
  }
  if (same) out.push(txt('(files are identical)', 't-dim'));
  out.push(txt(''));
  return { output: out };
}

// Read-only filesystem: touch / mkdir / rmdir / mv / cp all refuse, matching the
// rm permission-denied flavor. Single descriptor branches on ctx.name.
export function cmdReadOnlyFs(name, args = []) {
  const target = (args.find((a) => !a.startsWith('-')) || '').trim();
  const what = target ? `'${target}'` : 'this filesystem';
  return {
    output: [
      txt(''),
      txt(`${name}: cannot modify ${what}: Read-only file system`, 't-error'),
      txt('(This is a portfolio — the filesystem is for browsing only.)', 't-dim'),
      txt(''),
    ],
  };
}
