import { txt } from './shared';

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

export function cmdMan(args) {
  if (!args[0]) {
    return { output: [txt(''), txt('What manual page do you want?', 't-error'), txt('Try: man ls', 't-dim'), txt('')] };
  }
  const known = {
    ls: 'List directory contents', cat: 'Concatenate and print files',
    pwd: 'Return working directory name', echo: 'Write arguments to stdout',
    clear: 'Clear terminal screen', sudo: 'Execute a command as another user',
    uname: 'Print operating system name', date: 'Display or set date and time',
    man: 'Format and display manual pages',
  };
  const entry = known[args[0].toLowerCase()];
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

export function cmdWhich(args) {
  if (!args[0]) return { output: [txt(''), txt('which: missing argument', 't-error'), txt('')] };
  const paths = {
    ls: '/bin/ls', cat: '/bin/cat', pwd: '/bin/pwd', echo: '/bin/echo',
    clear: '/usr/bin/clear', sudo: '/usr/bin/sudo', uname: '/usr/bin/uname',
    date: '/bin/date', man: '/usr/bin/man', which: '/usr/bin/which',
  };
  const found = paths[args[0].toLowerCase()];
  if (found) return { output: [txt(''), txt(found, 't-dim'), txt('')] };
  return { output: [txt(''), txt(`which: ${args[0]}: not found`, 't-error'), txt('')] };
}
