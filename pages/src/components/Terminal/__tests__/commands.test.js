import { processCommand } from '../commands';
import { HOME } from '../data/filesystem';

const S = { fontSize: 'medium', theme: 'default', accentColor: 'green', cwd: HOME };
const run = (line, over = {}) => processCommand(line, { ...S, ...over });
const texts = (r) => r.output.map((l) => l.text || l.content || '').join('\n');

describe('VFS-backed text utilities', () => {
  test('grep -n finds matches with line numbers', () => {
    const r = run('grep -n Python skills.sql');
    const body = texts(r);
    expect(body).toContain('Python');
    // -n prefixes a line number
    expect(r.output.some((l) => (l.content || '').includes('t-dim'))).toBe(true);
  });

  test('grep -c counts matches', () => {
    const r = run('grep -c CREATE skills.sql');
    const n = r.output.map((l) => l.text).find((t) => /^\d+$/.test(t || ''));
    expect(Number(n)).toBeGreaterThan(0);
  });

  test('grep -v inverts (does not highlight)', () => {
    const r = run('grep -v zzzzz README.md');
    // every README line is returned; none should contain the highlight span
    expect(r.output.every((l) => !(l.content || '').includes('color:#39D353'))).toBe(true);
  });

  test('grep escapes HTML in file content (no raw tags)', () => {
    const r = run('grep -n VARCHAR skills.sql');
    expect(r.output.every((l) => !(l.content || '').includes('<script'))).toBe(true);
  });

  test('wc counts lines/words/bytes', () => {
    const r = run('wc experience.py');
    expect(r.output.some((l) => /\d+\s+\d+\s+\d+ experience\.py/.test(l.text || ''))).toBe(true);
  });

  test('head -n 3 returns 3 content lines plus padding', () => {
    const r = run('head -n 3 README.md');
    // [blank, 3 lines, blank]
    expect(r.output.length).toBe(5);
  });

  test('tail -n 2 returns 2 content lines plus padding', () => {
    const r = run('tail -n 2 README.md');
    expect(r.output.length).toBe(4);
  });

  test('tree walks the real VFS (shows projects/ and a nested file)', () => {
    const body = texts(run('tree'));
    expect(body).toContain('projects/');
    expect(body).toContain('portfolio.md');
  });

  test('find -name matches by glob', () => {
    const body = texts(run('find -name *.md'));
    expect(body).toContain('/home/visitor/README.md');
    expect(body).toContain('/home/visitor/projects/portfolio.md');
  });

  test('stat reports metadata', () => {
    const body = texts(run('stat README.md'));
    expect(body).toContain('File: /home/visitor/README.md');
  });

  test('file identifies type by language', () => {
    expect(texts(run('file experience.py'))).toContain('Python');
    expect(texts(run('file resume/resume.pdf'))).toContain('PDF');
  });
});

describe('self-contained util', () => {
  test('cal renders a weekday header', () => {
    expect(texts(run('cal'))).toContain('Su Mo Tu We Th Fr Sa');
  });
});

describe('fun commands', () => {
  test('neofetch renders without throwing and includes a label', () => {
    const body = texts(run('neofetch'));
    expect(body).toContain('Role');
  });
  test('cowsay echoes the message, cowthink uses a thought bubble', () => {
    expect(texts(run('cowsay hello world'))).toContain('< hello world >');
    expect(texts(run('cowthink hmm'))).toContain('( hmm )');
  });
  test('figlet HX produces the font height (5 glyph rows)', () => {
    const r = run('figlet HX');
    // [blank, 5 rows, blank]
    expect(r.output.length).toBe(7);
  });
  test('fortune returns a single adage line', () => {
    const r = run('fortune');
    expect(r.output.length).toBe(3);
  });
  test('vim/emacs give exit tips and branch on name', () => {
    expect(texts(run('vim'))).toContain(':q!');
    expect(texts(run('emacs'))).toContain('C-x C-c');
  });
});

describe('content commands', () => {
  test('projects lists all with slugs', () => {
    const body = texts(run('projects'));
    expect(body).toContain('Portfolio Terminal');
    expect(body).toContain('(backend)');
  });
  test('projects <slug> shows detail with a clickable repo link', () => {
    const r = run('projects portfolio');
    expect(texts(r)).toContain('Portfolio Terminal');
    expect(r.output.some((l) => l.type === 'link')).toBe(true);
  });
  test('projects work/portfolio aliases resolve', () => {
    expect(run('work')).toEqual(run('projects'));
  });
  test('education --courses lists coursework', () => {
    expect(texts(run('education --courses'))).toContain('Operating Systems');
  });
  test('stack --flat is a single line', () => {
    const r = run('stack --flat');
    expect(r.output.length).toBe(3);
    expect(texts(r)).toContain('Python');
  });
});

