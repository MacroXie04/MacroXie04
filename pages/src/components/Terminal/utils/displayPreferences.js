export const FONT_SIZES = {
  small:  '0.875rem',
  medium: '1.0625rem',
  large:  '1.25rem',
  xlarge: '1.4375rem',
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

// A blocked storage API should not prevent someone from reading the portfolio.
export function readPreference(key, fallback, allowed) {
  try {
    const value = localStorage.getItem(key);
    return value && (!allowed || allowed.includes(value)) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function savePreference(key, value) {
  try { localStorage.setItem(key, value); } catch { /* In-memory settings still work. */ }
}

export function readDisplayPreferences() {
  return {
    fontSize: readPreference('t-font-size', 'medium', Object.keys(FONT_SIZES)),
    theme: readPreference('t-theme', 'default', THEMES.map(item => item.key)),
    accentColor: readPreference('t-color', 'green', COLORS.map(item => item.key)),
  };
}
