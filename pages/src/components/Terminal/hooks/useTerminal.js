import { useState, useEffect, useRef, useCallback } from 'react';
import { processCommand, getWelcomeOutput, getCompletions } from '../commands';
import { getPdfUrl } from '../handlers/utilCommands';
import { HOME, getNode } from '../data/filesystem';

import { readDisplayPreferences, readPreference, savePreference } from '../utils/displayPreferences';
export { FONT_SIZES, THEMES, COLORS } from '../utils/displayPreferences';

export default function useTerminal() {
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [fontSize, setFontSizeState] = useState(() => readDisplayPreferences().fontSize);
  const [theme, setThemeState] = useState(() => readDisplayPreferences().theme);
  const [accentColor, setColorState] = useState(() => readDisplayPreferences().accentColor);
  const [cwd, setCwdState] = useState(() => {
    const saved = readPreference('t-cwd', HOME);
    const node = saved ? getNode(saved) : null;
    return node && node.type === 'dir' ? saved : HOME;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bombing, setBombing] = useState(false);
  const [tabHint, setTabHint] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const rootRef = useRef(null);
  const bottomRef = useRef(null);
  const latestEntryRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView?.({ behavior, block: 'nearest' });
  }, []);

  const setFontSize = useCallback((size) => {
    setFontSizeState(size);
    savePreference('t-font-size', size);
  }, []);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    savePreference('t-theme', t);
  }, []);

  const setColor = useCallback((c) => {
    setColorState(c);
    savePreference('t-color', c);
  }, []);

  const setCwd = useCallback((p) => {
    setCwdState(p);
    savePreference('t-cwd', p);
  }, []);

  useEffect(() => {
    setHistory([{ id: 0, cmd: null, output: getWelcomeOutput() }]);
  }, []);

  useEffect(() => {
    if (!history.some(entry => entry.cmd)) return;
    if (document.activeElement === inputRef.current) {
      scrollToBottom('auto');
    } else {
      latestEntryRef.current?.scrollIntoView?.({ behavior: 'auto', block: 'start' });
    }
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

  const handleRootClick = useCallback((event) => {
    if (event.target.closest('.t-input-wrapper') && !window.getSelection()?.toString()) {
      focusInput();
    }
  }, [focusInput]);

  const runCommand = useCallback((cmd) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const result = processCommand(trimmed, { fontSize, theme, accentColor, cwd }, cmdHistory);
    const summary = result?.output?.filter(item => item.text?.trim()).map(item => item.text.trim()).join(' ').slice(0, 280);
    setAnnouncement(`Result ${cmdHistory.length + 1}. ${summary || `${trimmed}: completed.`}`);

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

    if (e.key === ' ' && e.ctrlKey) {
      e.preventDefault();
      handleTab(inputValue);
    } else if (e.key === 'Escape') {
      setTabHint(null);
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
  }, [runCommand]);

  return {
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
  };
}
