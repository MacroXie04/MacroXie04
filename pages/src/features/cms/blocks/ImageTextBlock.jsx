import { SafeHtml } from '../SafeHtml';

export const ImageTextBlock = ({ data }) => {
  const position = data.image_position || 'top';

  return (
    <section className={`cms-image-text cms-image-text-${position}`}>
      {data.heading && <h2 className="cms-section-title">{data.heading}</h2>}
      <div className="cms-image-text-content">
        {data.image_url && (
          <img
            src={data.image_url}
            alt={data.image_alt || ''}
            className="cms-image-text-image"
            loading="lazy"
          />
        )}
        <SafeHtml html={data.body_html} />
      </div>
    </section>
  );
};
