export const HeroBlock = ({ data }) => {
  return (
    <section className="cms-hero">
      {data.image_url && (
        <img
          src={data.image_url}
          alt={data.image_alt || ''}
          className="cms-hero-image"
          loading="lazy"
        />
      )}
      {data.heading && <h1 className="cms-hero-heading">{data.heading}</h1>}
      {data.subheading && <p className="cms-hero-subheading">{data.subheading}</p>}
    </section>
  );
};
