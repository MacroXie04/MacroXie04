import { processCommand } from '../commands';
import { cmdCat } from '../handlers/fsCommands';
import { html, txt } from '../handlers/shared';
import { highlightMarkdown, highlightPython, highlightSQL } from '../utils/highlight';
import { readme } from '../../../data/sections/readme';
import { experience } from '../../../data/sections/experience';
import { skills } from '../../../data/sections/skills';
import { HOME } from '../data/filesystem';

const S = { fontSize: 'medium', theme: 'default', accentColor: 'green', cwd: HOME };

describe('processCommand dispatch + parity', () => {
  test('empty input returns null', () => {
    expect(processCommand('', S)).toBeNull();
    expect(processCommand('   ', S)).toBeNull();
  });

  test('clear / quit return control fields', () => {
    expect(processCommand('clear', S)).toEqual({ clear: true });
    expect(processCommand('quit', S)).toEqual({ quit: true });
  });

  test('aliases produce identical output to their canonical command', () => {
    expect(processCommand('whoami', S)).toEqual(processCommand('about', S));
    expect(processCommand('svt', S)).toEqual(processCommand('seventeen', S));
    expect(processCommand('resume', S)).toEqual(processCommand('cv', S));
  });

  test('rm -rf triggers the bomb; plain rm is permission denied', () => {
    expect(processCommand('rm -rf /', S)).toEqual({ bomb: true, output: [] });
    const plain = processCommand('rm foo', S);
    expect(plain.bomb).toBeUndefined();
    expect(plain.output.some(l => l.text === 'rm: permission denied')).toBe(true);
  });

  test('echo joins its args', () => {
    expect(processCommand('echo hello world', S).output).toEqual([
      { type: 'text', text: '', cls: '' },
      { type: 'text', text: 'hello world', cls: '' },
      { type: 'text', text: '', cls: '' },
    ]);
  });

  test('help lists only essential portfolio commands', () => {
    const out = processCommand('help', S).output;
    const joined = out.map((l) => l.text).join('\n');
    expect(joined).toContain('Portfolio');
    expect(joined).toContain('Links');
    expect(joined).toContain('Shell');
    expect(joined).toContain('about, whoami');
    expect(joined).toContain('projects, portfolio');
    expect(joined).toContain('github');
    expect(joined).toContain('cv, resume');
    expect(joined).not.toContain('Filesystem');
    expect(joined).not.toContain('grep');
    expect(joined).not.toContain('cowsay');
  });

  test('help <cmd> shows one command detail', () => {
    const out = processCommand('help grep', S).output;
    const joined = out.map((l) => l.text).join('\n');
    expect(joined).toContain('grep');
    expect(joined).toContain('aliases: egrep, fgrep');
  });

  test('hidden commands stay out of help and typo suggestions', () => {
    for (const hidden of ['quit', 'rm', 'download']) {
      const help = processCommand(`help ${hidden}`, S).output.map((l) => l.text).join('\n');
      expect(help).toContain(`help: no command '${hidden}'`);
    }
    expect(processCommand('qut', S).output.map((l) => l.text).join('\n')).not.toContain("'quit'");
    expect(processCommand('rmm', S).output.map((l) => l.text).join('\n')).not.toContain("'rm'");
  });

  test('man parity: known entries keep their text, others have none', () => {
    expect(processCommand('man ls', S).output.some((l) => l.text === 'ls(1)  -- List directory contents')).toBe(true);
    expect(processCommand('man date', S).output.some((l) => l.text === 'date(1)  -- Display the current date and time')).toBe(true);
    expect(processCommand('man env', S).output.some((l) => l.text === 'env(1)  -- Print environment variables')).toBe(true);
    expect(processCommand('man which', S).output.some((l) => l.text === 'No manual entry for which')).toBe(true);
    expect(processCommand('man help', S).output.some((l) => l.text === 'No manual entry for help')).toBe(true);
  });

  test('help metadata describes simulated exit and sudo behavior honestly', () => {
    const exitHelp = processCommand('help exit', S).output.map((l) => l.text).join('\n');
    const sudoHelp = processCommand('help sudo', S).output.map((l) => l.text).join('\n');
    expect(exitHelp).toContain('Simulate terminal logout');
    expect(sudoHelp).toContain('Simulate restricted administrative access');
  });

  test('which parity: known paths resolve, others not found', () => {
    expect(processCommand('which ls', S).output.some((l) => l.text === '/bin/ls')).toBe(true);
    expect(processCommand('which clear', S).output.some((l) => l.text === '/usr/bin/clear')).toBe(true);
    expect(processCommand('which github', S).output.some((l) => l.text === 'which: github: not found')).toBe(true);
  });

  test('settings reflects the passed-in settings', () => {
    const out = processCommand('settings', { fontSize: 'large', theme: 'nord', accentColor: 'blue' }).output;
    const joined = out.map(l => l.text).join('\n');
    expect(joined).toContain('large');
    expect(joined).toContain('nord');
    expect(joined).toContain('blue');
  });

  test('contact uses aligned text labels without fallback symbol glyphs', () => {
    const out = processCommand('contact', S).output;
    expect(out).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'link',
        text: '  Email   index@hongzhexie.com',
        href: 'mailto:index@hongzhexie.com',
        cls: 't-contact-link',
      }),
      expect.objectContaining({
        type: 'link',
        text: '  GitHub  github.com/MacroXie04',
        href: 'https://github.com/MacroXie04',
        cls: 't-contact-link',
      }),
      expect.objectContaining({
        type: 'link',
        text: '  Phone   +1 (206) 333-8881',
        href: 'tel:+12063338881',
        cls: 't-contact-link',
      }),
    ]));
    expect(out.map(line => line.text || '').join('\n')).not.toMatch(/[✉■☎]/);
  });

  test('unknown command suggests the closest match', () => {
    const out = processCommand('helpp', S).output;
    expect(out.some(l => l.text === "Unknown command: 'helpp'. Did you mean 'help'?")).toBe(true);
  });

  test('truly unknown command falls back to help hint', () => {
    const out = processCommand('zzzzzzzzz', S).output;
    expect(out.some(l => l.text.includes("Type 'help' for essential commands."))).toBe(true);
  });

  test('command name is case-insensitive', () => {
    expect(processCommand('HELP', S)).toEqual(processCommand('help', S));
  });
});

