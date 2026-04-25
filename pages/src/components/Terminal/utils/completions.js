const ALL_COMMANDS = [
  'about', 'cat', 'cd', 'clear', 'color', 'contact', 'cv', 'date', 'download', 'echo', 'exit', 'experience',
  'font', 'github', 'help', 'history', 'ls', 'man', 'ping', 'print', 'pwd', 'rm',
  'quit', 'resume', 'settings', 'seventeen', 'skills', 'sudo', 'svt', 'theme', 'uname', 'uptime', 'which', 'whoami',
];

const CAT_FILES = ['README.md', 'experience.py', 'skills.sql'];
const PATHS = ['.', '..', '~', 'resume', 'resume/'];
const LS_ARGS = ['-a', '-l', '-la', ...PATHS];
const FONT_SIZES = ['small', 'medium', 'large', 'xlarge'];
const THEMES = ['default', 'dracula', 'nord', 'solarized', 'light'];
const COLORS = ['green', 'blue', 'purple', 'orange', 'cyan'];
const MAN_PAGES = ['ls', 'cat', 'pwd', 'echo', 'clear', 'sudo', 'uname', 'date', 'man'];
const WHICH_TARGETS = ['ls', 'cat', 'pwd', 'echo', 'clear', 'sudo', 'uname', 'date', 'man', 'which'];

const ARG_COMPLETIONS = {
  cat: CAT_FILES,
  cd: PATHS,
  color: COLORS,
  font: FONT_SIZES,
  ls: LS_ARGS,
  man: MAN_PAGES,
  theme: THEMES,
  uname: ['-a'],
  which: WHICH_TARGETS,
};

function commonPrefix(strs) {
  if (!strs.length) return '';
  return strs.reduce((prefix, str) => {
    let i = 0;
    while (i < prefix.length && i < str.length && prefix[i] === str[i]) i++;
    return prefix.slice(0, i);
  });
}

function matchingOptions(options, partial) {
  return options.filter(option => option.toLowerCase().startsWith(partial.toLowerCase()));
}

export function getCompletions(input) {
  const parts = input.split(/\s+/);
  const afterSpace = input.endsWith(' ');
  const cmd = parts[0].toLowerCase();

  if (ARG_COMPLETIONS[cmd] && (parts.length === 2 || afterSpace)) {
    const partial = afterSpace ? '' : (parts[1] || '');
    const matches = matchingOptions(ARG_COMPLETIONS[cmd], partial);
    const prefix = commonPrefix(matches);
    return { type: 'arg', prefix: `${cmd} `, partial, matches, common: prefix };
  }

  if (parts.length === 1 && !afterSpace) {
    const partial = parts[0].toLowerCase();
    const matches = matchingOptions(ALL_COMMANDS, partial);
    const prefix = commonPrefix(matches);
    return { type: 'cmd', partial, matches, common: prefix };
  }

  return { type: 'none', matches: [] };
}
