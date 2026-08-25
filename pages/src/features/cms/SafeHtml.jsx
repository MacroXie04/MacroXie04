import { memo, useEffect, useMemo, useRef } from 'react';
import DOMPurify from 'dompurify';

const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  ADD_ATTR: ['target', 'rel', 'aria-label'],
};

export const SafeHtml = memo(function SafeHtml({ html, className }) {
  const ref = useRef(null);
  const sanitizedHtml = useMemo(
    () => DOMPurify.sanitize(html || '', SANITIZE_OPTIONS),
    [html],
  );

  // Set innerHTML via ref so the DOM is only replaced when the sanitized
  // HTML actually changes — not on every parent re-render.
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = sanitizedHtml;
    }
  }, [sanitizedHtml]);

  return <div ref={ref} className={className} />;
});
