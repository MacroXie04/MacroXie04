import React from 'react';
import './EditorArea.css';
import { formatJavaScriptLine, formatJSONLine, formatPythonLine } from '../../utils/syntaxHighlighting';

const EditorArea = ({ openTabs, activeTab, portfolioData, tabContents, lineNumbers, markdownMode }) => {
  const renderMarkdownContent = (content) => {
    const lines = content.split('\n');
    return (
      <div className="md-content">
        {lines.map((line, index) => (
          <div
            key={index}
            className="md-line"
            dangerouslySetInnerHTML={{ __html: formatMarkdownLine(line) }}
          />
        ))}
      </div>
    );
  };

  const renderCodeLines = (lines, formatter) => {
    return (
      <div className="code-content">
        {lines.map((line, index) => (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: formatter ? formatter(line) : line }}
          />
        ))}
      </div>
    );
  };

  const renderPlainCodeContent = (content) => {
    const lines = content.split('\n');
    return (
      <div className="code-content">
        {lines.map((line, index) => (
          <div key={index}>{line === '' ? '\u00A0' : line}</div>
        ))}
      </div>
    );
  };

  const renderJSONContent = (content) => {
    const lines = content.split('\n');
    return renderCodeLines(lines, formatJSONLine);
  };

  const renderPythonContent = (content) => {
    const lines = content.split('\n');
    return renderCodeLines(lines, formatPythonLine);
  };

  const renderJavaScriptContent = (content) => {
    const lines = content.split('\n');
    return renderCodeLines(lines, formatJavaScriptLine);
  };

  const renderContent = (content, language) => {
    const normalizedLanguage = (language || '').toLowerCase();

    if (normalizedLanguage === 'javascript') {
      return renderJavaScriptContent(content);
    }
    if (normalizedLanguage === 'json') {
      return renderJSONContent(content);
    }
    if (normalizedLanguage === 'python') {
      return renderPythonContent(content);
    }
    if (normalizedLanguage === 'sql') {
      return renderPlainCodeContent(content);
    }
    if (normalizedLanguage === 'markdown' || normalizedLanguage === 'md') {
      return markdownMode === 'code' ? renderPlainCodeContent(content) : renderMarkdownContent(content);
    }

    return renderMarkdownContent(content);
  };

  return (
    <div className="editor">
      {openTabs.map((tabKey) => {
        const tabData = portfolioData[tabKey];
        const content = tabContents[tabKey] ?? tabData?.content ?? '';
        const language = tabData?.language;

        return (
          <div key={tabKey} className={`editor-content ${activeTab === tabKey ? 'active' : ''}`}>
            <div className="line-numbers">
              {lineNumbers.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>
            {renderContent(content, language)}
          </div>
        );
      })}
    </div>
  );
};

const formatMarkdownLine = (line) => {
  if (line.trim() === '') {
    return '\u00A0';
  }

  if (line.startsWith('# ')) {
    return `<span class="md-h1">${line.substring(2)}</span>`;
  }
  if (line.startsWith('## ')) {
    return `<span class="md-h2">${line.substring(3)}</span>`;
  }
  if (line.startsWith('### ')) {
    return `<span class="md-h3">${line.substring(4)}</span>`;
  }

  if (line.startsWith('> ')) {
    return `<span class="md-blockquote">${line.substring(2)}</span>`;
  }

  if (line.startsWith('- ')) {
    return `<span class="md-li">• ${line.substring(2)}</span>`;
  }

  return line
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
};

export default EditorArea;

