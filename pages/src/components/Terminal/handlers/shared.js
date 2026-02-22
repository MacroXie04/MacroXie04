export function txt(text, cls = '') {
  return { type: 'text', text, cls };
}

export function html(content) {
  return { type: 'html', content };
}
