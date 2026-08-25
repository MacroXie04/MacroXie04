import { txt } from './shared';
import { PROFILE } from '../data/profile';
import { EXPERIENCE_ITEMS } from '../data/experienceData';
import { SKILL_GROUPS } from '../data/skillsData';
import { PROJECTS } from '../data/projectsData';
import contact from '@assets/data/content/contact.json';
import education from '@assets/data/content/education.json';
import terminal from '@assets/data/terminal/terminal.json';
import ui from '@assets/data/ui.json';
import fun from '@assets/data/terminal/fun.json';

const HELP_SECTIONS = terminal.helpSections;

// Derived entirely from the registry. `commands` is the visible descriptor list;
// when `query`/`lookup` are given, show one command's detail (help <cmd>).
export function cmdHelp(commands = [], query = null, lookup = null) {
  if (query) {
    const d = lookup ? lookup(query) : null;
    if (!d) {
      return { output: [txt(''), txt(`help: no command '${query}'`, 't-error'), txt('')] };
    }
    const out = [
      txt(''),
      txt(`  ${d.name}`, 't-title'),
      txt(`  ${d.summary || d.man || ''}`, 't-dim'),
    ];
    if (d.aliases && d.aliases.length) out.push(txt(`  aliases: ${d.aliases.join(', ')}`, 't-dim'));
    if (d.man) out.push(txt(`  ${d.man}`, 't-dim'));
    out.push(txt(''));
    return { output: out };
  }

  const out = [txt('')];
  for (const [cat, label] of HELP_SECTIONS) {
    const inCat = commands.filter((c) => c.category === cat && c.summary);
    if (!inCat.length) continue;
    out.push(txt(label, 't-title'));
    out.push(txt(''));
    for (const c of inCat) {
      const names = [c.name, ...(c.aliases || [])].join(', ');
      out.push(txt('  ' + names.padEnd(24) + c.summary, 't-dim'));
    }
    out.push(txt(''));
  }
  out.push(txt(ui.tips.helpFooter, 't-dim'));
  out.push(txt(''));
  return { output: out };
}

export function cmdAbout() {
  return { output: [txt(''), PROFILE, txt('')] };
}

export function cmdExperience() {
  return {
    output: [
      txt(''),
      txt(ui.headings.experience, 't-title'),
      txt(''),
      ...EXPERIENCE_ITEMS.flatMap((item, i) => [
        txt(`  ${item.title}`, 't-green'),
        txt(`  @ ${item.org}`, 't-blue'),
        txt(''),
        txt(`  ${item.desc}`, 't-dim'),
        ...(i < EXPERIENCE_ITEMS.length - 1 ? [txt('')] : []),
      ]),
      txt(''),
    ],
  };
}

export function cmdSkills() {
  return {
    output: [
      txt(''),
      txt(ui.headings.skills, 't-title'),
      txt(''),
      ...SKILL_GROUPS.flatMap(group => [
        txt(`  ${group.category.toUpperCase()}`, 't-green'),
        txt(`  ${group.description}`, 't-dim'),
        txt('  ' + '─'.repeat(48), 't-dim'),
        ...group.skills.map(({ name, proficiency, years }) => {
          const bar = '█'.repeat(proficiency) + '░'.repeat(10 - proficiency);
          const label = name.padEnd(34);
          return txt(`    › ${label}  ${bar}  ${proficiency}/10  ${years}yr`, 't-dim');
        }),
        txt(''),
      ]),
    ],
  };
}

export function cmdSeventeen() {
  return {
    output: [
      txt(''),
      txt(fun.seventeen.title, 't-title'),
      txt(''),
      {
        type: 'iframe',
        src: fun.seventeen.embedUrl,
        title: fun.seventeen.embedTitle,
        height: 352,
      },
      txt(''),
    ],
  };
}

export function cmdContact() {
  const out = [txt(''), txt(contact.title, 't-title'), txt('')];
  for (const item of contact.items) {
    if (item.type === 'link') {
      out.push({ type: 'link', text: item.text, href: item.href });
    } else {
      out.push(txt(item.text, 't-dim'));
    }
  }
  out.push(txt(''));
  return { output: out };
}

export function cmdProjects(args = []) {
  const showLinks = args.includes('--links');
  const slug = args.find((a) => !a.startsWith('-'));

  if (slug) {
    const p = PROJECTS.find((x) => x.slug === slug.toLowerCase());
    if (!p) {
      return {
        output: [
          txt(''),
          txt(`projects: no such project '${slug}'`, 't-error'),
          txt(`Available: ${PROJECTS.map((x) => x.slug).join(', ')}`, 't-dim'),
          txt(''),
        ],
      };
    }
    const out = [
      txt(''),
      txt(`  ${p.name}`, 't-title'),
      txt(`  ${p.role} · ${p.date} · ${p.status}`, 't-dim'),
      txt(''),
      txt(`  ${p.desc}`, 't-dim'),
      txt(''),
      txt(`  Tech: ${p.tech.join(' · ')}`, 't-green'),
    ];
    if (p.repo) out.push({ type: 'link', text: `  repo: ${p.repo}`, href: p.repo });
    if (p.demo) out.push({ type: 'link', text: `  demo: ${p.demo}`, href: p.demo });
    out.push(txt(''));
    return { output: out };
  }

  const out = [txt(''), txt(ui.headings.projects, 't-title'), txt('')];
  PROJECTS.forEach((p) => {
    out.push(txt(`  ${p.name}  (${p.slug})`, 't-green'));
    out.push(txt(`    ${p.tech.join(' · ')}`, 't-blue'));
    out.push(txt(`    ${p.desc}`, 't-dim'));
    if (showLinks && p.repo) out.push({ type: 'link', text: `    ${p.repo}`, href: p.repo });
    if (p.demo) out.push({ type: 'link', text: `    ${p.demo}`, href: p.demo });
    out.push(txt(''));
  });
  out.push(txt(ui.tips.projects, 't-dim'));
  out.push(txt(''));
  return { output: out };
}

export function cmdEducation(args = []) {
  const verbose = args.includes('-v') || args.includes('--verbose');
  const courses = args.includes('--courses');
  const out = [
    txt(''),
    txt(ui.headings.education, 't-title'),
    txt(''),
    txt(`  ${education.school}`, 't-green'),
    txt(`  ${education.degree}`, 't-blue'),
    txt(`  ${education.class}`, 't-dim'),
    txt(''),
  ];
  if (verbose) {
    out.push(txt(`  Focus: ${education.focus}`, 't-dim'));
    out.push(txt(''));
  }
  if (courses) {
    out.push(txt(`  ${ui.headings.coursework}`, 't-dim'));
    education.courses.forEach((c) => out.push(txt(`    › ${c}`, 't-dim')));
    out.push(txt(''));
  }
  if (!verbose && !courses) {
    out.push(txt(ui.tips.education, 't-dim'));
    out.push(txt(''));
  }
  return { output: out };
}

export function cmdStack(args = []) {
  if (args.includes('--flat')) {
    const all = SKILL_GROUPS.flatMap((g) => g.skills.map((s) => s.name));
    return { output: [txt(''), txt(all.join('  ·  '), 't-dim'), txt('')] };
  }
  const out = [txt(''), txt(ui.headings.stack, 't-title'), txt('')];
  SKILL_GROUPS.forEach((g) => {
    out.push(txt(`  ${g.category}`, 't-green'));
    out.push(txt(`    ${g.skills.map((s) => s.name).join('  ·  ')}`, 't-dim'));
    out.push(txt(''));
  });
  out.push(txt(ui.tips.stack, 't-dim'));
  out.push(txt(''));
  return { output: out };
}
