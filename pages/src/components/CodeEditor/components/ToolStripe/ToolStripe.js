import './ToolStripe.css';

const ToolStripe = ({ activeView, leftPanelVisible, onProjectClick, onStructureClick }) => {
  const projectActive = activeView === 'project' && leftPanelVisible;
  const structureActive = activeView === 'structure' && leftPanelVisible;

  return (
    <div className="tool-stripe">
      <button
        className={`tool-button ${projectActive ? 'active' : ''}`}
        title="Project"
        onClick={onProjectClick}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 3h5l1 2h8v10H3V3z" />
        </svg>
      </button>
      <button
        className={`tool-button ${structureActive ? 'active' : ''}`}
        title="Structure"
        onClick={onStructureClick}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <rect x="3" y="3" width="14" height="2" />
          <rect x="5" y="7" width="12" height="2" />
          <rect x="7" y="11" width="10" height="2" />
          <rect x="5" y="15" width="12" height="2" />
        </svg>
      </button>
    </div>
  );
};

export default ToolStripe;

