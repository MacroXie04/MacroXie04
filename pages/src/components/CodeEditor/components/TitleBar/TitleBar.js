import './TitleBar.css';

const TitleBar = ({ currentFileName, fileExtension, onSettingsToggle }) => {
  return (
    <div className="title-bar">
      <div className="window-controls">
        <div className="control close" />
        <div className="control minimize" />
        <div className="control maximize" />
      </div>

      <div className="title-content">
        <span className="title-text">Hongzhe Xie</span>
        {currentFileName && <span className="title-separator">—</span>}
        {currentFileName && (
          <span className="title-file">
            <div className="file-icon title-file-icon" data-type={fileExtension} />
            {currentFileName}
          </span>
        )}
      </div>

      <button className="settings-button" onClick={onSettingsToggle} title="Settings">
        ⚙
      </button>
    </div>
  );
};

export default TitleBar;

