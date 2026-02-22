import { txt, html } from './shared';
import { highlightMarkdown, highlightPython, highlightSQL } from '../utils/highlight';
import { readme as readmeFile } from '../../../data/sections/readme';
import { experience as experienceFile } from '../../../data/sections/experience';
import { skills as skillsFile } from '../../../data/sections/skills';

export function cmdLs(args) {
  const flags  = args.filter(a => a.startsWith('-')).join('');
  const target = args.find(a => !a.startsWith('-'));
  const longFmt = flags.includes('l');
  const showAll = flags.includes('a');

  if (target && target !== '.' && target !== 'resume' && target !== 'resume/') {
    return { output: [txt(''), txt(`ls: ${target}: No such file or directory`, 't-error'), txt('')] };
  }

  const FILES = [
    { name: 'README.md',     size: ' 2.1K', perm: '-rw-r--r--', mtime: 'Feb 22 10:30' },
    { name: 'experience.py', size: ' 3.8K', perm: '-rw-r--r--', mtime: 'Feb 22 10:30' },
    { name: 'skills.sql',    size: ' 5.2K', perm: '-rw-r--r--', mtime: 'Feb 22 10:30' },
  ];
  const HIDDEN = [
    { name: '.',        size: '  160', perm: 'drwxr-xr-x', mtime: 'Feb 22 10:30' },
    { name: '..',       size: '  256', perm: 'drwxr-xr-x', mtime: 'Feb 22 10:30' },
    { name: '.profile', size: '  512', perm: '-rw-r--r--', mtime: 'Feb 22 10:30' },
  ];
  const all = showAll ? [...HIDDEN, ...FILES] : FILES;

  if (longFmt) {
    return {
      output: [
        txt(''),
        txt(`total ${all.length}`, 't-dim'),
        ...all.map(f =>
          txt(`${f.perm}  1 visitor  staff  ${f.size}  ${f.mtime}  ${f.name}`,
            f.name.startsWith('.') ? 't-dim' : '')
        ),
        txt(''),
      ],
    };
  }

  if (showAll) {
    return {
      output: [
        txt(''),
        txt('  .  ..  .profile  README.md  experience.py  skills.sql'),
        txt(''),
      ],
    };
  }

  return {
    output: [
      txt(''),
      txt('resume/', 't-blue'),
      txt('  README.md         Personal README'),
      txt('  experience.py     Work experience'),
      txt('  skills.sql        Technical skills'),
      txt(''),
    ],
  };
}

export function cmdCat(file) {
  if (!file) {
    return [txt(''), txt('Usage: cat <file>', 't-error'), txt('')];
  }
  if (file === 'README.md' || file === 'readme.md') {
    return [txt(''), ...readmeFile.content.split('\n').map(l => html(highlightMarkdown(l))), txt('')];
  }
  if (file === 'experience.py') {
    return [txt(''), ...experienceFile.content.split('\n').map(l => html(highlightPython(l))), txt('')];
  }
  if (file === 'skills.sql') {
    return [txt(''), ...skillsFile.content.split('\n').map(l => html(highlightSQL(l))), txt('')];
  }
  return [txt(''), txt(`cat: ${file}: No such file or directory`, 't-error'), txt('')];
}

export function cmdGithub() {
  return { openUrl: 'https://github.com/MacroXie04', output: [txt(''), txt('Opening GitHub profile...', 't-green'), txt('')] };
}

export function cmdPwd() {
  return { output: [txt('', ''), txt('/home/visitor/resume', 't-dim'), txt('')] };
}

export function cmdEcho(args) {
  return { output: [txt(''), txt(args.join(' ')), txt('')] };
}

export function cmdCd(args) {
  const target = args[0];
  if (!target || target === '~' || target === '.' || target === 'resume' || target === 'resume/' || target === '..') {
    return { output: [] };
  }
  return { output: [txt(''), txt(`cd: ${target}: No such file or directory`, 't-error'), txt('')] };
}
