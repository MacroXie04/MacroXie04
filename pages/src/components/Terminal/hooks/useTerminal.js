import { useState, useEffect, useRef, useCallback } from 'react';
import { processCommand, getWelcomeOutput, getCompletions } from '../commands';
import { getPdfUrl } from '../handlers/utilCommands';
import { HOME, getNode } from '../data/filesystem';

export const FONT_SIZES = {
  small:  '14px',
  medium: '17px',
  large:  '20px',
  xlarge: '23px',
};

export const THEMES = [
  { key: 'default',   label: 'default'   },
  { key: 'dracula',   label: 'dracula'   },
  { key: 'nord',      label: 'nord'      },
  { key: 'solarized', label: 'solarized' },
  { key: 'light',     label: 'light'     },
];

export const COLORS = [
  { key: 'green',  label: 'green',  hex: '#39D353' },
  { key: 'blue',   label: 'blue',   hex: '#58A6FF' },
  { key: 'purple', label: 'purple', hex: '#BD93F9' },
  { key: 'orange', label: 'orange', hex: '#FFA657' },
  { key: 'cyan',   label: 'cyan',   hex: '#56D3C2' },
];

export default function useTerminal() {
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [fontSize, setFontSizeState] = useState(() => localStorage.getItem('t-font-size') || 'medium');
  const [theme, setThemeState] = useState(() => localStorage.getItem('t-theme') || 'default');
  const [accentColor, setColorState] = useState(() => localStorage.getItem('t-color') || 'green');
  const [cwd, setCwdState] = useState(() => {
    const saved = localStorage.getItem('t-cwd');
    const node = saved ? getNode(saved) : null;
    return node && node.type === 'dir' ? saved : HOME;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bombing, setBombing] = useState(false);
  const [tabHint, setTabHint] = useState(null);
  const rootRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView?.({ behavior, block: 'nearest' });
  }, []);

  const setFontSize = useCallback((size) => {
    setFontSizeState(size);
    localStorage.setItem('t-font-size', size);
  }, []);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem('t-theme', t);
  }, []);

  const setColor = useCallback((c) => {
    setColorState(c);
    localStorage.setItem('t-color', c);
  }, []);

  const setCwd = useCallback((p) => {
    setCwdState(p);
    localStorage.setItem('t-cwd', p);
  }, []);

  useEffect(() => {
    setHistory([{ id: 0, cmd: null, output: getWelcomeOutput() }]);
  }, []);

  useEffect(() => {
    const behavior = document.activeElement === inputRef.current ? 'auto' : 'smooth';
    scrollToBottom(behavior);
  }, [history, scrollToBottom]);

  useEffect(() => {
    let animationFrame = null;
    const root = rootRef.current;
    const viewport = window.visualViewport;

    const syncVisualViewport = () => {
      if (!root || !viewport || viewport.scale !== 1) return;

      root.style.setProperty('--t-viewport-height', `${viewport.height}px`);
      root.style.setProperty('--t-viewport-offset-top', `${viewport.offsetTop}px`);
    };

    const handleViewportChange = () => {
      syncVisualViewport();
      if (document.activeElement !== inputRef.current) return;

      const revealInput = () => {
        animationFrame = null;
        scrollToBottom('auto');
      };

      if (typeof window.requestAnimationFrame === 'function') {
        if (animationFrame !== null && typeof window.cancelAnimationFrame === 'function') {
          window.cancelAnimationFrame(animationFrame);
        }
        animationFrame = window.requestAnimationFrame(revealInput);
      } else {
        revealInput();
      }
    };

    syncVisualViewport();
    window.addEventListener('resize', handleViewportChange);
    viewport?.addEventListener('resize', handleViewportChange);
    viewport?.addEventListener('scroll', handleViewportChange);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      viewport?.removeEventListener('resize', handleViewportChange);
      viewport?.removeEventListener('scroll', handleViewportChange);
      if (animationFrame !== null && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(animationFrame);
      }
      root?.style.removeProperty('--t-viewport-height');
      root?.style.removeProperty('--t-viewport-offset-top');
    };
  }, [scrollToBottom]);

  useEffect(() => {
    const handleBeforePrint = () => {
      window.open(getPdfUrl(), '_blank', 'noopener,noreferrer');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, []);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleRootClick = useCallback(() => {
    if (!window.getSelection()?.toString()) {
      focusInput();
    }
  }, [focusInput]);

  const runCommand = useCallback((cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const result = processCommand(trimmed, { fontSize, theme, accentColor, cwd }, cmdHistory);

    if (result?.quit) {
      window.close();
      return;
    }
    if (result?.bomb) {
      setBombing(true);
      setTimeout(() => setBombing(false), 3500);
    }
    if (result?.openUrl) {
      window.open(result.openUrl, '_blank', 'noopener,noreferrer');
    }
    if (result?.downloadUrl) {
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = result.downloadFilename || '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    if (result?.action === 'setFontSize') {
      setFontSize(result.value);
    }
    if (result?.action === 'setTheme') {
      setTheme(result.value);
    }
    if (result?.action === 'setColor') {
      setColor(result.value);
    }
    if (result?.setCwd) {
      setCwd(result.setCwd);
    }
    if (result?.clear) {
      setHistory([]);
      setCmdHistory(prev => [trimmed, ...prev]);
      setHistoryIdx(-1);
      return;
    }

    setHistory(prev => [...prev, {
      id: Date.now(),
      cmd: trimmed,
      cwd,
      output: result?.output || [],
    }]);
    setCmdHistory(prev => [trimmed, ...prev]);
    setHistoryIdx(-1);
  }, [fontSize, theme, accentColor, cwd, setFontSize, setTheme, setColor, setCwd, cmdHistory]);

  const handleTab = useCallback((currentInput) => {
    const result = getCompletions(currentInput, cwd);
    if (result.matches.length === 0) return;

    if (result.matches.length === 1) {
      setTabHint(null);
      if (result.type === 'cmd') {
        setInputValue(result.matches[0] + ' ');
      } else {
        setInputValue(result.prefix + result.matches[0]);
      }
      return;
    }

    if (result.type === 'cmd' && result.common.length > result.partial.length) {
      setInputValue(result.common);
    } else if (result.type === 'arg' && result.common.length > result.partial.length) {
      setInputValue(result.prefix + result.common);
    }

    setTabHint(result.matches.join('    '));
  }, [cwd]);

  const handleInputChange = useCallback((value) => {
    setTabHint(null);
    setInputValue(value);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.nativeEvent?.isComposing || e.isComposing || e.keyCode === 229) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      handleTab(inputValue);
    } else if (e.key === 'Enter') {
      setTabHint(null);
      runCommand(inputValue);
      setInputValue('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setTabHint(null);
      const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(newIdx);
      if (newIdx >= 0) setInputValue(cmdHistory[newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setTabHint(null);
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInputValue(newIdx === -1 ? '' : cmdHistory[newIdx]);
    }
  }, [inputValue, historyIdx, cmdHistory, runCommand, handleTab]);

  const handleQuickCmd = useCallback((cmd) => {
    setTabHint(null);
    runCommand(cmd);
    setInputValue('');
    focusInput();
  }, [runCommand, focusInput]);

  return {
    history, inputValue, handleInputChange,
    tabHint,
    fontSize, setFontSize,
    theme, setTheme,
    accentColor, setColor,
    cwd,
    settingsOpen, setSettingsOpen,
    bombing,
    rootRef, bottomRef, inputRef,
    handleRootClick, handleKeyDown, handleQuickCmd,
  };
}
