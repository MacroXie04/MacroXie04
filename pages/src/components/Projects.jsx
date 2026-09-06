import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import projects from '@assets/data/content/projects.json';
import profile from '@assets/data/content/profile.json';
import { FONT_SIZES, readDisplayPreferences } from './Terminal/utils/displayPreferences';
import './Projects.css';

export function FeaturedProjects() {
  return (
    <section className="p-featured" aria-label="Featured projects" onClick={event => event.stopPropagation()}>
      <div className="p-section-heading">
        <h2>Selected work</h2>
        <a className="t-link" href="/resume/Hongzhe_CV.pdf" download>Download resume</a>
      </div>
      <div className="p-grid">
        {projects.map(project => (
          <article key={project.slug} className="p-card">
            <div className="p-card-heading"><h3>{project.name}</h3><span>{project.date}</span></div>
            <p>{project.summary}</p>
            <p className="p-stack">{project.tech.slice(0, 3).join(' · ')}</p>
            <div className="p-actions">
              <a className="p-button" href={`/#/projects/${project.slug}`}>Explore {project.name}</a>
              <a className="t-link" href={project.repo} target="_blank" rel="noopener noreferrer">GitHub repository</a>
            </div>
          </article>
        ))}
      </div>
      <p className="p-contact">Have a software engineering opportunity? <a className="t-link" href={`mailto:${profile.email}`}>Get in touch</a>.</p>
    </section>
  );
}

export function ProjectWalkthrough({ project }) {
  const [step, setStep] = useState(0);
  const flow = project.caseStudy.flow;
  return (
    <section className="p-walkthrough" aria-labelledby="walkthrough-title">
      <h2 id="walkthrough-title">{project.caseStudy.flowTitle}</h2>
      <p className="p-muted">Architecture walkthrough. Select a step to follow the flow.</p>
      <ol className="p-steps">
        {flow.map((item, index) => (
          <li key={item.title}>
            <button type="button" aria-current={step === index ? 'step' : undefined} aria-controls="walkthrough-detail" onClick={() => setStep(index)}>
              <span className="p-step-number" aria-hidden="true">0{index + 1}</span>{item.title}
            </button>
          </li>
        ))}
      </ol>
      <div id="walkthrough-detail" className="p-step-detail" aria-live="polite" aria-atomic="true">
        <h3>{step + 1}. {flow[step].title}</h3>
        <p>{flow[step].description}</p>
      </div>
    </section>
  );
}

export default function ProjectPage() {
  const { slug } = useParams();
  const [display] = useState(readDisplayPreferences);
  const project = projects.find(item => item.slug === slug);
  const titleRef = useRef(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = project ? `${project.name} | Hongzhe Xie` : 'Project not found | Hongzhe Xie';
    titleRef.current?.focus();
    return () => { document.title = previousTitle; };
  }, [project]);

  return (
    <div className="t-root p-page" data-theme={display.theme} data-color={display.accentColor} style={{ fontSize: FONT_SIZES[display.fontSize] }}>
      <nav className="p-nav" aria-label="Project navigation">
        <a className="t-link" href="/#/">Back to terminal</a>
        <a className="t-link" href="/resume/Hongzhe_CV.pdf" download>Download resume</a>
        <a className="t-link" href={`mailto:${profile.email}`}>Contact</a>
      </nav>
      <main className="p-main">
        {!project ? <h1 ref={titleRef} tabIndex={-1}>Project not found</h1> : <>
          <header className="p-header">
            <p className="p-eyebrow">Engineering case study · {project.date}</p>
            <h1 ref={titleRef} tabIndex={-1}>{project.name}</h1>
            <p className="p-intro">{project.summary}</p>
            <p className="p-stack">{project.tech.join(' · ')}</p>
            <a className="p-button" href={project.repo} target="_blank" rel="noopener noreferrer">View source on GitHub</a>
          </header>
          <div className="p-story-grid">
            <section><h2>The problem</h2><p>{project.caseStudy.problem}</p></section>
            <section><h2>What I built</h2><p>{project.desc}</p><ul>{project.highlights.map(item => <li key={item}>{item}</li>)}</ul></section>
          </div>
          <ProjectWalkthrough key={project.slug} project={project} />
          <section className="p-decision"><h2>An engineering decision</h2><p>{project.caseStudy.decision}</p></section>
          <section className="p-evidence"><h2>Evidence in the code</h2><p>{project.caseStudy.evidence}</p>
            <ul>{project.caseStudy.links.map(link => <li key={link.url}><a className="t-link" href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a></li>)}</ul>
          </section>
          <footer className="p-footer"><p>Discuss this project or a software engineering opportunity.</p><a className="p-button" href={`mailto:${profile.email}`}>Contact Hongzhe</a></footer>
        </>}
      </main>
    </div>
  );
}
