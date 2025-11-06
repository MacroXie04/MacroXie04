import React from 'react';
import './StatusBar.css';

const StatusBar = ({ language }) => {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span>GitHub Pages</span>
      </div>
      <div className="status-right">
        <span>{language}</span>
        <span>LF</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};

export default StatusBar;

