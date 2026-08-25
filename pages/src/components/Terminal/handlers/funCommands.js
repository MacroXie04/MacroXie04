import { txt, html, escapeHtml } from './shared';
import { PROFILE } from '../data/profile';
import { SKILL_GROUPS } from '../data/skillsData';
import { EXPERIENCE_ITEMS } from '../data/experienceData';
import { renderFiglet } from '../data/figletFont';

// Fixed colors (inline) — class t-green is remapped by the accent theme, so any
// command whose color is semantically meaningful sets it inline instead.
const GREEN = 'color:#39D353';
const RAINBOW = ['#FF6B6B', '#FFA657', '#F9E2AF', '#39D353', '#56D3C2', '#58A6FF', '#BD93F9'];

function rainbow(str, offset = 0) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    out += `<span style="color:${RAINBOW[(i + offset) % RAINBOW.length]}">${escapeHtml(str[i])}</span>`;
  }
  return out;
}

function topSkills(n) {
  return SKILL_GROUPS
    .flatMap((g) => g.skills)
    .slice()
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, n)
    .map((s) => s.name);
}

// neofetch / screenfetch — ASCII logo + system card from real portfolio data.
export function cmdNeofetch() {
  const logo = [
    '#     #  #     #',
    '#     #   #   # ',
    '#     #    # #  ',
    '#######     #   ',
    '#     #    # #  ',
    '#     #   #   # ',
    '#     #  #     #',
  ];
  const exp = EXPERIENCE_ITEMS[0];
  const info = [
    ['', 'visitor@hongzhe'],
    ['', '---------------'],
    ['OS', 'Portfolio Linux x86_64'],
    ['Host', 'hongzhe.dev'],
    ['Kernel', '6.8.0-portfolio'],
    ['Uptime', '3 days, 14:22'],
    ['Shell', 'hsh 5.2'],
    ['Role', PROFILE.role],
    ['Education', PROFILE.education],
    ['Skills', topSkills(3).join(', ')],
    ['Latest', `${exp.title} @ ${exp.org}`],
    ['Contact', PROFILE.email],
  ];
  const logoW = Math.max(...logo.map((l) => l.length));
  const lines = Math.max(logo.length, info.length);
  const rows = [txt('')];
  for (let i = 0; i < lines; i++) {
    const left = `<span style="${GREEN}">${escapeHtml((logo[i] || '').padEnd(logoW))}</span>`;
    let right = '';
    if (info[i]) {
      const [label, val] = info[i];
      right = label
        ? `<span class="t-blue">${escapeHtml(label)}</span><span class="t-dim">: </span>${escapeHtml(val)}`
        : `<span style="${GREEN}">${escapeHtml(val)}</span>`;
    }
    rows.push(html(`${left}   ${right}`));
  }
  const swatch = RAINBOW.concat('#888888')
    .map((c) => `<span style="background:${c};color:${c}">███</span>`)
    .join('');
  rows.push(html(`<span style="${GREEN}">${escapeHtml(''.padEnd(logoW))}</span>   ${swatch}`));
  rows.push(txt(''));
  return { output: rows };
}

// cowsay / cowthink — a cow with a speech (or thought) bubble.
export function cmdCowsay(args = [], name = 'cowsay') {
  const think = name === 'cowthink';
  const text = args && args.length ? args.join(' ') : PROFILE.tagline;
  const border = '-'.repeat(text.length + 2);
  const cow = think
    ? [
      '       o   ^__^',
      '        o  (oo)\\_______',
      '           (__)\\       )\\/\\',
      '               ||----w |',
      '               ||     ||',
    ]
    : [
      '        \\   ^__^',
      '         \\  (oo)\\_______',
      '            (__)\\       )\\/\\',
      '                ||----w |',
      '                ||     ||',
    ];
  return {
    output: [
      txt(''),
      txt(' _' + border, 't-dim'),
      txt(`${think ? '(' : '<'} ${text} ${think ? ')' : '>'}`),
      txt(' -' + border, 't-dim'),
      ...cow.map((l) => txt(l, 't-dim')),
      txt(''),
    ],
  };
}

