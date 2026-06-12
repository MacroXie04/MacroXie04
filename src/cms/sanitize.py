"""
Server-side HTML sanitization for CMS content.

Defense-in-depth: the frontend also sanitizes via DOMPurify (SafeHtml component).
"""

from urllib.parse import urlparse

import bleach

SAFE_URL_SCHEMES = {"http", "https", "mailto", "tel"}


def validate_safe_url(url):
    """Return True if url has a safe scheme or is a relative/fragment URL."""
    if not isinstance(url, str):
        return False
    trimmed = url.strip()
    if not trimmed:
        return False
    if trimmed.startswith(("#", "/", "./", "../")):
        return True
    parsed = urlparse(trimmed)
    if not parsed.scheme:
        return True
    return parsed.scheme.lower() in SAFE_URL_SCHEMES


ALLOWED_TAGS = [
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "code",
    "pre",
    "img",
    "figure",
    "figcaption",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "div",
    "span",
    "sub",
    "sup",
    "hr",
]

# Wildcard intentionally excludes `style` — inline CSS would let approved
# content overlay UI chrome or stage CSS-based phishing on public pages.
ALLOWED_ATTRS = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "width", "height", "loading"],
    "th": ["colspan", "rowspan", "scope"],
    "td": ["colspan", "rowspan"],
    "*": ["class", "id"],
}


def sanitize_html(html):
    """Sanitize an HTML string, stripping disallowed tags and attributes."""
    if not html:
        return html
    return bleach.clean(html, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)
