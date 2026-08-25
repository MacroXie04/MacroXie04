import { Link } from 'react-router-dom';

const SAFE_SCHEME_RE = /^(https?|mailto|tel):/i;
const URL_SCHEME_RE = /^[A-Za-z][A-Za-z0-9+.-]*:/;

function safeHref(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return '#';
  }
  if (URL_SCHEME_RE.test(trimmed) && !SAFE_SCHEME_RE.test(trimmed)) {
    return '#';
  }
  return trimmed;
}

export const LinkListBlock = ({ data }) => {
  return (
    <section className="cms-link-list">
      {data.heading && <h2 className="cms-section-title">{data.heading}</h2>}
      <ul className="cms-link-list-items">
        {(data.items || []).map((item, i) => (
          <li key={i}>
            {item.is_external ? (
              <a href={safeHref(item.url)} target="_blank" rel="noopener noreferrer">
                {item.label}
              </a>
            ) : (
              <Link to={item.url}>{item.label}</Link>
            )}
            {item.description && <> — {item.description}</>}
          </li>
        ))}
      </ul>
    </section>
  );
};
