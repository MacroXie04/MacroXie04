import { txt, html, escapeHtml } from './shared';

const PDF_FILENAME = 'Hongzhe_CV_Feb2026.pdf';

export function getPdfUrl() {
  return new URL(PDF_FILENAME, document.baseURI).href;
}

export function cmdPrint() {
  return {
    openUrl: getPdfUrl(),
    output: [txt(''), txt('Opening resume PDF for printing...', 't-green'), txt('')],
  };
}

export function cmdDownloadCv() {
  return {
    downloadUrl: getPdfUrl(),
    downloadFilename: PDF_FILENAME,
    output: [txt(''), txt(`Downloading ${PDF_FILENAME}...`, 't-green'), txt('')],
  };
}

export function cmdUname(args) {
  if (args.includes('-a')) {
    return { output: [txt(''), txt('Linux hongzhe 6.8.0-51-generic #52-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux', 't-dim'), txt('')] };
  }
  return { output: [txt(''), txt('Linux', 't-dim'), txt('')] };
}

export function cmdDate() {
  return { output: [txt(''), txt(new Date().toString(), 't-dim'), txt('')] };
}

export function cmdUptime() {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  return { output: [txt(''), txt(`${hh}:${mm}  up 3 days, 14:22, 1 user, load averages: 0.42 0.38 0.41`, 't-dim'), txt('')] };
}

export function cmdPing(args) {
  const host = args[0] || 'localhost';
  return {
    output: [
      txt(''),
      txt(`PING ${host}: 56 data bytes`, 't-dim'),
      txt('Request timeout for icmp_seq 0', 't-dim'),
      txt('Request timeout for icmp_seq 1', 't-dim'),
      txt('Request timeout for icmp_seq 2', 't-dim'),
      txt(`--- ${host} ping statistics ---`, 't-dim'),
      txt('3 packets transmitted, 0 received, 100.0% packet loss', 't-error'),
      txt(''),
    ],
  };
}

export function cmdExit() {
  return {
    output: [
      txt(''),
      txt('logout', 't-dim'),
      txt("(You can't exit a portfolio terminal. Welcome back!)", 't-green'),
      txt(''),
    ],
  };
}

export function cmdHistory(cmdHistory = []) {
  return {
    output: [
      txt(''),
      ...(cmdHistory.length === 0
        ? [txt('  (no history)', 't-dim')]
        : [...cmdHistory].reverse().map((cmd, i) =>
          txt(`  ${String(i + 1).padStart(4)}  ${cmd}`, 't-dim')
        )
      ),
      txt(''),
    ],
  };
}

export function cmdSettings(settings = {}) {
  const { fontSize = 'medium', theme = 'default', color = 'green' } = settings;
  return {
    output: [
      txt(''),
      txt('Settings', 't-title'),
      txt(''),
      txt(`  font    ${fontSize}`, 't-dim'),
      txt(`  theme   ${theme}`, 't-dim'),
      txt(`  color   ${color}`, 't-dim'),
      txt(''),
      txt('  Commands:', 't-dim'),
      txt('    font  <small|medium|large|xlarge>', 't-dim'),
      txt('    theme <default|dracula|nord|solarized|light>', 't-dim'),
      txt('    color <green|blue|purple|orange|cyan>', 't-dim'),
      txt(''),
    ],
  };
}

export function cmdTheme(args, currentTheme) {
  const THEMES = ['default', 'dracula', 'nord', 'solarized', 'light'];
  const t = args && args[0] && args[0].toLowerCase();
  if (!t) {
    return {
      output: [
        txt(''),
        txt(`Current theme: ${currentTheme || 'default'}`, 't-dim'),
        txt('Usage: theme <default|dracula|nord|solarized|light>', 't-dim'),
        txt(''),
      ],
    };
  }
  if (!THEMES.includes(t)) {
    return {
      output: [
        txt(''),
        txt(`theme: '${t}' is not a valid theme. Use: default  dracula  nord  solarized  light`, 't-error'),
        txt(''),
      ],
    };
  }
  return {
    action: 'setTheme',
    value: t,
    output: [txt(''), txt(`Theme set to: ${t}`, 't-green'), txt('')],
  };
}

export function cmdColor(args, currentColor) {
  const COLORS = ['green', 'blue', 'purple', 'orange', 'cyan'];
  const c = args && args[0] && args[0].toLowerCase();
  if (!c) {
    return {
      output: [
        txt(''),
        txt(`Current accent color: ${currentColor || 'green'}`, 't-dim'),
        txt('Usage: color <green|blue|purple|orange|cyan>', 't-dim'),
        txt(''),
      ],
    };
  }
  if (!COLORS.includes(c)) {
    return {
      output: [
        txt(''),
        txt(`color: '${c}' is not a valid color. Use: green  blue  purple  orange  cyan`, 't-error'),
        txt(''),
      ],
    };
  }
  return {
    action: 'setColor',
    value: c,
    output: [txt(''), txt(`Accent color set to: ${c}`, 't-green'), txt('')],
  };
}