// figlet / banner / toilet — big ASCII text. toilet adds rainbow coloring.
export function cmdFiglet(args = [], name = 'figlet') {
  const text = args && args.length ? args.join(' ') : 'HELLO';
  const rows = renderFiglet(text);
  const out = [txt('')];
  rows.forEach((r, i) => {
    out.push(html(name === 'toilet'
      ? rainbow(r, i)
      : `<span style="${GREEN}">${escapeHtml(r)}</span>`));
  });
  out.push(txt(''));
  return { output: out };
}

// lolcat / rainbow — rainbow-gradient text.
export function cmdLolcat(args = []) {
  const text = args && args.length ? args.join(' ') : 'Dream it. Chase it. Code it.';
  return { output: [txt(''), html(rainbow(text)), txt('')] };
}

// fortune — a random adage; some interpolate real portfolio data.
export function cmdFortune() {
  const py = (SKILL_GROUPS[0].skills.find((s) => s.name === 'Python') || {}).years || 7;
  const exp = EXPERIENCE_ITEMS[0];
  const fortunes = [
    'Dream it. Chase it. Code it.',
    'A SELECT statement a day keeps the bugs away.',
    `${py} years of Python and still reading the docs.`,
    `Currently shipping: ${exp.title} @ ${exp.org}.`,
    "There are 10 kinds of people: those who read binary and those who don't.",
    'git commit -m "final FINAL v3 (for real this time)"',
    'It works on my machine. ¯\\_(ツ)_/¯',
    "The cloud is just someone else's computer.",
    'Premature optimization is the root of all evil.  — Donald Knuth',
    'sudo make me a sandwich.',
  ];
  const pick = fortunes[Math.floor(Math.random() * fortunes.length)];
  return { output: [txt(''), txt(pick, 't-green'), txt('')] };
}

// vim / vi / emacs / nano — the "how do I exit" joke.
export function cmdEditorTrap(name = 'vim') {
  const tips = {
    vim: 'To exit Vim: press Esc, then type :q! and Enter.',
    vi: 'To exit vi: press Esc, then type :q! and Enter.',
    emacs: "To exit Emacs: C-x C-c. (Or just close the tab — we won't judge.)",
    nano: 'To exit nano: Ctrl+X. The friendliest editor.',
  };
  return {
    output: [
      txt(''),
      txt(`${name}: this is a portfolio terminal, not a real editor.`, 't-green'),
      txt(tips[name] || tips.vim, 't-dim'),
      txt("Type 'help' to see what you can actually run.", 't-dim'),
      txt(''),
    ],
  };
}

// sl — the steam locomotive you get for fat-fingering ls.
export function cmdSl() {
  const train = [
    '      ====        ________                ___________',
    '  _D _|  |_______/        \\__I_I_____===__|_________|',
    '   |(_)---  |   H\\________/ |   |        =|___ ___|',
    '   /     |  |   H  |  |     |   |         ||_| |_||',
    '  |      |  |   H  |__--------------------| [___] |',
    '  | ________|___H__/__|_____/[][]~\\_______|       |',
    '  |/ |   |-----------I_____I [][] []  D   |=======|__',
  ];
  return {
    output: [txt(''), ...train.map((l) => txt(l, 't-dim')), txt(''),
      txt('(you typed sl instead of ls — choo choo! 🚂)', 't-dim'), txt('')],
  };
}

