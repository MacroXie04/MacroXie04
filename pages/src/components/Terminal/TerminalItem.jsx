export default function TerminalItem({ item, idx }) {
  if (item.type === 'profile') {
    return (
      <div key={idx} className="t-profile-card">
        <img src={item.imgSrc} alt={item.name} className="t-profile-img" />
        <div className="t-profile-info">
          <div className="t-profile-name">{item.name}</div>
          <div className="t-profile-role">{item.role}</div>
          <div className="t-profile-edu">{item.education}</div>
          <div className="t-profile-tagline">&quot;{item.tagline}&quot;</div>
          <div className="t-profile-links">
            <a href={`mailto:${item.email}`} className="t-link">{item.email}</a>
            <a href={item.github} target="_blank" rel="noopener noreferrer" className="t-link">
              {item.github.replace('https://', '')}
            </a>
            <span className="t-dim">{item.phone}</span>
          </div>
        </div>
      </div>
    );
  }

  if (item.type === 'iframe') {
    return (
      <div key={idx} className="t-line t-iframe-wrap">
        <iframe
          src={item.src}
          title={item.title}
          width={item.width || '100%'}
          height={item.height || 352}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          style={{ borderRadius: 12, display: 'block', maxWidth: '100%' }}
          onClick={e => e.stopPropagation()}
        />
      </div>
    );
  }

  if (item.type === 'html') {
    return (
      <div
        key={idx}
        className="t-line"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: item.content }}
      />
    );
  }

  if (item.type === 'link') {
    const isExternal = item.href.startsWith('http');
    return (
      <div key={idx} className="t-line">
        <a
          href={item.href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="t-link"
          onClick={e => e.stopPropagation()}
        >
          {item.text}
        </a>
      </div>
    );
  }

  return (
    <div key={idx} className={`t-line ${item.cls || ''}`}>
      {item.text}
    </div>
  );
}
