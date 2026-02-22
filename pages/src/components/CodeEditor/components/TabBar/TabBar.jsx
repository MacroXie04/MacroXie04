import './TabBar.css';

const TabBar = ({
  openTabs,
  activeTab,
  portfolioData,
  onSelectTab,
  onCloseTab,
  markdownMode,
  onMarkdownModeChange,
}) => {
  const handleTabClick = (tabKey) => {
    onSelectTab(tabKey);
  };

  const handleCloseClick = (event, tabKey) => {
    event.stopPropagation();
    onCloseTab(tabKey);
  };

  const isMarkdown = portfolioData[activeTab]?.language?.toLowerCase() === 'markdown';

  return (
    <div className="tabs">
      {openTabs.map((tabKey) => {
        const tabData = portfolioData[tabKey];
        return (
          <div
            key={tabKey}
            className={`tab ${activeTab === tabKey ? 'active' : ''}`}
            onClick={() => handleTabClick(tabKey)}
          >
            <span>{tabData?.title}</span>
            <div className="tab-close" onClick={(event) => handleCloseClick(event, tabKey)}>
              ×
            </div>
          </div>
        );
      })}

      {isMarkdown && (
        <div className="markdown-toggle">
          <button
            className={`markdown-mode-btn ${markdownMode === 'code' ? 'active' : ''}`}
            onClick={() => onMarkdownModeChange('code')}
          >
            Code
          </button>
          <button
            className={`markdown-mode-btn ${markdownMode === 'preview' ? 'active' : ''}`}
            onClick={() => onMarkdownModeChange('preview')}
          >
            Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default TabBar;

