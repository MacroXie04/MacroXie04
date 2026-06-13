import { txt, html } from './shared';
import { highlightMarkdown, highlightPython, highlightSQL } from '../utils/highlight';
import {
  HOME, resolvePath, getNode, listDir, readFile,
  isDir, rawSize, humanSize,
} from '../data/filesystem';

// Render one file line, dispatching to the highlighter for the node's language
// (read FROM the node, never re-derived from the typed extension). Reused by
// head/tail so they highlight exactly like cat.
export function renderFileLine(line, lang) {
  if (lang === 'markdown') return html(highlightMarkdown(line));
  if (lang === 'python') return html(highlightPython(line));
  if (lang === 'SQL') return html(highlightSQL(line));
  return txt(line);
}

const MTIME = 'Feb 22 10:30';

function longRow(node, displayName) {
  const d = isDir(node);
  const name = displayName !== undefined ? displayName : node.name;
  const perm = d ? 'drwxr-xr-x' : (node.name.startsWith('.') ? '-rw-------' : '-rw-r--r--');
  const size = humanSize(rawSize(node)).padStart(5);
  const cls = node.name.startsWith('.') ? 't-dim' : (d ? 't-blue' : '');
  return txt(`${perm}  1 visitor  staff  ${size}  ${node.mtime || MTIME}  ${name}`, cls);
}

const SELF = { type: 'dir', name: '.', children: {} };
const PARENT = { type: 'dir', name: '..', children: {} };

export function cmdLs(args = [], cwd = HOME) {
  const flags = args.filter((a) => a.startsWith('-')).join('');
  const targetArg = args.find((a) => !a.startsWith('-'));
  const longFmt = flags.includes('l');
  const showAll = flags.includes('a');

  const abs = resolvePath(cwd, targetArg);
  const node = getNode(abs);
  if (!node) {
    return { output: [txt(''), txt(`ls: ${targetArg}: No such file or directory`, 't-error'), txt('')] };
  }

  let entries;
  if (isDir(node)) {
    entries = listDir(node, { all: showAll });
    if (showAll) entries = [SELF, PARENT, ...entries];
  } else {
    entries = [node];
  }

  if (longFmt) {
    return {
      output: [
        txt(''),
        txt(`total ${entries.length}`, 't-dim'),
        ...entries.map((e) => longRow(e)),
        txt(''),
      ],
    };
  }

  const line = entries
    .map((e) => (isDir(e) ? e.name + '/' : e.name))
    .join('  ');
  return { output: [txt(''), txt(line || '', 't-dim'), txt('')] };
}

export function cmdCat(args = [], cwd = HOME) {
  const files = (Array.isArray(args) ? args : [args]).filter((a) => a && !a.startsWith('-'));
  if (files.length === 0) {
    return [txt(''), txt('Usage: cat <file>', 't-error'), txt('')];
  }

  const out = [txt('')];
  for (const f of files) {
    const node = getNode(resolvePath(cwd, f));
    if (!node) {
      out.push(txt(`cat: ${f}: No such file or directory`, 't-error'));
      continue;
    }
    if (isDir(node)) {
      out.push(txt(`cat: ${f}: Is a directory`, 't-error'));
      continue;
    }
    if (node.pdf) {
      out.push(txt(`cat: ${f}: binary file — run \`cv\` to download the PDF`, 't-error'));
      continue;
    }
    const { lines, lang } = readFile(node);
    for (const line of lines) out.push(renderFileLine(line, lang));
  }
  out.push(txt(''));
  return out;
}

export function cmdGithub() {
  return { openUrl: 'https://github.com/MacroXie04', output: [txt(''), txt('Opening GitHub profile...', 't-green'), txt('')] };
}

export function cmdPwd(cwd = HOME) {
  return { output: [txt('', ''), txt(cwd || HOME, 't-dim'), txt('')] };
}

export function cmdEcho(args) {
  return { output: [txt(''), txt(args.join(' ')), txt('')] };
}

export function cmdCd(args = [], cwd = HOME) {
  const target = args[0];
  const abs = target ? resolvePath(cwd, target) : HOME;
  const node = getNode(abs);
  if (!node) {
    return { output: [txt(''), txt(`cd: ${target}: No such file or directory`, 't-error'), txt('')] };
  }
  if (!isDir(node)) {
    return { output: [txt(''), txt(`cd: ${target}: Not a directory`, 't-error'), txt('')] };
  }
  return { setCwd: abs, output: [] };
}