describe('cat byte-parity through the VFS', () => {
  const expected = (section, highlighter) => [
    txt(''),
    ...section.content.split('\n').map((l) => html(highlighter(l))),
    txt(''),
  ];

  test('cat README.md renders byte-identically (markdown)', () => {
    expect(processCommand('cat README.md', S).output).toEqual(expected(readme, highlightMarkdown));
  });
  test('cat experience.py renders byte-identically (python)', () => {
    expect(processCommand('cat experience.py', S).output).toEqual(expected(experience, highlightPython));
  });
  test('cat skills.sql renders byte-identically (SQL)', () => {
    expect(processCommand('cat skills.sql', S).output).toEqual(expected(skills, highlightSQL));
  });
  test('case-insensitive filename still resolves', () => {
    expect(processCommand('cat readme.md', S).output).toEqual(cmdCat(['README.md'], HOME));
  });
  test('quoted filename resolves like an unquoted filename', () => {
    expect(processCommand('cat "README.md"', S)).toEqual(processCommand('cat README.md', S));
  });
  test('missing file errors', () => {
    const out = processCommand('cat nope.txt', S).output;
    expect(out.some((l) => l.text === 'cat: nope.txt: No such file or directory')).toBe(true);
  });
});

describe('shell-style tokenization', () => {
  const text = (command) => processCommand(command, S).output
    .map((line) => line.text || line.content || '')
    .join('\n');

  test('single quotes preserve a find glob', () => {
    const body = text("find -name '*.md'");
    expect(body).toContain('/home/visitor/README.md');
    expect(body).toContain('/home/visitor/projects/mobileid.md');
  });

  test('quoted and backslash-escaped multi-word grep patterns stay one argument', () => {
    expect(text('grep "Full-Stack Software Engineer" README.md')).toContain('Full-Stack Software Engineer');
    expect(text('grep Full-Stack\\ Software\\ Engineer README.md')).toContain('Full-Stack Software Engineer');
  });

  test('unclosed quotes and a trailing escape return clear parse errors', () => {
    expect(text('cat "README.md')).toContain('Shell parse error: unmatched double quote.');
    expect(text("cat 'README.md")).toContain('Shell parse error: unmatched single quote.');
    expect(text('cat README.md\\')).toContain('Shell parse error: trailing escape character.');
  });
});

describe('cd / cwd', () => {
  test('successful cd returns setCwd to the absolute dir', () => {
    expect(processCommand('cd projects', S)).toEqual({ setCwd: '/home/visitor/projects', output: [] });
  });
  test('cd into a file is "Not a directory"', () => {
    const r = processCommand('cd README.md', S);
    expect(r.setCwd).toBeUndefined();
    expect(r.output.some((l) => l.text === 'cd: README.md: Not a directory')).toBe(true);
  });
  test('failed cd leaves cwd unchanged (no setCwd)', () => {
    const r = processCommand('cd nope', S);
    expect(r.setCwd).toBeUndefined();
    expect(r.output.some((l) => l.text === 'cd: nope: No such file or directory')).toBe(true);
  });
  test('pwd reflects the passed-in cwd', () => {
    const out = processCommand('pwd', { ...S, cwd: '/home/visitor/projects' }).output;
    expect(out.some((l) => l.text === '/home/visitor/projects')).toBe(true);
  });
  test('ls is path-aware relative to cwd', () => {
    const out = processCommand('ls', { ...S, cwd: '/home/visitor/projects' }).output;
    const joined = out.map((l) => l.text).join('  ');
    expect(joined).toContain('mobileid.md');
    expect(joined).toContain('tokenrouter.md');
  });
});
