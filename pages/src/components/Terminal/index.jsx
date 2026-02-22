import { useState, useEffect, useRef, useCallback } from 'react';
import { processCommand, getWelcomeOutput, getCompletions, QUICK_COMMANDS } from './commands';
import './Terminal.css';

const HOSTNAME = 'visitor@hongzhe:~$';

const FONT_SIZES = {
  small:  '14px',
  medium: '17px',
  large:  '20px',
  xlarge: '23px',
};

export default function Terminal() {
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('t-font-size') || 'medium');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const setFontSize = useCallback((size) => {
    setFontSizeState(size);
    localStorage.setItem('t-font-size', size);
  }, []);

  useEffect(() => {
    setHistory([{ id: 0, cmd: null, output: getWelcomeOutput() }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [history]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const runCommand = useCallback((cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const result = processCommand(trimmed, fontSize);

    if (result?.openUrl) {
      window.open(result.openUrl, '_blank', 'noopener,noreferrer');
    }

    if (result?.action === 'setFontSize') {
      setFontSize(result.value);
    }

    if (result?.clear) {
      setHistory([]);
      setCmdHistory(prev => [trimmed, ...prev]);
      setHistoryIdx(-1);
      return;
    }

    setHistory(prev => [
      ...prev,
      { id: Date.now(), cmd: trimmed, output: result?.output || [] },
    ]);
    setCmdHistory(prev => [trimmed, ...prev]);
    setHistoryIdx(-1);
  }, [fontSize, setFontSize]);

  const handleTab = useCallback((currentInput) => {
    const result = getCompletions(currentInput);
    if (result.matches.length === 0) return;

    if (result.matches.length === 1) {
      // Unique match: complete and add trailing space
      if (result.type === 'cmd') {
        setInputValue(result.matches[0] + ' ');
      } else {
        setInputValue('cat ' + result.matches[0]);
      }
      return;
    }

    // Multiple matches: complete common prefix, show candidates
    let newInput = currentInput;
    if (result.type === 'cmd' && result.common.length > result.partial.length) {
      newInput = result.common;
      setInputValue(newInput);
    } else if (result.type === 'arg' && result.common.length > result.partial.length) {
      newInput = 'cat ' + result.common;
      setInputValue(newInput);
    }

    setHistory(prev => [
      ...prev,
      {
        id: Date.now(),
        cmd: newInput,
        output: [{ type: 'text', text: result.matches.join('    '), cls: 't-dim' }],
        isHint: true,
      },
    ]);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      handleTab(inputValue);
    } else if (e.key === 'Enter') {
      runCommand(inputValue);
      setInputValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(newIdx);
      if (newIdx >= 0) setInputValue(cmdHistory[newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInputValue(newIdx === -1 ? '' : cmdHistory[newIdx]);
    }
  }, [inputValue, historyIdx, cmdHistory, runCommand, handleTab]);

  const handleQuickCmd = useCallback((cmd) => {
    runCommand(cmd);
    setInputValue('');
    focusInput();
  }, [runCommand, focusInput]);

  const renderItem = (item, idx) => {
    if (item.type === 'profile') {
      return (
        <div key={idx} className="t-profile-card">
          <img src={item.imgSrc} alt={item.name} className="t-profile-img" />
          <div className="t-profile-info">
            <div className="t-profile-name">{item.name}</div>
            <div className="t-profile-role">{item.role}</div>
            <div className="t-profile-edu">{item.education}</div>
            <div className="t-profile-tagline">&quot;{item.tagline}&quot;</div>
            <div className="t-profile-links">
              <a href={`mailto:${item.email}`} className="t-link">{item.email}</a>
              <a href={item.github} target="_blank" rel="noopener noreferrer" className="t-link">
                {item.github.replace('https://', '')}
              </a>
              <span className="t-dim">{item.phone}</span>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === 'html') {
      return (
        <div
          key={idx}
          className="t-line"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: item.content }}
        />
      );
    }

    if (item.type === 'link') {
      const isExternal = item.href.startsWith('http');
      return (
        <div key={idx} className="t-line">
          <a
            href={item.href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="t-link"
            onClick={e => e.stopPropagation()}
          >
            {item.text}
          </a>
        </div>
      );
    }

    return (
      <div key={idx} className={`t-line ${item.cls || ''}`}>
        {item.text}
      </div>
    );
  };

  return (
    <div className="t-root" style={{ fontSize: FONT_SIZES[fontSize] }} onClick={focusInput}>
      {/* Title Bar */}
      <div className="t-titlebar">
        <div className="t-dots">
          <span className="t-dot t-dot-red" />
          <span className="t-dot t-dot-yellow" />
          <span className="t-dot t-dot-green" />
        </div>
        <div className="t-titlebar-title">visitor@hongzhe:~ — Portfolio Terminal</div>
        <button
          className="t-settings-btn"
          onClick={e => { e.stopPropagation(); setSettingsOpen(o => !o); }}
          type="button"
          aria-label="Settings"
        >
          ⚙
        </button>
        {settingsOpen && (
          <div className="t-settings-panel" onClick={e => e.stopPropagation()}>
            <div className="t-settings-label">Font Size</div>
            <div className="t-settings-options">
              {Object.keys(FONT_SIZES).map(size => (
                <button
                  key={size}
                  type="button"
                  className={`t-settings-opt${fontSize === size ? ' active' : ''}`}
                  onClick={() => { setFontSize(size); setSettingsOpen(false); }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Command Buttons */}
      <div className="t-quick-cmds" onClick={e => e.stopPropagation()}>
        {QUICK_COMMANDS.map(cmd => (
          <button
            key={cmd}
            className="t-quick-btn"
            onClick={() => handleQuickCmd(cmd)}
            type="button"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Output + Input Area */}
      <div className="t-output" onClick={focusInput}>
        {history.map(entry => (
          <div key={entry.id} className="t-entry">
            {entry.cmd && (
              <div className="t-prompt-line">
                <span className="t-prompt">{HOSTNAME}</span>
                <span className="t-cmd-text">&nbsp;{entry.cmd}</span>
              </div>
            )}
            {entry.output.map((item, idx) => renderItem(item, idx))}
          </div>
        ))}

        {/* Current input line */}
        <div className="t-input-wrapper">
          <span className="t-prompt">{HOSTNAME}&nbsp;</span>
          <input
            ref={inputRef}
            className="t-input"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="Terminal input"
          />
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
