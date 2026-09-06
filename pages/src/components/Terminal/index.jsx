import { useEffect, useRef, useState } from 'react';
import { QUICK_COMMANDS } from './commands';
import useTerminal, { FONT_SIZES, THEMES, COLORS } from './hooks/useTerminal';
import TerminalItem from './TerminalItem';
import { HOME } from './data/filesystem';
import terminal from '@assets/data/terminal/terminal.json';
import ui from '@assets/data/ui.json';
import miitLogo from '@assets/images/miit-logo.png';
import './Terminal.css';

const PROMPT_HOST = terminal.hostname.split(':')[0];
const PRIMARY_COMMANDS = ['projects', 'resume', 'contact'];

export function formatPrompt(cwd = HOME) {
  const path = cwd === HOME
    ? '~'
    : (cwd.startsWith(`${HOME}/`) ? `~${cwd.slice(HOME.length)}` : cwd);
  return `${PROMPT_HOST}:${path}$`;
}

export default function Terminal() {
  const [icpOpen, setIcpOpen] = useState(false);
  const icpTriggerRef = useRef(null);
  const icpDialogRef = useRef(null);
  const icpCloseRef = useRef(null);
  const settingsTriggerRef = useRef(null);
  const {
    history, inputValue, handleInputChange,
    tabHint, announcement,
    fontSize, setFontSize,
    theme, setTheme,
    accentColor, setColor,
    cwd,
    settingsOpen, setSettingsOpen,
    bombing,
    rootRef, bottomRef, inputRef, latestEntryRef,
    handleRootClick, handleKeyDown, handleQuickCmd,
  } = useTerminal();

  useEffect(() => {
    if (!settingsOpen) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        settingsTriggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [settingsOpen, setSettingsOpen]);

  useEffect(() => {
    if (!icpOpen) return undefined;
    const trigger = icpTriggerRef.current;

    const handleDialogKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIcpOpen(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        icpDialogRef.current?.querySelectorAll('a[href], button:not([disabled])') || []
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);
    icpCloseRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleDialogKeyDown);
      trigger?.focus();
    };
  }, [icpOpen]);

  return (
    <div
      ref={rootRef}
      className="t-root"
      style={{ fontSize: FONT_SIZES[fontSize] }}
      data-theme={theme}
      data-color={accentColor}
      onClick={handleRootClick}
    >
      <a className="t-skip-link" href="#terminal-content" onClick={event => {
        event.preventDefault();
        document.getElementById('terminal-content')?.focus();
      }}>Skip to portfolio</a>
      {bombing && (
        <div className="t-bomb-overlay">
          <div className="t-bomb-message">
            <div className="t-bomb-title">{ui.terminal.bombOverlay.title}</div>
            <div className="t-bomb-sub">{ui.terminal.bombOverlay.body}</div>
          </div>
        </div>
      )}

      {icpOpen && (
        <div
          className="t-icp-overlay"
          onClick={event => {
            event.stopPropagation();
            if (event.target === event.currentTarget) setIcpOpen(false);
          }}
        >
          <section
            ref={icpDialogRef}
            id="t-icp-dialog"
            className="t-icp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="t-icp-dialog-title"
          >
            <button
              ref={icpCloseRef}
              className="t-icp-close"
              type="button"
              aria-label={ui.terminal.icp.closeLabel}
              onClick={() => setIcpOpen(false)}
            >
              ×
            </button>

            <div className="t-icp-dialog-header">
              <div className="t-icp-dialog-logo-wrap">
                <img
                  className="t-icp-dialog-logo"
                  src={miitLogo}
                  alt=""
                  aria-hidden="true"
                />
              </div>
              <div>
                <div className="t-icp-eyebrow">中华人民共和国工业和信息化部</div>
                <h2 id="t-icp-dialog-title">{ui.terminal.icp.dialogTitle}</h2>
              </div>
            </div>

            <dl className="t-icp-details">
              <div className="t-icp-detail-row">
                <dt>{ui.terminal.icp.recordLabel}</dt>
                <dd className="t-icp-record">
                  <a
                    className="t-icp-record-link"
                    href={ui.terminal.icp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ui.terminal.icp.label}
                  </a>
                </dd>
              </div>
              <div className="t-icp-detail-row">
                <dt>{ui.terminal.icp.queryLabel}</dt>
                <dd>{ui.terminal.icp.systemName}</dd>
              </div>
            </dl>

          </section>
        </div>
      )}

      {/* Title Bar */}
      <div className="t-titlebar">
        <div className="t-dots">
          <span className="t-dot t-dot-red" />
          <span className="t-dot t-dot-yellow" />
          <span className="t-dot t-dot-green" />
        </div>
        <div className="t-titlebar-title">{ui.terminal.windowTitle}</div>
        <button
          ref={settingsTriggerRef}
          className="t-settings-btn"
          onClick={e => { e.stopPropagation(); setSettingsOpen(o => !o); }}
          type="button"
          aria-label="Settings"
          aria-expanded={settingsOpen}
          aria-controls="terminal-settings"
        >
          settings
        </button>
        {settingsOpen && (
          <div id="terminal-settings" className="t-settings-panel" aria-label="Display settings" onClick={e => e.stopPropagation()}>
            <div className="t-settings-label">{ui.terminal.settingsPanel.fontSize}</div>
            <div className="t-settings-options">
              {Object.keys(FONT_SIZES).map(size => (
                <button
                  key={size}
                  type="button"
                  className={`t-settings-opt${fontSize === size ? ' active' : ''}`}
                  aria-pressed={fontSize === size}
                  onClick={() => setFontSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="t-settings-label t-settings-section">{ui.terminal.settingsPanel.background}</div>
            <div className="t-settings-options">
              {THEMES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  className={`t-settings-opt${theme === t.key ? ' active' : ''}`}
                  aria-pressed={theme === t.key}
                  onClick={() => setTheme(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="t-settings-label t-settings-section">{ui.terminal.settingsPanel.accentColor}</div>
            <div className="t-settings-options">
              {COLORS.map(c => (
                <button
                  key={c.key}
                  type="button"
                  className={`t-settings-opt${accentColor === c.key ? ' active' : ''}`}
                  aria-pressed={accentColor === c.key}
                  onClick={() => setColor(c.key)}
                >
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c.hex, marginRight: 6, verticalAlign: 'middle' }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Command Buttons */}
      <nav className="t-quick-cmds" aria-label="Portfolio commands" onClick={e => e.stopPropagation()}>
        <div className="t-primary-commands">
          {PRIMARY_COMMANDS.map(cmd => (
            <button key={cmd} className="t-quick-btn t-primary-command" onClick={() => handleQuickCmd(cmd)} type="button">{cmd}</button>
          ))}
        </div>
        <div className="t-secondary-commands">
          {QUICK_COMMANDS.filter(cmd => !PRIMARY_COMMANDS.includes(cmd)).map(cmd => (
            <button
              key={cmd}
              className="t-quick-btn"
              onClick={() => handleQuickCmd(cmd)}
              type="button"
            >
              {cmd}
            </button>
          ))}
          <button
            ref={icpTriggerRef}
            className="t-quick-btn t-icp-trigger"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={icpOpen}
            aria-controls="t-icp-dialog"
            onClick={() => {
              setSettingsOpen(false);
              setIcpOpen(true);
            }}
          >
            <img
              className="t-icp-logo"
              src={miitLogo}
              alt=""
              aria-hidden="true"
            />
            <span>{ui.terminal.icp.label}</span>
          </button>
        </div>
      </nav>

      {/* Output + Input Area */}
      <main id="terminal-content" className="t-output" tabIndex={-1} aria-label="Portfolio and terminal output">
        <h1 className="t-sr-only">Hongzhe Xie — Software engineering portfolio</h1>
        {history.map(entry => (
          <div ref={entry === history[history.length - 1] ? latestEntryRef : null} key={entry.id} className="t-entry">
            {entry.cmd && (
              <div className="t-prompt-line">
                <span className="t-prompt">{formatPrompt(entry.cwd)}</span>
                <span className="t-cmd-text">&nbsp;{entry.cmd}</span>
              </div>
            )}
            {entry.output.map((item, idx) => (
              <TerminalItem key={idx} item={item} idx={idx} />
            ))}
          </div>
        ))}

        {/* Current input line */}
        <div className="t-input-wrapper">
          <span className="t-prompt">{formatPrompt(cwd)}</span>
          <input
            ref={inputRef}
            className="t-input"
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            enterKeyHint="send"
            aria-label="Terminal input"
            aria-describedby="terminal-input-help"
          />
        </div>
        <p id="terminal-input-help" className="t-input-help">Type a command or use the buttons above. Ctrl+Space completes; Tab moves between controls.</p>
        {tabHint && <div className="t-line t-dim">{tabHint}</div>}

        <div ref={bottomRef} />
      </main>
      <div className="t-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</div>
    </div>
  );
}
