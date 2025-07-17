import React, { useState, useEffect } from 'react';
import '../styles/VSCode.css';
import { portfolioData, fileStructure } from '../data';

const VSCodePortfolio = () => {
  const [activeTab, setActiveTab] = useState('readme');
  const [openTabs, setOpenTabs] = useState(['readme']);
  const [lineNumbers, setLineNumbers] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Generate line numbers for current content - always fill the viewport
  useEffect(() => {
    const updateLineNumbers = () => {
      const currentContent = portfolioData[activeTab]?.content || '';
      const contentLines = currentContent.split('\n').length;
      
      // Calculate minimum lines needed to fill the editor height
      const viewportHeight = window.innerHeight;
      
      // Use consistent values regardless of screen size
      const lineHeight = 28;
      const uiHeight = 120; // Title bar + tabs + status bar (adjusted for larger padding)
      const padding = 48; // Top and bottom padding
      
      const editorHeight = viewportHeight - uiHeight - padding;
      const minLines = Math.max(contentLines, Math.floor(editorHeight / lineHeight));
      
      setLineNumbers(Array.from({ length: minLines }, (_, i) => i + 1));
    };

    updateLineNumbers();
  }, [activeTab]);

  // Handle sidebar visibility and line numbers on window resize
  useEffect(() => {
    const handleResize = () => {
      const viewportWidth = window.innerWidth;
      
      // Auto-hide sidebar on mobile screens
      if (viewportWidth <= 768) {
        setSidebarVisible(false);
      } else {
        setSidebarVisible(true);
      }
      
      // Update line numbers with consistent values
      const currentContent = portfolioData[activeTab]?.content || '';
      const contentLines = currentContent.split('\n').length;
      const viewportHeight = window.innerHeight;
      
      const lineHeight = 28;
      const uiHeight = 120; // Adjusted for larger padding
      const padding = 48;
      
      const editorHeight = viewportHeight - uiHeight - padding;
      const minLines = Math.max(contentLines, Math.floor(editorHeight / lineHeight));
      setLineNumbers(Array.from({ length: minLines }, (_, i) => i + 1));
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const openFile = (fileKey) => {
    if (!openTabs.includes(fileKey)) {
      setOpenTabs([...openTabs, fileKey]);
    }
    setActiveTab(fileKey);
    
    // Auto-close sidebar on mobile after selecting a file
    if (window.innerWidth <= 768) {
      setSidebarVisible(false);
    }
  };

  const closeTab = (fileKey, e) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(tab => tab !== fileKey);
    setOpenTabs(newTabs);
    
    if (activeTab === fileKey && newTabs.length > 0) {
      setActiveTab(newTabs[newTabs.length - 1]);
    }
  };

  const renderContent = (content, language) => {
    if (language === 'javascript') {
      return renderJavaScriptContent(content);
    } else if (language === 'json') {
      return renderJSONContent(content);
    } else if (language === 'python') {
      return renderPythonContent(content);
    } else {
      return renderMarkdownContent(content);
    }
  };

  const renderMarkdownContent = (content) => {
    const lines = content.split('\n');
    return (
      <div className="md-content">
        {lines.map((line, index) => (
          <div key={index} className="md-line" dangerouslySetInnerHTML={{ __html: formatMarkdownLine(line) }} />
        ))}
      </div>
    );
  };

  const formatMarkdownLine = (line) => {
    // Handle empty lines
    if (line.trim() === '') {
      return '\u00A0'; // Non-breaking space to maintain line height
    }

    // Handle headers
    if (line.startsWith('# ')) {
      return `<span class="md-h1">${line.substring(2)}</span>`;
    } else if (line.startsWith('## ')) {
      return `<span class="md-h2">${line.substring(3)}</span>`;
    } else if (line.startsWith('### ')) {
      return `<span class="md-h3">${line.substring(4)}</span>`;
    }
    
    // Handle blockquotes
    if (line.startsWith('> ')) {
      return `<span class="md-blockquote">${line.substring(2)}</span>`;
    }
    
    // Handle list items
    if (line.startsWith('- ')) {
      return `<span class="md-li">• ${line.substring(2)}</span>`;
    }

    // Handle regular text with inline formatting
    return line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  };

  const renderJavaScriptContent = (content) => {
    const lines = content.split('\n');
    return (
      <div className="code-content">
        {lines.map((line, index) => (
          <div key={index}>
            {formatJavaScriptLine(line)}
          </div>
        ))}
      </div>
    );
  };

  const formatJavaScriptLine = (line) => {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: line
            .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
            .replace(/\b(const|let|var|function|class|export|import|from|default)\b/g, '<span class="keyword">$1</span>')
            .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
            .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
            .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
            .replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '<span class="property">$1</span>:')
        }}
      />
    );
  };

  const renderJSONContent = (content) => {
    const lines = content.split('\n');
    return (
      <div className="code-content">
        {lines.map((line, index) => (
          <div key={index}>
            {formatJSONLine(line)}
          </div>
        ))}
      </div>
    );
  };

  const formatJSONLine = (line) => {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: line
            .replace(/"([^"]*)":/g, '<span class="json-key">"$1"</span>:')
            .replace(/:\s*"([^"]*)"/g, ': <span class="json-string">"$1"</span>')
            .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
            .replace(/\b(true|false|null)\b/g, '<span class="keyword">$1</span>')
        }}
      />
    );
  };

  const renderPythonContent = (content) => {
    const lines = content.split('\n');
    return (
      <div className="code-content">
        {lines.map((line, index) => (
          <div key={index}>
            {formatPythonLine(line)}
          </div>
        ))}
      </div>
    );
  };

  const formatPythonLine = (line) => {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: line
            .replace(/(#.*)/g, '<span class="comment">$1</span>')
            .replace(/\b(class|def|import|from|return|if|else|elif|for|while|try|except|with|as)\b/g, '<span class="keyword">$1</span>')
            .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
            .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
            .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
            .replace(/\bself\b/g, '<span class="property">self</span>')
        }}
      />
    );
  };

  return (
    <div className="vscode-container">
      {/* Title Bar */}
      <div className="title-bar">
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarVisible(!sidebarVisible)}
        >
          ☰
        </button>
        <span>Hongzhe Xie - Portfolio</span>
        <div className="window-controls">
          <div className="control minimize"></div>
          <div className="control maximize"></div>
          <div className="control close"></div>
        </div>
      </div>

      <div className="main-content">
        {/* Mobile overlay */}
        {sidebarVisible && (
          <div 
            className="sidebar-overlay"
            onClick={() => setSidebarVisible(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}>
          <div className="sidebar-header">Explorer</div>
          <div className="file-explorer">
            {fileStructure.map((folder, folderIndex) => (
              <div key={folderIndex} className="folder">
                <div className="folder-name">
                  {folder.name}
                </div>
                {folder.files.map((file, fileIndex) => (
                  <div
                    key={fileIndex}
                    className={`file-item ${activeTab === file.key ? 'active' : ''}`}
                    onClick={() => openFile(file.key)}
                  >
                    <div className="file-icon">{file.icon}</div>
                    {file.name}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="editor-area">
          <div className="tabs">
            {openTabs.map((tabKey) => {
              const tabData = portfolioData[tabKey];
              return (
                <div
                  key={tabKey}
                  className={`tab ${activeTab === tabKey ? 'active' : ''}`}
                  onClick={() => setActiveTab(tabKey)}
                >
                  <span>{tabData?.title}</span>
                  <div className="tab-close" onClick={(e) => closeTab(tabKey, e)}>
                    ×
                  </div>
                </div>
              );
            })}
          </div>

          <div className="editor">
            {openTabs.map((tabKey) => {
              const tabData = portfolioData[tabKey];
              return (
                <div
                  key={tabKey}
                  className={`editor-content ${activeTab === tabKey ? 'active' : ''}`}
                >
                  <div className="line-numbers">
                    {lineNumbers.map((num) => (
                      <div key={num}>{num}</div>
                    ))}
                  </div>
                  {renderContent(tabData?.content, tabData?.language)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>GitHub Pages</span>
        </div>
        <div className="status-right">
          <span>{portfolioData[activeTab]?.language || 'Markdown'}</span>
          <span>LF</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default VSCodePortfolio; 