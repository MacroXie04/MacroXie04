export function txt(text, cls = '') {
  return { type: 'text', text, cls };
}

export function html(content) {
  return { type: 'html', content };
}

// Escape text before interpolating it into an html() line. TerminalItem renders
// html items via dangerouslySetInnerHTML with NO sanitizer (DOMPurify is CMS-only),
// so any command that echoes user/file text into spans (cowsay, lolcat, figlet,
// grep, diff, ...) MUST run it through this first to avoid self-XSS.
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
