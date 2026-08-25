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

const HELP_GROUPS = terminal.helpGroups;

// Derived entirely from the registry. `commands` is the visible descriptor list;
// when `query`/`lookup` are given, show one command's detail (help <cmd>).
export function cmdHelp(commands = [], query = null, lookup = null) {
  if (query) {
    const d = lookup ? lookup(query) : null;
    if (!d || d.hidden) {
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
  for (const group of HELP_GROUPS) {
    const entries = group.commands
      .map(name => commands.find(command => command.name === name))
      .filter(command => command?.summary);
    if (!entries.length) continue;
    out.push(txt(group.label, 't-title'));
    out.push(txt(''));
    for (const c of entries) {
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
  const out = [txt('')];
  let activeGroup = null;

  EXPERIENCE_ITEMS.forEach((item) => {
    if (item.group !== activeGroup) {
      if (activeGroup !== null) out.push(txt(''));
      activeGroup = item.group;
      out.push(txt(activeGroup, 't-title'), txt(''));
    }

    out.push(txt(`  ${item.title}`, 't-green'));
    out.push(txt(`  @ ${item.org}`, 't-blue'));
    out.push(txt(`  ${item.date} · ${item.location}`, 't-dim'));
    out.push(txt(''));
    item.highlights.forEach((highlight) => out.push(txt(`    - ${highlight}`, 't-dim')));
    out.push(txt(''));
  });

  return { output: out };
}

export function cmdSkills() {
  return {
    output: [
      txt(''),
      txt(ui.headings.skills, 't-title'),
      txt(''),
      ...SKILL_GROUPS.flatMap(group => [
        txt(`  ${group.category.toUpperCase()}`, 't-green'),
        txt(`    ${group.skills.map(({ name }) => name).join(' · ')}`, 't-dim'),
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
      out.push({ type: 'link', text: item.text, href: item.href, cls: 't-contact-link' });
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
      txt(`  ${p.date}`, 't-dim'),
      txt(''),
      txt(`  ${p.desc}`, 't-dim'),
      ...p.highlights.map((highlight) => txt(`    - ${highlight}`, 't-dim')),
      txt(''),
      txt(`  Tech: ${p.tech.join(' · ')}`, 't-green'),
    ];
    if (p.repo) out.push({ type: 'link', text: `  repo: ${p.repo}`, href: p.repo });
    out.push(txt(''));
    return { output: out };
  }

  const out = [txt(''), txt(ui.headings.projects, 't-title'), txt('')];
  PROJECTS.forEach((p) => {
    out.push(txt(`  ${p.name}  (${p.slug})`, 't-green'));
    out.push(txt(`    ${p.date} · ${p.tech.join(' · ')}`, 't-blue'));
    out.push(txt(`    ${p.desc}`, 't-dim'));
    if (showLinks && p.repo) out.push({ type: 'link', text: `    ${p.repo}`, href: p.repo });
    out.push(txt(''));
  });
  out.push(txt(ui.tips.projects, 't-dim'));
  out.push(txt(''));
  return { output: out };
}

export function cmdEducation() {
  return { output: [
    txt(''),
    txt(ui.headings.education, 't-title'),
    txt(''),
    txt(`  ${education.school}`, 't-green'),
    txt(`  ${education.expected}`, 't-blue'),
    txt(`  ${education.location}`, 't-dim'),
    txt(''),
  ] };
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
