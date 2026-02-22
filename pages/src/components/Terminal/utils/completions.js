const ALL_COMMANDS = [
  'about', 'cat', 'cd', 'clear', 'color', 'contact', 'cv', 'date', 'download', 'echo', 'exit', 'experience',
  'font', 'github', 'help', 'history', 'ls', 'man', 'ping', 'print', 'pwd', 'rm',
  'quit', 'resume', 'settings', 'skills', 'sudo', 'theme', 'uname', 'uptime', 'which', 'whoami',
];

const CAT_FILES = ['README.md', 'experience.py', 'skills.sql'];

function commonPrefix(strs) {
  if (!strs.length) return '';
  return strs.reduce((prefix, str) => {
    let i = 0;
    while (i < prefix.length && i < str.length && prefix[i] === str[i]) i++;
    return prefix.slice(0, i);
  });
}

export function getCompletions(input) {
  const parts = input.split(/\s+/);
  const afterSpace = input.endsWith(' ');

  if (parts[0].toLowerCase() === 'cat' && (parts.length >= 2 || afterSpace)) {
    const partial = afterSpace ? '' : (parts[1] || '');
    const matches = CAT_FILES.filter(f => f.toLowerCase().startsWith(partial.toLowerCase()));
    const prefix = commonPrefix(matches);
    return { type: 'arg', prefix: 'cat ', partial, matches, common: prefix };
  }

  if (parts.length === 1 && !afterSpace) {
    const partial = parts[0].toLowerCase();
    const matches = ALL_COMMANDS.filter(c => c.startsWith(partial));
    const prefix = commonPrefix(matches);
    return { type: 'cmd', partial, matches, common: prefix };
  }

  return { type: 'none', matches: [] };
}
