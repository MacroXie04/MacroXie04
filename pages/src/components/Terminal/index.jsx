import { QUICK_COMMANDS } from './commands';
import useTerminal, { FONT_SIZES, THEMES, COLORS } from './hooks/useTerminal';
import TerminalItem from './TerminalItem';
import './Terminal.css';

const HOSTNAME = 'visitor@hongzhe:~$';

export default function Terminal() {
  const {
    history, inputValue, handleInputChange,
    tabHint,
    fontSize, setFontSize,
    theme, setTheme,
    accentColor, setColor,
    settingsOpen, setSettingsOpen,
    bombing,
    bottomRef, inputRef,
    handleRootClick, handleKeyDown, handleQuickCmd,
  } = useTerminal();

  return (
    <div
      className="t-root"
      style={{ fontSize: FONT_SIZES[fontSize] }}
      data-theme={theme}
      data-color={accentColor}
      onClick={handleRootClick}
    >
      {bombing && (
        <div className="t-bomb-overlay">
          <div className="t-bomb-message">
            <div className="t-bomb-title">PERMISSION DENIED</div>
            <div className="t-bomb-sub">nice try — you don&apos;t have sudo privileges here</div>
          </div>
        </div>
      )}

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
          settings
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

            <div className="t-settings-label t-settings-section">Background</div>
            <div className="t-settings-options">
              {THEMES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  className={`t-settings-opt${theme === t.key ? ' active' : ''}`}
                  onClick={() => setTheme(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="t-settings-label t-settings-section">Accent Color</div>
            <div className="t-settings-options">
              {COLORS.map(c => (
                <button
                  key={c.key}
                  type="button"
                  className={`t-settings-opt${accentColor === c.key ? ' active' : ''}`}
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
      <div className="t-output">
        {history.map(entry => (
          <div key={entry.id} className="t-entry">
            {entry.cmd && (
              <div className="t-prompt-line">
                <span className="t-prompt">{HOSTNAME}</span>
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
          <span className="t-prompt">{HOSTNAME}&nbsp;</span>
          <input
            ref={inputRef}
            className="t-input"
            value={inputValue}
            onChange={e => handleInputChange(e.target.value)}
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
        {tabHint && <div className="t-line t-dim">{tabHint}</div>}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
