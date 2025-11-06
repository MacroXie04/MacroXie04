import React from 'react';
import './SettingsPanel.css';

const FONT_SIZES = ['small', 'medium', 'large', 'xlarge'];
const THEMES = [
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'light', label: 'Light', icon: '☀️' },
];

const SettingsPanel = ({ open, fontSize, theme, onFontSizeChange, onThemeChange, onClose }) => {
  if (!open) {
    return null;
  }

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel">
        <div className="settings-header">
          <h3>Settings</h3>
          <button className="settings-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h4>Font Size</h4>
            <div className="font-size-options">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  className={`font-size-option ${fontSize === size ? 'active' : ''}`}
                  onClick={() => onFontSizeChange(size)}
                >
                  {size === 'xlarge' ? 'X-Large' : size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h4>Theme</h4>
            <div className="theme-options">
              {THEMES.map(({ value, label, icon }) => (
                <button
                  key={value}
                  className={`theme-option ${theme === value ? 'active' : ''}`}
                  onClick={() => onThemeChange(value)}
                >
                  <span className="theme-icon">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;

