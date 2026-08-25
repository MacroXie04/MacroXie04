import {
  HOME, ROOT, resolvePath, getNode, listDir, readFile, rawSize, utf8Size,
  stat, walk, completeChildren, isDir, isFile,
} from '../data/filesystem';

describe('resolvePath', () => {
  test('empty / undefined resolves to cwd', () => {
    expect(resolvePath(HOME, '')).toBe(HOME);
    expect(resolvePath(HOME, undefined)).toBe(HOME);
    expect(resolvePath('/home/visitor/projects', '.')).toBe('/home/visitor/projects');
  });

  test('~ expands to HOME', () => {
    expect(resolvePath('/etc', '~')).toBe(HOME);
    expect(resolvePath('/etc', '~/projects')).toBe('/home/visitor/projects');
  });

  test('absolute paths are used as-is', () => {
    expect(resolvePath('/home/visitor', '/etc/motd')).toBe('/etc/motd');
  });

  test('relative paths join onto cwd', () => {
    expect(resolvePath(HOME, 'projects')).toBe('/home/visitor/projects');
    expect(resolvePath('/home/visitor/projects', '../resume')).toBe('/home/visitor/resume');
  });

  test('.. is clamped at root', () => {
    expect(resolvePath('/', '..')).toBe('/');
    expect(resolvePath(HOME, '../../../../..')).toBe('/');
  });

  test('trailing slashes are stripped', () => {
    expect(resolvePath(HOME, 'projects/')).toBe('/home/visitor/projects');
  });
});

describe('getNode', () => {
  test('resolves real nodes', () => {
    expect(getNode('/')).toBe(ROOT);
    expect(isDir(getNode(HOME))).toBe(true);
    expect(isFile(getNode('/home/visitor/README.md'))).toBe(true);
    expect(isDir(getNode('/home/visitor/projects'))).toBe(true);
    expect(isFile(getNode('/home/visitor/resume/Hongzhe_CV.pdf'))).toBe(true);
    expect(isFile(getNode('/home/visitor/resume/resume.pdf'))).toBe(true);
  });

  test('missing paths return null', () => {
    expect(getNode('/home/visitor/nope.txt')).toBeNull();
    expect(getNode('/no/such/dir')).toBeNull();
  });

  test('segment match is case-insensitive', () => {
    expect(getNode('/home/visitor/readme.md')).toBe(getNode('/home/visitor/README.md'));
    expect(getNode('/home/visitor/EXPERIENCE.PY')).toBe(getNode('/home/visitor/experience.py'));
  });
});

describe('completeChildren', () => {
  test('can restrict results to directories without changing the default', () => {
    expect(completeChildren(HOME, '')).toContain('README.md');
    expect(completeChildren(HOME, '', { directoriesOnly: true })).toEqual(['projects/', 'resume/']);
  });

  test('can include hidden entries explicitly', () => {
    expect(completeChildren(HOME, '')).not.toContain('.profile');
    expect(completeChildren(HOME, '', { all: true })).toContain('.profile');
    expect(completeChildren(HOME, '.')).toContain('.profile');
  });
});

describe('listDir', () => {
  test('hides dotfiles unless all=true', () => {
    const visible = listDir(getNode(HOME)).map((n) => n.name);
    expect(visible).not.toContain('.profile');
    expect(visible).not.toContain('.secret');
    expect(visible).toContain('README.md');
    expect(visible).toContain('projects');

    const all = listDir(getNode(HOME), { all: true }).map((n) => n.name);
    expect(all).toContain('.profile');
    expect(all).toContain('.secret');
  });

  test('returns names sorted', () => {
    const names = listDir(getNode(HOME)).map((n) => n.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('readFile / stat / walk', () => {
  test('readFile returns lines and the node lang', () => {
    const { lines, lang } = readFile(getNode('/home/visitor/experience.py'));
    expect(lang).toBe('python');
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBeGreaterThan(1);
  });

  test('stat reports type and metadata', () => {
    const s = stat(HOME);
    expect(s.type).toBe('dir');
    expect(s.perm).toBe('drwxr-xr-x');
    const f = stat('/home/visitor/resume/Hongzhe_CV.pdf');
    expect(f.type).toBe('file');
    expect(f.pdf).toBe(true);
    expect(f.bytes).toBe(40719);
    expect(f.pdfVersion).toBe('1.5');
    expect(f.pages).toBe(2);
    expect(stat('/home/visitor/resume/resume.pdf')).toEqual(expect.objectContaining({ bytes: 40719 }));
  });

  test('text sizes are UTF-8 bytes, not UTF-16 code units', () => {
    expect(utf8Size('ASCII')).toBe(5);
    expect(utf8Size('🎉')).toBe(4);
    expect(rawSize(getNode('/home/visitor/.secret'))).toBe(166);
  });

  test('walk yields the subtree', () => {
    const paths = walk(HOME).map(([p]) => p);
    expect(paths).toContain(HOME);
    expect(paths).toContain('/home/visitor/projects/mobileid.md');
    expect(paths).toContain('/home/visitor/projects/tokenrouter.md');
    expect(paths).toContain('/home/visitor/resume/Hongzhe_CV.pdf');
    expect(paths).toContain('/home/visitor/.secret');
  });
});