export function cmdFont(args, currentFontSize) {
  const SIZES = ['small', 'medium', 'large', 'xlarge'];
  const size = args && args[0] && args[0].toLowerCase();
  if (!size) {
    return {
      output: [
        txt(''),
        txt(`Current font size: ${currentFontSize || 'medium'}`, 't-dim'),
        txt('Usage: font <small|medium|large|xlarge>', 't-dim'),
        txt(''),
      ],
    };
  }
  if (!SIZES.includes(size)) {
    return {
      output: [
        txt(''),
        txt(`font: '${size}' is not a valid size. Use: small  medium  large  xlarge`, 't-error'),
        txt(''),
      ],
    };
  }
  return {
    action: 'setFontSize',
    value: size,
    output: [txt(''), txt(`Font size set to: ${size}`, 't-green'), txt('')],
  };
}

// `lookup(name)` resolves a registry descriptor (canonical or alias). The man
// text comes from the descriptor's `man` field, set only where an entry should
// exist — so commands without one still print "No manual entry".
export function cmdMan(args, lookup) {
  if (!args[0]) {
    return { output: [txt(''), txt('What manual page do you want?', 't-error'), txt('Try: man ls', 't-dim'), txt('')] };
  }
  const d = lookup ? lookup(args[0]) : null;
  const entry = d && d.man;
  if (entry) {
    return {
      output: [
        txt(''),
        txt(`${args[0]}(1)  -- ${entry}`, 't-green'),
        txt(''),
        txt("This is a portfolio terminal — type 'help' for available commands.", 't-dim'),
        txt(''),
      ],
    };
  }
  return { output: [txt(''), txt(`No manual entry for ${args[0]}`, 't-error'), txt('')] };
}

export function cmdWhich(args, lookup) {
  if (!args[0]) return { output: [txt(''), txt('which: missing argument', 't-error'), txt('')] };
  const d = lookup ? lookup(args[0]) : null;
  const found = d && d.path;
  if (found) return { output: [txt(''), txt(found, 't-dim'), txt('')] };
  return { output: [txt(''), txt(`which: ${args[0]}: not found`, 't-error'), txt('')] };
}

export function cmdCal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const firstDow = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push('  ');
  for (let d = 1; d <= days; d++) cells.push(String(d).padStart(2));
  while (cells.length % 7 !== 0) cells.push('  ');

  const title = `${MONTHS[month]} ${year}`;
  const pad = Math.max(0, Math.floor((20 - title.length) / 2));
  const out = [
    txt(''),
    txt(' '.repeat(pad) + title, 't-green'),
    txt('Su Mo Tu We Th Fr Sa', 't-dim'),
  ];
  for (let w = 0; w < cells.length; w += 7) {
    const row = cells.slice(w, w + 7);
    if (row.some((c) => parseInt(c, 10) === today)) {
      out.push(html(row
        .map((c) => (parseInt(c, 10) === today
          ? `<span style="color:#39D353;font-weight:700">${escapeHtml(c)}</span>`
          : escapeHtml(c)))
        .join(' ')));
    } else {
      out.push(txt(row.join(' '), 't-dim'));
    }
  }
  out.push(txt(''));
  return { output: out };
}

export function cmdSeq(args = []) {
  const nums = args.filter((a) => !a.startsWith('-')).map(Number);
  let start = 1, step = 1, stop;
  if (nums.length === 1) [stop] = nums;
  else if (nums.length === 2) [start, stop] = nums;
  else if (nums.length >= 3) [start, step, stop] = nums;
  else return { output: [txt(''), txt('Usage: seq [first [incr]] last', 't-error'), txt('')] };
  if (![start, step, stop].every(Number.isFinite) || step === 0) {
    return { output: [txt(''), txt('seq: invalid argument', 't-error'), txt('')] };
  }
  const out = [txt('')];
  let count = 0;
  for (let i = start; (step > 0 ? i <= stop : i >= stop) && count < 1000; i += step) {
    out.push(txt(String(i), 't-dim')); count++;
  }
  if (count >= 1000) out.push(txt('... (capped at 1000)', 't-dim'));
  out.push(txt(''));
  return { output: out };
}

