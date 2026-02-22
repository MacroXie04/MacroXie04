import { txt } from './shared';
import { PROFILE } from '../data/profile';
import { EXPERIENCE_ITEMS } from '../data/experienceData';
import { SKILL_GROUPS } from '../data/skillsData';

export function cmdHelp() {
  return {
    output: [
      txt(''),
      txt('Available commands:', 't-title'),
      txt(''),
      txt('  about        About me and contact info', 't-dim'),
      txt('  whoami       Alias for about', 't-dim'),
      txt('  experience   Work experience', 't-dim'),
      txt('  skills       Technical skills', 't-dim'),
      txt('  contact      Contact information', 't-dim'),
      txt('  ls [flags]   List files  (-l long, -a all, -la combined)', 't-dim'),
      txt('  cat <file>   View file (README.md, experience.py, skills.sql)', 't-dim'),
      txt('  pwd          Print working directory', 't-dim'),
      txt('  echo <text>  Print text', 't-dim'),
      txt('  cd <dir>     Change directory', 't-dim'),
      txt('  man <cmd>    Manual page', 't-dim'),
      txt('  which <cmd>  Locate command', 't-dim'),
      txt('  uname [-a]   System info', 't-dim'),
      txt('  date         Current date', 't-dim'),
      txt('  history      Command history', 't-dim'),
      txt('  exit         Exit terminal', 't-dim'),
      txt('  github       Open GitHub profile', 't-dim'),
      txt('  cv           Download resume PDF', 't-dim'),
      txt('  clear        Clear terminal', 't-dim'),
      txt(''),
      txt('Appearance:', 't-title'),
      txt(''),
      txt('  settings     Show current settings', 't-dim'),
      txt('  font <size>  Change font size (small|medium|large|xlarge)', 't-dim'),
      txt('  theme <name> Change background (default|dracula|nord|solarized|light)', 't-dim'),
      txt('  color <name> Change accent color (green|blue|purple|orange|cyan)', 't-dim'),
      txt(''),
    ],
  };
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