// matrix / cmatrix — one static frame of green digital rain.
export function cmdMatrix() {
  const cols = 48, rows = 12;
  const out = [txt('')];
  for (let r = 0; r < rows; r++) {
    let row = '';
    for (let c = 0; c < cols; c++) {
      const ch = Math.random() < 0.5 ? '0' : '1';
      const op = (Math.random() * 0.7 + 0.3).toFixed(2);
      row += `<span style="color:#39D353;opacity:${op}">${ch}</span>`;
    }
    out.push(html(row));
  }
  out.push(txt(''));
  out.push(txt('Wake up, Neo… (a static frame — type clear to dismiss)', 't-dim'));
  out.push(txt(''));
  return { output: out };
}

// weather / wttr — a canned, offline forecast card (no network).
export function cmdWeather() {
  return {
    output: [
      txt(''),
      txt('Weather report: Merced, CA', 't-title'),
      txt(''),
      txt('     \\   /     Sunny', 't-dim'),
      txt('      .-.      72 °F', 't-dim'),
      txt('   ― (   ) ―   ↗ 6 mph', 't-dim'),
      txt('      `-’      10 mi', 't-dim'),
      txt('     /   \\     0.0 in', 't-dim'),
      txt(''),
      txt('(offline canned forecast — no network calls)', 't-dim'),
      txt(''),
    ],
  };
}

// htop / top — a static process monitor with joke processes.
export function cmdHtop() {
  const bar = (pct, color) => {
    const n = Math.round(pct / 10);
    return `<span style="color:${color}">${'|'.repeat(n)}</span>${'.'.repeat(10 - n)} ${pct}%`;
  };
  const out = [txt('')];
  out.push(html(`CPU [${bar(37, '#39D353')}]`));
  out.push(html(`Mem [${bar(58, '#FFA657')}]`));
  out.push(html(`Swp [${bar(4, '#58A6FF')}]`));
  out.push(txt(''));
  out.push(txt('  PID USER       CPU%  MEM%  COMMAND', 't-blue'));
  [
    ['1337', 'visitor', '12.0', '3.4', 'node portfolio'],
    ['2048', 'visitor', '6.5', '2.1', 'vite dev'],
    ['4096', 'visitor', '1.2', '0.8', 'coffee --brew'],
    ['8128', 'visitor', '0.0', '0.1', 'sleep 99999'],
  ].forEach((p) => out.push(txt(`${p[0].padStart(5)} ${p[1].padEnd(9)} ${p[2].padStart(5)} ${p[3].padStart(5)}  ${p[4]}`, 't-dim')));
  out.push(txt(''));
  out.push(txt('(static snapshot — type clear to dismiss)', 't-dim'));
  out.push(txt(''));
  return { output: out };
}

// please / thanks / thx — politeness. please re-dispatches via ctx.dispatch.
export function cmdPlease(ctx) {
  if (ctx.name === 'thanks' || ctx.name === 'thx') {
    return { output: [txt(''), txt("You're welcome! 😊", 't-green'), txt('')] };
  }
  const rest = (ctx.args || []).join(' ').trim();
  if (!rest) {
    return { output: [txt(''), txt('please: please what? (try: please ls)', 't-dim'), txt('')] };
  }
  const result = ctx.dispatch(rest) || {};
  return {
    ...result,
    output: [txt(''), txt('Since you asked so nicely:', 't-green'), ...(result.output || [])],
  };
}

// sandwich — xkcd 149. Also reached by the "make me a sandwich" phrase hook.
export function cmdSandwich(ctx) {
  const sudo = /\bsudo\b/.test((ctx.raw || '').toLowerCase());
  if (sudo) return { output: [txt(''), txt('Okay. 🥪', 't-green'), txt('')] };
  return {
    output: [
      txt(''),
      txt('What? Make it yourself.', 't-error'),
      txt("(Hint: try 'sudo make me a sandwich'.)", 't-dim'),
      txt(''),
    ],
  };
}

