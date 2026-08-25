import { ALL_NAMES, getCommand } from '../registry';
import { tokenizeShell } from './shell';

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
  const parsed = tokenizeShell(input, { allowIncomplete: true });
  const tokenValues = parsed.tokens.map((token) => token.value);
  const afterSpace = parsed.trailingWhitespace;
  const activeToken = afterSpace ? null : parsed.tokens[parsed.tokens.length - 1];
  const cmdToken = (tokenValues[0] || '').toLowerCase();

  // First word still being typed -> complete the command name.
  if (tokenValues.length <= 1 && !afterSpace) {
    const partial = cmdToken;
    const matches = ALL_NAMES.filter((c) => c.startsWith(partial));
    return { type: 'cmd', partial, matches, common: commonPrefix(matches) };
  }

  // Argument completion for commands that expose a path completer.
  const desc = getCommand(cmdToken);
  if (desc && desc.completer) {
    const args = tokenValues.slice(1);
    const partialArg = afterSpace ? '' : (activeToken?.value || '');
    const completedArgs = afterSpace ? args : args.slice(0, -1);
    const argIndex = completedArgs.length;
    const slash = partialArg.lastIndexOf('/');
    const dirPart = slash >= 0 ? partialArg.slice(0, slash + 1) : '';
    const basePart = slash >= 0 ? partialArg.slice(slash + 1) : partialArg;
    const candidates = desc.completer({
      cwd,
      input,
      args,
      completedArgs,
      argIndex,
      partial: partialArg,
      dirPart,
      basePart,
      afterSpace,
    }) || [];
    const matches = candidates.filter((n) => n.toLowerCase().startsWith(basePart.toLowerCase()));
    // Replace the active shell word, which also normalizes an unfinished quote
    // or escaped path into a directly executable unquoted completion.
    const tokenStart = afterSpace ? input.length : activeToken.start;
    const prefix = input.slice(0, tokenStart) + dirPart;
    return { type: 'arg', partial: basePart, matches, common: commonPrefix(matches), prefix };
  }

  return { type: 'none', matches: [] };
}