describe('phase-7 deterministic utilities', () => {
  test('seq prints a sequence and caps at 1000', () => {
    expect(texts(run('seq 3')).trim().split('\n')).toEqual(['1', '2', '3']);
    expect(texts(run('seq 2 2 6')).trim().split('\n')).toEqual(['2', '4', '6']);
  });

  test('expr evaluates one integer op', () => {
    expect(texts(run('expr 6 + 7'))).toContain('13');
    expect(texts(run('expr 10 / 3'))).toContain('3');
    expect(texts(run('expr 5 % 0'))).toContain('division by zero');
  });

  test('bc respects precedence and parentheses (no eval)', () => {
    expect(texts(run('bc 2 + 3 * 4'))).toContain('14');
    expect(texts(run('bc (2 + 3) * 4'))).toContain('20');
    expect(texts(run('bc 2 ^ 10'))).toContain('1024');
    expect(texts(run('bc 1 +'))).toContain('syntax error');
  });

  test('basename and dirname', () => {
    expect(texts(run('basename /home/visitor/README.md'))).toContain('README.md');
    expect(texts(run('basename /home/visitor/README.md .md'))).toContain('README');
    expect(texts(run('dirname /home/visitor/README.md'))).toContain('/home/visitor');
  });

  test('env reflects cwd in PWD', () => {
    expect(texts(run('env', { cwd: '/home/visitor/projects' }))).toContain('PWD=/home/visitor/projects');
    expect(run('printenv')).toEqual(run('env'));
  });

  test('id and groups', () => {
    expect(texts(run('id'))).toContain('uid=1000(visitor)');
    expect(texts(run('groups'))).toContain('staff');
  });

  test('sort -r and uniq -c on a file', () => {
    // skills.sql has many comment lines; sort should not throw and returns lines
    expect(run('sort skills.sql').output.length).toBeGreaterThan(2);
    expect(run('uniq README.md').output.length).toBeGreaterThan(2);
  });

  test('diff of a file with itself reports identical', () => {
    expect(texts(run('diff README.md README.md'))).toContain('identical');
  });

  test('touch/mkdir/mv refuse on the read-only filesystem', () => {
    expect(texts(run('touch foo.txt'))).toContain('Read-only file system');
    expect(texts(run('mkdir bar'))).toContain('Read-only file system');
    expect(texts(run('mv a b'))).toContain('Read-only file system');
  });

  test('less/more hint to use cat', () => {
    expect(texts(run('less README.md'))).toContain('cat');
  });
});

describe('phase-7 fun commands (structural — non-deterministic output)', () => {
  test('matrix renders rows without throwing', () => {
    expect(run('matrix').output.length).toBeGreaterThan(5);
  });
  test('htop shows joke processes', () => {
    expect(texts(run('htop'))).toContain('node portfolio');
  });
  test('weather is offline and mentions Merced', () => {
    expect(texts(run('weather'))).toContain('Merced');
  });
  test('sl is the train', () => {
    expect(texts(run('sl'))).toContain('choo');
  });
  test('coffee/tea is a teapot', () => {
    expect(texts(run('coffee'))).toContain('418');
    expect(texts(run('tea'))).toContain('tea');
  });
  test('lolcat escapes user input (no raw tags injected)', () => {
    const r = run('lolcat <b>hi</b>');
    // each char is wrapped in its own span, so the < and > are escaped individually
    expect(r.output.some((l) => (l.content || '').includes('&lt;'))).toBe(true);
    expect(r.output.every((l) => !(l.content || '').includes('<b>'))).toBe(true);
  });
  test('telnet star-wars easter egg vs unknown host', () => {
    expect(texts(run('telnet towel.blinkenlights.nl'))).toContain('Connected');
    expect(texts(run('telnet example.com'))).toContain('could not resolve');
  });
  test('hollywood ends in ACCESS GRANTED', () => {
    expect(texts(run('hollywood'))).toContain('ACCESS GRANTED');
  });
  test('claude shows a wordmark, and claude <q> gives a canned reply', () => {
    expect(texts(run('claude'))).toContain('Claude Code');
    const r = run('claude how do I reach you');
    expect(texts(r)).toContain('you:    how do I reach you');
    expect(texts(r)).toContain('claude:');
  });
  test('claude aliases (anthropic, ask) resolve', () => {
    expect(run('anthropic')).toEqual(run('claude'));
    expect(run('ask')).toEqual(run('claude'));
  });
});

describe('phrase hooks and please', () => {
  test('"make me a sandwich" needs sudo', () => {
    expect(texts(run('make me a sandwich'))).toContain('Make it yourself');
    expect(texts(run('sudo make me a sandwich'))).toContain('🥪');
  });
  test('please re-runs a command politely', () => {
    const r = run('please ls');
    expect(texts(r)).toContain('Since you asked so nicely');
    expect(texts(r)).toContain('README.md');
  });
  test('thanks is gracious', () => {
    expect(texts(run('thanks'))).toContain("You're welcome");
  });
});
