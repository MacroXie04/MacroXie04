import React, { useEffect, useMemo, useState } from 'react';
import '../../styles/variables.css';
import '../../styles/global.css';
import './CodeEditor.css';
import { portfolioData, fileStructure } from '../../data';
import TitleBar from './components/TitleBar/TitleBar';
import SettingsPanel from './components/SettingsPanel/SettingsPanel';
import ToolStripe from './components/ToolStripe/ToolStripe';
import FileExplorer from './components/FileExplorer/FileExplorer';
import StructurePanel from './components/StructurePanel/StructurePanel';
import TabBar from './components/TabBar/TabBar';
import EditorArea from './components/EditorArea/EditorArea';
import StatusBar from './components/StatusBar/StatusBar';
import { useLineNumbers } from './hooks/useLineNumbers';
import { useContentLoader } from './hooks/useContentLoader';
import { parseStructure } from './utils/contentParsers';

const CodeEditor = () => {
  const [activeTab, setActiveTab] = useState('readme');
  const [openTabs, setOpenTabs] = useState(['readme']);
  const [tabContents, setTabContents] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(() => {
    return fileStructure.reduce((acc, _, index) => {
      return { ...acc, [index]: true };
    }, {});
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [activeView, setActiveView] = useState('project');
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [markdownMode, setMarkdownMode] = useState('preview');

  const lineNumbers = useLineNumbers(activeTab, tabContents, portfolioData);
  useContentLoader({ openTabs, portfolioData, tabContents, setTabContents });

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-theme', theme);
  }, [fontSize, theme]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') {
        return;
      }
      const viewportWidth = window.innerWidth;
      if (viewportWidth <= 1024) {
        setLeftPanelVisible(false);
      } else {
        setLeftPanelVisible(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openFile = (fileKey) => {
    if (!openTabs.includes(fileKey)) {
      setOpenTabs((prev) => [...prev, fileKey]);
    }
    setActiveTab(fileKey);
    setMarkdownMode('preview');
  };

  const closeTab = (fileKey) => {
    setOpenTabs((prevTabs) => {
      const updatedTabs = prevTabs.filter((tab) => tab !== fileKey);
      if (fileKey === activeTab) {
        if (updatedTabs.length > 0) {
          setActiveTab(updatedTabs[updatedTabs.length - 1]);
        }
      }
      return updatedTabs;
    });
  };

  const toggleFolder = (folderIndex) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderIndex]: !prev[folderIndex],
    }));
  };

  const toggleAllFolders = () => {
    const allExpanded = fileStructure.every((folder, index) => expandedFolders[index] !== false);
    const nextState = fileStructure.reduce((acc, _, index) => {
      acc[index] = !allExpanded;
      return acc;
    }, {});
    setExpandedFolders(nextState);
  };

  const allFoldersExpanded = useMemo(() => {
    return fileStructure.every((folder, index) => expandedFolders[index] !== false);
  }, [expandedFolders, fileStructure]);

  const currentStructure = useMemo(() => {
    const content = tabContents[activeTab] ?? portfolioData[activeTab]?.content ?? '';
    const language = portfolioData[activeTab]?.language ?? '';
    return parseStructure(content, language);
  }, [activeTab, tabContents, portfolioData]);

  const currentFile = portfolioData[activeTab];
  const currentFileName = currentFile?.title || 'Untitled';
  const currentFileLanguage = currentFile?.language || '';

  const getFileExtension = (fileName) => {
    const match = fileName.match(/\.(\w+)$/);
    return match ? match[1].toLowerCase() : '';
  };

  const fileExtension = getFileExtension(currentFileName) || currentFileLanguage.toLowerCase();

  const handleProjectViewClick = () => {
    if (activeView === 'project' && leftPanelVisible) {
      setLeftPanelVisible(false);
    } else {
      setActiveView('project');
      setLeftPanelVisible(true);
    }
  };

  const handleStructureViewClick = () => {
    if (activeView === 'structure' && leftPanelVisible) {
      setLeftPanelVisible(false);
    } else {
      setActiveView('structure');
      setLeftPanelVisible(true);
    }
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
  };

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleMarkdownModeChange = (mode) => {
    setMarkdownMode(mode);
  };

  return (
    <div className="code-editor-container">
      <TitleBar
        currentFileName={currentFileName}
        fileExtension={fileExtension}
        onSettingsToggle={() => setSettingsOpen((prev) => !prev)}
      />

      <SettingsPanel
        open={settingsOpen}
        fontSize={fontSize}
        theme={theme}
        onFontSizeChange={handleFontSizeChange}
        onThemeChange={handleThemeChange}
        onClose={() => setSettingsOpen(false)}
      />

      <div className="main-content">
        <div className="left-sidebar">
          <ToolStripe
            activeView={activeView}
            leftPanelVisible={leftPanelVisible}
            onProjectClick={handleProjectViewClick}
            onStructureClick={handleStructureViewClick}
          />

          {leftPanelVisible && (
            activeView === 'project' ? (
              <FileExplorer
                fileStructure={fileStructure}
                expandedFolders={expandedFolders}
                onToggleFolder={toggleFolder}
                onOpenFile={openFile}
                activeTab={activeTab}
                onToggleAllFolders={toggleAllFolders}
                allFoldersExpanded={allFoldersExpanded}
              />
            ) : (
              <StructurePanel
                structureItems={currentStructure}
                hasActiveTab={Boolean(activeTab)}
              />
            )
          )}
        </div>

        <div className="editor-area">
          <TabBar
            openTabs={openTabs}
            activeTab={activeTab}
            portfolioData={portfolioData}
            onSelectTab={setActiveTab}
            onCloseTab={closeTab}
            markdownMode={markdownMode}
            onMarkdownModeChange={handleMarkdownModeChange}
          />

          <EditorArea
            openTabs={openTabs}
            activeTab={activeTab}
            portfolioData={portfolioData}
            tabContents={tabContents}
            lineNumbers={lineNumbers}
            markdownMode={markdownMode}
          />
        </div>
      </div>

      <StatusBar language={portfolioData[activeTab]?.language || 'Markdown'} />
    </div>
  );
};

export default CodeEditor;

