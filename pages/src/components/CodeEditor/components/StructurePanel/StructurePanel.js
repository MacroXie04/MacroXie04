import React from 'react';
import './StructurePanel.css';

const StructurePanel = ({ structureItems, hasActiveTab }) => {
  const renderChildren = (children = [], parentLevel = 0) => {
    return children.map((child, childIndex) => (
      <div
        key={`${child.name}-${childIndex}`}
        className="structure-item"
        style={{ paddingLeft: `${16 + (parentLevel + 1) * 16}px` }}
      >
        <span className={`structure-icon icon-${child.type}`}>{child.type === 'method' ? 'm' : 'f'}</span>
        <span className="structure-name">{child.name}</span>
      </div>
    ));
  };

  const renderStructureItem = (item, index) => {
    return (
      <div
        key={`${item.name}-${index}`}
        className="structure-item"
        style={{ paddingLeft: `${16 + item.level * 16}px` }}
      >
        <span className={`structure-icon icon-${item.type}`}>
          {item.type === 'class'
            ? 'C'
            : item.type === 'function'
              ? 'f'
              : item.type === 'method'
                ? 'm'
                : item.type === 'variable'
                  ? 'v'
                  : item.type === 'import'
                    ? 'i'
                    : item.type.startsWith('h')
                      ? '#'
                      : '•'}
        </span>
        <span className="structure-name">{item.name}</span>
        {item.children && item.children.length > 0 && (
          <div className="structure-children">{renderChildren(item.children, item.level)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="structure-panel">
      <div className="project-header">
        <span className="project-title">Structure</span>
      </div>
      <div className="structure-content">
        {structureItems.length === 0 ? (
          <div className="structure-placeholder">
            {hasActiveTab ? 'No structure found' : 'No file selected'}
          </div>
        ) : (
          <div className="structure-list">{structureItems.map(renderStructureItem)}</div>
        )}
      </div>
    </div>
  );
};

export default StructurePanel;

