// Small, dependency-free shell tokenizer used by command dispatch and tab
// completion. It implements the quoting rules this terminal exposes: whitespace
// separates words outside quotes, single/double quotes group text, and a
// backslash escapes the next character outside single quotes.
export function tokenizeShell(input, { allowIncomplete = false } = {}) {
  const source = String(input ?? '');
  const tokens = [];
  let value = '';
  let start = -1;
  let quote = null;
  let escaping = false;
  let tokenStarted = false;

  const beginToken = (index) => {
    if (!tokenStarted) {
      tokenStarted = true;
      start = index;
    }
  };

  const finishToken = (end) => {
    if (!tokenStarted) return;
    tokens.push({ value, start, end });
    value = '';
    start = -1;
    tokenStarted = false;
  };

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (escaping) {
      value += ch;
      escaping = false;
      continue;
    }

    if (quote === "'") {
      if (ch === "'") quote = null;
      else value += ch;
      continue;
    }

    if (quote === '"') {
      if (ch === '"') quote = null;
      else if (ch === '\\') escaping = true;
      else value += ch;
      continue;
    }

    if (/\s/.test(ch)) {
      finishToken(i);
      continue;
    }

    beginToken(i);
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === '\\') escaping = true;
    else value += ch;
  }

  if (escaping && !allowIncomplete) {
    return { tokens: [], error: 'trailing escape character' };
  }
  if (quote && !allowIncomplete) {
    return {
      tokens: [],
      error: quote === "'" ? 'unmatched single quote' : 'unmatched double quote',
    };
  }

  finishToken(source.length);
  return {
    tokens,
    error: null,
    incompleteQuote: quote,
    trailingEscape: escaping,
    trailingWhitespace: !tokenStarted && !quote && !escaping && /\s$/.test(source),
  };
}
