// Author portfolio facts in assets/data/content. Derive terminal documents and
// useful first-load HTML from those facts so these surfaces cannot silently drift.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const check = process.argv.includes('--check');
const read = path => readFileSync(resolve(repo, path), 'utf8');
const json = path => JSON.parse(read(`assets/data/content/${path}.json`));
const [profile, education, experience, additional, projects, skills] =
  ['profile', 'education', 'experience', 'additional', 'projects', 'skills'].map(json);
const generated = new Map();
const saveJson = (path, value) => generated.set(path, `${JSON.stringify(value, null, 2)}\n`);
const e = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const sql = value => `'${value.replaceAll("'", "''")}'`;

const contacts = [
  ['Email', profile.email, `mailto:${profile.email}`],
  ['GitHub', profile.github.replace('https://', ''), profile.github],
  ['LinkedIn', 'linkedin.com/in/hongzhexie', profile.linkedin],
  ['Phone', profile.phone, `tel:${profile.phone.replace(/[^\d+]/g, '')}`],
];
saveJson('assets/data/content/contact.json', {
  title: 'Contact Information',
  items: contacts.map(([label, text, href]) => ({ text: `  ${label.padEnd(9)}${text}`, href, type: 'link' })),
});

const readme = [
  `# ${profile.name}`, '', `${profile.role}. ${profile.tagline}`, '', '## Education',
  ...education.flatMap(school => [
    `**${school.school}**`, school.location,
    ...[school.expected, school.program, school.gpa].filter(Boolean), '',
  ]),
  '## Experience',
  ...experience.map(item => `- **${item.title}** — ${item.org} (${item.date})`), '',
  '## Selected Projects',
  ...projects.map(project => `- [${project.name}](${project.repo}) — ${project.summary}`), '',
  '## Technical Skills', ...skills.map(group => `- **${group.category}:** ${group.skills.map(item => item.name).join(', ')}`), '',
  '## Additional',
  ...additional.programs.map(program => `- ${program.name}, ${program.location} (${program.date}) — ${program.description}`),
  `- Conferences: ${additional.conferences.join('; ')}`, '',
  '## Contact', ...contacts.map(([, text, href]) => `[${text}](${href})`), '',
].join('\n');
saveJson('assets/data/sections/readme.json', { title: 'README.md', icon: 'MD', language: 'markdown', content: readme });
saveJson('assets/data/sections/experience.json', {
  title: 'experience.py', icon: 'PY', language: 'python',
  content: `"""Experience and additional programs for ${profile.name}."""\n\nexperiences = ${JSON.stringify(experience.map(({ group, ...item }) => item), null, 4)}\n\nadditional = ${JSON.stringify(additional, null, 4)}\n`,
});
saveJson('assets/data/sections/skills.json', {
  title: 'skills.sql', icon: 'SQL', language: 'SQL',
  content: `-- Technical skills from ${profile.name}'s current resume\n\nCREATE TABLE technical_skills (\n    category VARCHAR(64) PRIMARY KEY,\n    skills TEXT[] NOT NULL\n);\n\nINSERT INTO technical_skills (category, skills) VALUES\n${skills.map(group => `(${sql(group.category)}, ARRAY[${group.skills.map(item => sql(item.name)).join(', ')}])`).join(',\n')}\n;\n\nSELECT category, array_length(skills, 1) AS skill_count, skills\nFROM technical_skills\nORDER BY category;\n`,
});

const filesystem = JSON.parse(read('assets/data/terminal/filesystem.json'));
filesystem.files['contact.txt'] = [...contacts.map(([label, text]) => `${label.padEnd(9)}${text}`), ''];
for (const path of Object.keys(filesystem.files)) {
  if (/^projects\/[^/]+\.md$/.test(path)) delete filesystem.files[path];
}
filesystem.tree.home.visitor.projects = Object.fromEntries(projects.map(project => [
  `${project.slug}.md`, `@file:projects/${project.slug}.md:markdown`,
]));
for (const project of projects) {
  filesystem.files[`projects/${project.slug}.md`] = [
    `# ${project.name}`, '', project.desc, '',
    `- **Dates:** ${project.date}`, `- **Stack:** ${project.tech.join(', ')}`,
    ...project.highlights.map(item => `- ${item}`), '',
    '## Engineering decision', project.caseStudy.decision, '',
    '## Evidence', project.caseStudy.evidence,
    ...project.caseStudy.links.map(link => `- [${link.label}](${link.url})`), '',
    `Repository: ${project.repo}`, `Case study: https://hongzhexie.com/#/projects/${project.slug}`, '',
  ];
}
saveJson('assets/data/terminal/filesystem.json', filesystem);

const fallback = `<div class="portfolio-fallback"><main>
<h1>${e(profile.name)}</h1><p>${e(profile.role)}</p><p>${e(profile.tagline)}</p>
<nav aria-label="Contact and resume"><a href="/resume/Hongzhe_CV.pdf" download>Download resume</a>${contacts.filter(([label]) => label !== 'Phone').map(([label,,href]) => `<a href="${e(href)}">${e(label)}</a>`).join('')}</nav>
<h2>Selected work</h2>
${projects.map(project => `<details><summary>${e(project.name)} — ${e(project.summary)}</summary><h3>The problem</h3><p>${e(project.caseStudy.problem)}</p><h3>What I built</h3><p>${e(project.desc)}</p><h3>An engineering decision</h3><p>${e(project.caseStudy.decision)}</p><h3>Evidence in the code</h3><p>${e(project.caseStudy.evidence)}</p><ul>${project.caseStudy.links.map(link => `<li><a href="${e(link.url)}">${e(link.label)}</a></li>`).join('')}</ul><p><a href="${e(project.repo)}">${e(project.name)} on GitHub</a></p></details>`).join('\n')}
<h2>Experience</h2>${experience.map(item => `<h3>${e(item.title)}</h3><p>${e(item.org)} · ${e(item.date)}</p><ul>${item.highlights.map(text => `<li>${e(text)}</li>`).join('')}</ul>`).join('\n')}
<h2>Education</h2>${education.map(school => `<h3>${e(school.school)}</h3><p>${[school.location, school.expected, school.program, school.gpa].filter(Boolean).map(e).join(' · ')}</p>`).join('\n')}
<h2>Additional</h2>${additional.programs.map(program => `<p>${e(program.name)} · ${e(program.date)}. ${e(program.description)}</p>`).join('')}<p>Conferences: ${e(additional.conferences.join('; '))}</p>
<noscript><p>The full portfolio is available above. Enable JavaScript to also explore the interactive terminal.</p></noscript>
</main></div>`;
const html = read('pages/index.html');
const marker = /<!-- portfolio-fallback:start -->[\s\S]*?<!-- portfolio-fallback:end -->/;
if (!marker.test(html)) throw new Error('Missing portfolio fallback markers in pages/index.html');
generated.set('pages/index.html', html.replace(marker, `<!-- portfolio-fallback:start -->\n${fallback}\n      <!-- portfolio-fallback:end -->`));

const stale = [];
for (const [path, contents] of generated) {
  if (read(path) === contents) continue;
  if (check) stale.push(path);
  else writeFileSync(resolve(repo, path), contents);
}
if (stale.length) {
  throw new Error(`Generated portfolio content is stale: ${stale.join(', ')}. Run npm run sync:content in pages.`);
}
console.log(`${check ? 'Verified' : 'Synchronized'} portfolio documents and static fallback from shared content.`);
