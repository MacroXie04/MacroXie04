const parsePythonStructure = (code) => {
  const lines = code.split('\n');
  const structure = [];
  let currentClass = null;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
      structure.push({
        type: 'import',
        name: trimmed,
        line: index + 1,
        level: 0,
      });
    }

    const classMatch = trimmed.match(/^class\s+(\w+)/);
    if (classMatch) {
      currentClass = {
        type: 'class',
        name: classMatch[1],
        line: index + 1,
        level: 0,
        children: [],
      };
      structure.push(currentClass);
    }

    const funcMatch = trimmed.match(/^def\s+(\w+)/);
    if (funcMatch) {
      const indentLevel = line.match(/^\s*/)[0].length;
      const funcItem = {
        type: indentLevel > 0 ? 'method' : 'function',
        name: funcMatch[1],
        line: index + 1,
        level: indentLevel > 0 ? 1 : 0,
      };

      if (currentClass && indentLevel > 0) {
        currentClass.children.push(funcItem);
      } else {
        structure.push(funcItem);
        currentClass = null;
      }
    }

    const varMatch = trimmed.match(/^(\w+)\s*=/);
    if (varMatch && !trimmed.startsWith('def ') && !trimmed.startsWith('class ')) {
      const indentLevel = line.match(/^\s*/)[0].length;
      if (indentLevel === 0) {
        structure.push({
          type: 'variable',
          name: varMatch[1],
          line: index + 1,
          level: 0,
        });
      }
    }
  });

  return structure;
};

const parseJavaScriptStructure = (code) => {
  const lines = code.split('\n');
  const structure = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
      structure.push({
        type: 'import',
        name: `${trimmed.substring(0, 50)}${trimmed.length > 50 ? '...' : ''}`,
        line: index + 1,
        level: 0,
      });
    }

    const classMatch = trimmed.match(/^(?:export\s+)?class\s+(\w+)/);
    if (classMatch) {
      structure.push({
        type: 'class',
        name: classMatch[1],
        line: index + 1,
        level: 0,
      });
    }

    const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
    if (funcMatch) {
      structure.push({
        type: 'function',
        name: funcMatch[1],
        line: index + 1,
        level: 0,
      });
    }

    const arrowMatch = trimmed.match(/^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
    if (arrowMatch) {
      structure.push({
        type: 'function',
        name: arrowMatch[1],
        line: index + 1,
        level: 0,
      });
    }

    const varMatch = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/);
    if (varMatch && !arrowMatch) {
      structure.push({
        type: 'variable',
        name: varMatch[1],
        line: index + 1,
        level: 0,
      });
    }
  });

  return structure;
};

const parseMarkdownStructure = (code) => {
  const lines = code.split('\n');
  const structure = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      structure.push({
        type: `h${level}`,
        name: headerMatch[2],
        line: index + 1,
        level: level - 1,
      });
    }
  });

  return structure;
};

export const parseStructure = (content, language) => {
  if (!content) {
    return [];
  }

  const normalizedLanguage = (language || '').toLowerCase();

  if (normalizedLanguage === 'python') {
    return parsePythonStructure(content);
  }
  if (normalizedLanguage === 'javascript' || normalizedLanguage === 'js') {
    return parseJavaScriptStructure(content);
  }
  if (normalizedLanguage === 'markdown' || normalizedLanguage === 'md') {
    return parseMarkdownStructure(content);
  }

  return [];
};

export { parsePythonStructure, parseJavaScriptStructure, parseMarkdownStructure };