// telnet — the towel.blinkenlights.nl Star Wars ASCIImation easter egg.
export function cmdTelnet(args = []) {
  const host = args[0] || '';
  if (!host) return { output: [txt(''), txt('Usage: telnet host', 't-error'), txt('')] };
  if (/towel\.blinkenlights/.test(host)) {
    const vader = [
      '        .-.',
      '       |o,o|   I find your lack of',
      '       |)__)   commits disturbing.',
      '       -"-"-',
    ];
    return {
      output: [txt(''), txt(`Trying ${host}...`, 't-dim'), txt(`Connected to ${host}.`, 't-dim'), txt(''),
        ...vader.map((l) => txt(l, 't-green')), txt(''), txt('(Star Wars ASCIImation — abridged)', 't-dim'), txt('')],
    };
  }
  return { output: [txt(''), txt(`telnet: could not resolve ${host}: Name or service not known`, 't-error'), txt('')] };
}

// aafire / fire — a static ASCII flame.
export function cmdAafire() {
  const flame = [
    ['        (', '#FF6B6B'],
    ['       ) \\', '#FF6B6B'],
    ['      /   )', '#FFA657'],
    ['     ( /\\  )', '#FFA657'],
    ['     )(  )(', '#F9E2AF'],
    ['    (/ \\)(/ \\)', '#F9E2AF'],
    ['   jgs^^^^^^^^', '#888888'],
  ];
  return {
    output: [txt(''), ...flame.map(([l, c]) => html(`<span style="color:${c}">${escapeHtml(l)}</span>`)),
      txt(''), txt('(press q… just kidding — type clear)', 't-dim'), txt('')],
  };
}

// coffee / brew / tea — HTTP 418.
export function cmdCoffee(name = 'coffee') {
  const drink = name === 'tea' ? 'tea' : 'coffee';
  return {
    output: [
      txt(''),
      txt("418 I'm a teapot", 't-error'),
      txt(`The server refuses to brew ${drink}, because it is — permanently — a teapot. ☕`, 't-dim'),
      txt(''),
    ],
  };
}

// ascii / logo — the branded wordmark.
export function cmdAscii() {
  const rows = renderFiglet('HX');
  return {
    output: [txt(''), ...rows.map((r) => html(`<span style="${GREEN}">${escapeHtml(r)}</span>`)),
      txt(''), txt('Hongzhe Xie · Full Stack & Cloud Engineer', 't-dim'), txt('')],
  };
}

// claude / anthropic / ask — a nod to how this terminal was built. No network:
// `claude <question>` gets a canned reply (this is a static page).
export function cmdClaude(args = []) {
  const q = (args || []).join(' ').trim();
  if (q) {
    return {
      output: [
        txt(''),
        txt(`you:    ${q}`, 't-dim'),
        txt("claude: Can't reach the API from a static portfolio — but for the record,"),
        txt('        this whole terminal (and its ~70 commands) was built with Claude Code. 🤖'),
        txt('        For the real thing, visit claude.ai.'),
        txt(''),
      ],
    };
  }
  const rows = renderFiglet('CLAUDE');
  return {
    output: [
      txt(''),
      ...rows.map((r) => html(`<span style="color:#D97757">${escapeHtml(r)}</span>`)),
      txt(''),
      txt("Claude — Anthropic's AI assistant.", 't-green'),
      txt('This CLI portfolio was built with Claude Code.', 't-dim'),
      txt('Ask away:  claude <your question>', 't-dim'),
      txt(''),
    ],
  };
}

// hollywood / hacker — movie-grade "hacking" that ends in ACCESS GRANTED.
export function cmdHollywood() {
  const lines = [
    'Initializing kernel exploit...',
    'Bypassing firewall [████████████] 100%',
    'Decrypting RSA-4096 ... done',
    'Injecting payload into the mainframe...',
    'Rerouting through 7 proxies...',
    'Downloading the entire internet... 99%',
  ];
  return {
    output: [txt(''), ...lines.map((l) => txt(l, 't-green')), txt(''),
      txt('ACCESS GRANTED', 't-green'), txt('(just kidding — this is a portfolio 😄)', 't-dim'), txt('')],
  };
}
