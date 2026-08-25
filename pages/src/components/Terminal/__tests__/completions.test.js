import { getCompletions } from '../commands';
import { HOME } from '../data/filesystem';

describe('context-aware tab completion', () => {
  test('command discovery excludes hidden commands', () => {
    expect(getCompletions('do', HOME).matches).not.toContain('download');
    expect(getCompletions('q', HOME).matches).not.toContain('quit');
    expect(getCompletions('r', HOME).matches).not.toContain('rm');
  });

  test('known hidden download command completes only its target argument', () => {
    expect(getCompletions('download resume.', HOME)).toEqual(expect.objectContaining({
      type: 'arg',
      matches: ['resume.pdf'],
      prefix: 'download ',
    }));
  });

  test('help/man/which complete only non-hidden command names', () => {
    expect(getCompletions('help gr', HOME).matches).toContain('grep');
    expect(getCompletions('man q', HOME).matches).not.toContain('quit');
    expect(getCompletions('which rm', HOME).matches).not.toContain('rm');
  });

  test('cd lists directories only', () => {
    const matches = getCompletions('cd ', HOME).matches;
    expect(matches).toEqual(expect.arrayContaining(['projects/', 'resume/']));
    expect(matches).not.toContain('README.md');
  });

  test('dotfiles appear only when the active basename begins with a dot', () => {
    expect(getCompletions('cat ', HOME).matches).not.toContain('.profile');
    expect(getCompletions('cat .', HOME).matches).toEqual(expect.arrayContaining(['.profile', '.secret']));
  });

  test('unfinished quoted paths normalize to an executable completion', () => {
    expect(getCompletions('cat "REA', HOME)).toEqual(expect.objectContaining({
      matches: ['README.md'],
      prefix: 'cat ',
    }));
  });

  test('find -type completes f/d while -name expects a user glob', () => {
    expect(getCompletions('find -type ', HOME).matches).toEqual(['f', 'd']);
    expect(getCompletions('find -type d', HOME).matches).toEqual(['d']);
    expect(getCompletions("find -name '*.md'", HOME).matches).toEqual([]);
  });

  test('head/tail do not offer files where -n expects a number', () => {
    expect(getCompletions('head -n ', HOME).matches).toEqual([]);
    expect(getCompletions('tail -n 5', HOME).matches).toEqual([]);
    expect(getCompletions('head -n 5 REA', HOME).matches).toEqual(['README.md']);
  });

  test('grep offers files only after its pattern', () => {
    expect(getCompletions('grep -n ', HOME).matches).toEqual([]);
    expect(getCompletions('grep -n Python REA', HOME).matches).toEqual(['README.md']);
    expect(getCompletions('grep "Full-Stack Software Engineer" REA', HOME).matches).toEqual(['README.md']);
  });
});
