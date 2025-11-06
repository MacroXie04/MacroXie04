export const formatJavaScriptLine = (line) => {
  return line
    .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
    .replace(
      /\b(const|let|var|function|class|export|import|from|default|return|if|else|switch|case|break|continue|try|catch|finally|new|async|await|extends|implements|super|this)\b/g,
      '<span class="keyword">$1</span>'
    )
    .replace(/'([^']*)'/g, "<span class='string'>'$1'</span>")
    .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="builtin">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
    .replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '<span class="property">$1</span>:');
};

export const formatJSONLine = (line) => {
  return line
    .replace(/"([^"]*)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="keyword">$1</span>');
};

export const formatPythonLine = (line) => {
  return line
    .replace(/(#.*)/g, '<span class="comment">$1</span>')
    .replace(
      /\b(class|def|import|from|return|if|else|elif|for|while|try|except|with|as|pass|in|and|or|not|lambda|yield|raise|is|async|await|del|global|nonlocal|assert|break|continue)\b/g,
      '<span class="keyword">$1</span>'
    )
    .replace(/'([^']*)'/g, "<span class='string'>'$1'</span>")
    .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
    .replace(/\b(None|True|False)\b/g, '<span class="builtin">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
    .replace(/\bself\b/g, '<span class="property">self</span>');
};

