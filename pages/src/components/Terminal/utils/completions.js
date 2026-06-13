import { ALL_NAMES, getCommand } from '../registry';

function commonPrefix(strs) {
  if (!strs.length) return '';
  return strs.reduce((prefix, str) => {
    let i = 0;
    while (i < prefix.length && i < str.length && prefix[i] === str[i]) i++;
    return prefix.slice(0, i);
  });
}

// Tab-completion. Returns one of:
//   { type:'cmd', partial, matches, common }
//   { type:'arg', partial, matches, common, prefix }   // prefix = input up to the partial
//   { type:'none', matches: [] }
export function getCompletions(input, cwd) {
  const afterSpace = input.endsWith(' ');
  const parts = input.split(/\s+/);
  const cmdToken = parts[0].toLowerCase();

  // First word still being typed -> complete the command name.
  if (parts.length === 1 && !afterSpace) {
    const partial = cmdToken;
    const matches = ALL_NAMES.filter((c) => c.startsWith(partial));
    return { type: 'cmd', partial, matches, common: commonPrefix(matches) };
  }

  // Argument completion for commands that expose a path completer.
  const desc = getCommand(cmdToken);
  if (desc && desc.completer) {
    const partialArg = afterSpace ? '' : (parts[parts.length - 1] || '');
    const slash = partialArg.lastIndexOf('/');
    const dirPart = slash >= 0 ? partialArg.slice(0, slash + 1) : '';
    const basePart = slash >= 0 ? partialArg.slice(slash + 1) : partialArg;
    const candidates = desc.completer({ cwd, dirPart }) || [];
    const matches = candidates.filter((n) => n.toLowerCase().startsWith(basePart.toLowerCase()));
    // Everything in the input before the part we're completing.
    const prefix = input.slice(0, input.length - basePart.length);
    return { type: 'arg', partial: basePart, matches, common: commonPrefix(matches), prefix };
  }

  return { type: 'none', matches: [] };
}
