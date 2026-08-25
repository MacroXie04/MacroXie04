export function highlightPython(line) {
  const keywords = ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif',
    'for', 'while', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'self',
    'with', 'as', 'try', 'except', 'pass'];
  let result = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (result.trim().startsWith('#') || result.trim() === '"""' || result.trim().startsWith('"""')) {
    return `<span class="t-comment">${result}</span>`;
  }

  result = result.replace(/"([^"]*)"/g, '<span class="t-string">"$1"</span>');
  result = result.replace(/'([^']*)'/g, "<span class=\"t-string\">'$1'</span>");
  keywords.forEach(kw => {
    result = result.replace(new RegExp(`\\b${kw}\\b`, 'g'), `<span class="t-keyword">${kw}</span>`);
  });
  return result;
}

export function highlightSQL(line) {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
    'CREATE', 'TABLE', 'VIEW', 'DROP', 'ALTER', 'IF', 'NOT', 'EXISTS', 'NULL',
    'PRIMARY', 'KEY', 'REFERENCES', 'UNIQUE', 'CHECK', 'BETWEEN', 'AND', 'OR', 'AS', 'ON',
    'JOIN', 'LEFT', 'RIGHT', 'INNER', 'GROUP', 'BY', 'ORDER', 'HAVING', 'DISTINCT',
    'WITH', 'DESC', 'ASC', 'SERIAL', 'INT', 'INTEGER', 'SMALLINT', 'NUMERIC',
    'VARCHAR', 'TEXT', 'BOOLEAN', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND', 'ARRAY_AGG',
  ];
  let result = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (result.trim().startsWith('--') || result.trim().startsWith('/*')
    || result.trim().startsWith('*') || result.trim().endsWith('*/')) {
    return `<span class="t-comment">${result}</span>`;
  }

  result = result.replace(/'([^']*)'/g, "<span class=\"t-string\">'$1'</span>");
  keywords.forEach(kw => {
    result = result.replace(new RegExp(`\\b${kw}\\b`, 'g'), `<span class="t-keyword">${kw}</span>`);
  });
  return result;
}

export function highlightMarkdown(line) {
  const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (/^#{1,3} /.test(escaped)) return `<span class="t-blue">${escaped}</span>`;
  if (escaped.startsWith('- ') || escaped.startsWith('* ')) return `<span class="t-dim">${escaped}</span>`;
  if (escaped.startsWith('**') && escaped.endsWith('**')) return `<span class="t-green">${escaped}</span>`;
  return escaped;
}
