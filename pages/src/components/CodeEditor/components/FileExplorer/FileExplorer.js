import React from 'react';
import './FileExplorer.css';

const FileExplorer = ({
  fileStructure,
  expandedFolders,
  onToggleFolder,
  onOpenFile,
  activeTab,
  onToggleAllFolders,
  allFoldersExpanded,
}) => {
  const renderFolder = (folder, folderIndex) => {
    const isExpanded = expandedFolders[folderIndex] !== false;

    return (
      <div key={folderIndex} className="folder">
        <div className="folder-name" onClick={() => onToggleFolder(folderIndex)}>
          <span className={`folder-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
          <span className="folder-icon" />
          {folder.name}
        </div>
        {isExpanded && (
          <div className="folder-files">
            {folder.files.map((file, fileIndex) => {
              const fileName = file.name || '';
              const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
              const iconType = file.type || fileExtension;

              return (
                <div
                  key={fileIndex}
                  className={`file-item ${activeTab === file.key ? 'active' : ''}`}
                  onClick={() => onOpenFile(file.key)}
                >
                  <div className="file-icon" data-type={iconType} />
                  {file.name}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="project-panel">
      <div className="project-header">
        <span className="project-title">Project</span>
        <div className="project-actions">
          <button
            className="project-action-btn"
            title={allFoldersExpanded ? 'Collapse All' : 'Expand All'}
            onClick={onToggleAllFolders}
          >
            {allFoldersExpanded ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path
                  d="M4 6l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path
                  d="M4 10l4-4 4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="file-explorer">{fileStructure.map(renderFolder)}</div>
    </div>
  );
};

export default FileExplorer;