export function cmdExpr(args = []) {
  if (args.length < 3) return { output: [txt(''), txt('Usage: expr N op N', 't-error'), txt('')] };
  const a = Number(args[0]); const op = args[1]; const b = Number(args[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return { output: [txt(''), txt('expr: non-integer argument', 't-error'), txt('')] };
  }
  let r;
  switch (op) {
  case '+': r = a + b; break;
  case '-': r = a - b; break;
  case '*': case 'x': r = a * b; break;
  case '/': if (b === 0) return { output: [txt(''), txt('expr: division by zero', 't-error'), txt('')] }; r = Math.trunc(a / b); break;
  case '%': if (b === 0) return { output: [txt(''), txt('expr: division by zero', 't-error'), txt('')] }; r = a % b; break;
  default: return { output: [txt(''), txt(`expr: unknown operator '${op}'`, 't-error'), txt('')] };
  }
  return { output: [txt(''), txt(String(r), 't-dim'), txt('')] };
}

// bc — shunting-yard evaluator (NO eval). Supports + - * / % ^ and parens.
const PREC = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '^': 3 };
function bcApply(stack, op) {
  const b = stack.pop(); const a = stack.pop();
  if (a === undefined || b === undefined) throw new Error('operand');
  switch (op) {
  case '+': stack.push(a + b); break;
  case '-': stack.push(a - b); break;
  case '*': stack.push(a * b); break;
  case '/': if (b === 0) throw new Error('div0'); stack.push(a / b); break;
  case '%': stack.push(a % b); break;
  case '^': stack.push(Math.pow(a, b)); break;
  default: throw new Error('op');
  }
}
function bcEval(expr) {
  const tokens = [];
  for (let i = 0; i < expr.length;) {
    const c = expr[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      tokens.push({ t: 'num', v: parseFloat(expr.slice(i, j)) }); i = j; continue;
    }
    if ('+-*/%^()'.includes(c)) { tokens.push({ t: 'op', v: c }); i++; continue; }
    throw new Error('char');
  }
  const out = []; const ops = [];
  tokens.forEach((tk, k) => {
    if (tk.t === 'num') { out.push(tk.v); return; }
    if (tk.v === '(') { ops.push('('); return; }
    if (tk.v === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') bcApply(out, ops.pop());
      if (!ops.length) throw new Error('paren'); ops.pop(); return;
    }
    const prev = tokens[k - 1];
    if (tk.v === '-' && (!prev || (prev.t === 'op' && prev.v !== ')'))) out.push(0);
    while (ops.length && ops[ops.length - 1] !== '(' && PREC[ops[ops.length - 1]] >= PREC[tk.v]) bcApply(out, ops.pop());
    ops.push(tk.v);
  });
  while (ops.length) { const o = ops.pop(); if (o === '(') throw new Error('paren'); bcApply(out, o); }
  if (out.length !== 1 || !Number.isFinite(out[0])) throw new Error('eval');
  return Math.round(out[0] * 1e10) / 1e10;
}
export function cmdBc(args = []) {
  const expr = args.join(' ').trim();
  if (!expr) return { output: [txt(''), txt('Usage: bc <expression>   e.g. bc 2 + 3 * 4', 't-error'), txt('')] };
  try {
    return { output: [txt(''), txt(String(bcEval(expr)), 't-dim'), txt('')] };
  } catch (e) {
    return { output: [txt(''), txt('bc: syntax error', 't-error'), txt('')] };
  }
}

export function cmdEnv(cwd = '/home/visitor') {
  const vars = [
    'USER=visitor', 'HOME=/home/visitor', 'SHELL=/bin/hsh', 'TERM=xterm-256color',
    'PATH=/usr/local/bin:/usr/bin:/bin', 'LANG=en_US.UTF-8', 'EDITOR=vim',
    `PWD=${cwd}`, 'HOSTNAME=hongzhe.dev', 'ROLE=Full Stack & Cloud Engineer',
  ];
  return { output: [txt(''), ...vars.map((v) => txt(v, 't-dim')), txt('')] };
}

export function cmdBasename(args = []) {
  if (!args[0]) return { output: [txt(''), txt('Usage: basename PATH [suffix]', 't-error'), txt('')] };
  let base = args[0].replace(/\/+$/, '').split('/').pop() || '/';
  if (args[1] && base.endsWith(args[1]) && base !== args[1]) base = base.slice(0, -args[1].length);
  return { output: [txt(''), txt(base, 't-dim'), txt('')] };
}

export function cmdDirname(args = []) {
  if (!args[0]) return { output: [txt(''), txt('Usage: dirname PATH', 't-error'), txt('')] };
  const p = args[0].replace(/\/+$/, '');
  const idx = p.lastIndexOf('/');
  const d = idx < 0 ? '.' : (idx === 0 ? '/' : p.slice(0, idx));
  return { output: [txt(''), txt(d, 't-dim'), txt('')] };
}

export function cmdId(name = 'id') {
  if (name === 'groups') return { output: [txt(''), txt('staff visitors', 't-dim'), txt('')] };
  return { output: [txt(''), txt('uid=1000(visitor) gid=1000(staff) groups=1000(staff),100(visitors)', 't-dim'), txt('')] };
}

export function cmdLess(args = [], name = 'less') {
  const f = args.find((a) => !a.startsWith('-'));
  return {
    output: [
      txt(''),
      txt(`${name}: paging isn't available here — use 'cat${f ? ' ' + f : ''}' (or head/tail).`, 't-dim'),
      txt(''),
    ],
  };
}

export function cmdYes(args = []) {
  const s = args.length ? args.join(' ') : 'y';
  const out = [txt('')];
  for (let i = 0; i < 20; i++) out.push(txt(s, 't-dim'));
  out.push(txt('... (output capped — a real `yes` runs forever)', 't-dim'));
  out.push(txt(''));
  return { output: out };
}

export function cmdSleep(args = []) {
  const n = parseFloat(args[0]) || 0;
  return { output: [txt(''), txt(`slept for ${n}s (instantly — this is a simulation)`, 't-dim'), txt('')] };
}
