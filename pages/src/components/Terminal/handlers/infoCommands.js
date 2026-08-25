import { txt } from './shared';
import { PROFILE } from '../data/profile';
import { EXPERIENCE_ITEMS } from '../data/experienceData';
import { SKILL_GROUPS } from '../data/skillsData';
import { PROJECTS } from '../data/projectsData';

const HELP_SECTIONS = [
  ['info', 'About'],
  ['fs', 'Filesystem'],
  ['util', 'Utilities'],
  ['appearance', 'Appearance'],
  ['fun', 'Fun'],
  ['core', 'Shell'],
];

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
  out.push(txt("Tab completes commands and paths · 'man <cmd>' for details · 'help <cmd>' for one command", 't-dim'));
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
      txt('Work Experience', 't-title'),
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
      txt('Technical Skills', 't-title'),
      txt(''),
      ...SKILL_GROUPS.flatMap(group => [
        txt(`  ${group.category.toUpperCase()}`, 't-green'),
        txt(`  ${group.description}`, 't-dim'),
        txt('  ' + '\u2500'.repeat(48), 't-dim'),
        ...group.skills.map(({ name, proficiency, years }) => {
          const bar = '\u2588'.repeat(proficiency) + '\u2591'.repeat(10 - proficiency);
          const label = name.padEnd(34);
          return txt(`    \u203a ${label}  ${bar}  ${proficiency}/10  ${years}yr`, 't-dim');
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
      txt('  ᐳ SEVENTEEN (세븐틴)', 't-title'),
      txt(''),
      {
        type: 'iframe',
        src: 'https://open.spotify.com/embed/artist/7nqOGRxlXj7N2JYbgNEjYH?utm_source=generator',
        title: 'SEVENTEEN on Spotify',
        height: 352,
      },
      txt(''),
    ],
  };
}

export function cmdContact() {
  return {
    output: [
      txt(''),
      txt('Contact Information', 't-title'),
      txt(''),
      { type: 'link', text: '  \u2709  xiehongzhe04@gmail.com', href: 'mailto:xiehongzhe04@gmail.com' },
      { type: 'link', text: '  \u25a0  github.com/MacroXie04', href: 'https://github.com/MacroXie04' },
      txt('  \u260e  +1 (206) 333-8881', 't-dim'),
      txt(''),
    ],
  };
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
      txt(`  ${p.role} \u00b7 ${p.date} \u00b7 ${p.status}`, 't-dim'),
      txt(''),
      txt(`  ${p.desc}`, 't-dim'),
      txt(''),
      txt(`  Tech: ${p.tech.join(' \u00b7 ')}`, 't-green'),
    ];
    if (p.repo) out.push({ type: 'link', text: `  repo: ${p.repo}`, href: p.repo });
    if (p.demo) out.push({ type: 'link', text: `  demo: ${p.demo}`, href: p.demo });
    out.push(txt(''));
    return { output: out };
  }

  const out = [txt(''), txt('Projects', 't-title'), txt('')];
  PROJECTS.forEach((p) => {
    out.push(txt(`  ${p.name}  (${p.slug})`, 't-green'));
    out.push(txt(`    ${p.tech.join(' \u00b7 ')}`, 't-blue'));
    out.push(txt(`    ${p.desc}`, 't-dim'));
    if (showLinks && p.repo) out.push({ type: 'link', text: `    ${p.repo}`, href: p.repo });
    if (showLinks && p.demo) out.push({ type: 'link', text: `    ${p.demo}`, href: p.demo });
    out.push(txt(''));
  });
  out.push(txt("Tip: 'projects <name>' for detail, 'projects --links' for clickable links.", 't-dim'));
  out.push(txt(''));
  return { output: out };
}

export function cmdEducation(args = []) {
  const verbose = args.includes('-v') || args.includes('--verbose');
  const courses = args.includes('--courses');
  const out = [
    txt(''),
    txt('Education', 't-title'),
    txt(''),
    txt('  University of California, Merced', 't-green'),
    txt('  B.S. Computer Science & Engineering', 't-blue'),
    txt('  Class of 2028', 't-dim'),
    txt(''),
  ];
  if (verbose) {
    out.push(txt('  Focus: full-stack web development, AI agent systems, and cybersecurity.', 't-dim'));
    out.push(txt(''));
  }
  if (courses) {
    out.push(txt('  Selected coursework:', 't-dim'));
    ['Data Structures & Algorithms', 'Computer Architecture', 'Operating Systems',
      'Databases', 'Computer Networks', 'Software Engineering']
      .forEach((c) => out.push(txt(`    \u203a ${c}`, 't-dim')));
    out.push(txt(''));
  }
  if (!verbose && !courses) {
    out.push(txt("Tip: 'education -v' for focus, 'education --courses' for coursework.", 't-dim'));
    out.push(txt(''));
  }
  return { output: out };
}

export function cmdStack(args = []) {
  if (args.includes('--flat')) {
    const all = SKILL_GROUPS.flatMap((g) => g.skills.map((s) => s.name));
    return { output: [txt(''), txt(all.join('  \u00b7  '), 't-dim'), txt('')] };
  }
  const out = [txt(''), txt('Toolbox', 't-title'), txt('')];
  SKILL_GROUPS.forEach((g) => {
    out.push(txt(`  ${g.category}`, 't-green'));
    out.push(txt(`    ${g.skills.map((s) => s.name).join('  \u00b7  ')}`, 't-dim'));
    out.push(txt(''));
  });
  out.push(txt("Tip: 'stack --flat' for a one-line view, or 'skills' for proficiency bars.", 't-dim'));
  out.push(txt(''));
  return { output: out };
}
