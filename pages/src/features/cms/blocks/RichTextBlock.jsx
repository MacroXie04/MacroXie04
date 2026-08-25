import { SafeHtml } from '../SafeHtml';

export const RichTextBlock = ({ data }) => {
  const HeadingTag = `h${data.heading_level || 2}`;

  return (
    <section className="cms-rich-text">
      {data.heading && <HeadingTag className="cms-section-title">{data.heading}</HeadingTag>}
      <SafeHtml html={data.body_html} />
    </section>
  );
};
