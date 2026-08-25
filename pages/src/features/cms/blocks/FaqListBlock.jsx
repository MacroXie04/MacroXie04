import { SafeHtml } from '../SafeHtml';

export const FaqListBlock = ({ data }) => {
  return (
    <section className="cms-faq-list">
      {data.heading && <h2 className="cms-section-title">{data.heading}</h2>}
      <div>
        {(data.items || []).map((item, i) => (
          <div className="cms-faq-item" key={i}>
            <h3>{item.question}</h3>
            <SafeHtml html={item.answer_html} />
          </div>
        ))}
      </div>
    </section>
  );
};
