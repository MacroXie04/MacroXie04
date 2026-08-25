const CMS_ROUTE_SEGMENT_RE = /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/;
const URL_SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]*:/;

export function normalizeCMSRoute(route) {
  const trimmed = (route || '').trim();
  if (
    !trimmed ||
    trimmed === '/' ||
    URL_SCHEME_RE.test(trimmed) ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\')
  ) {
    return '/';
  }

  const segments = trimmed.split('/').filter(Boolean);
  if (!segments.every((segment) => CMS_ROUTE_SEGMENT_RE.test(segment))) {
    return '/';
  }
  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

export async function fetchCMSPage(route, preview = false) {
  const normalizedRoute = normalizeCMSRoute(route);
  const path = normalizedRoute
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const url = `/api/cms/pages/${path}${path ? '/' : ''}${preview ? '?preview=true' : ''}`;

  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const error = new Error(`CMS page request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}
