import { COMMANDS, byName, ALL_NAMES, getCommand, visibleCommands } from '../registry';
import { escapeHtml } from '../handlers/shared';

describe('registry integrity', () => {
  test('every descriptor has a unique name and a run()', () => {
    const seen = new Set();
    for (const c of COMMANDS) {
      expect(typeof c.name).toBe('string');
      expect(c.name).toBe(c.name.toLowerCase());
      expect(typeof c.run).toBe('function');
      expect(seen.has(c.name)).toBe(false);
      seen.add(c.name);
    }
  });

  test('no alias collides with a name or another alias', () => {
    const all = new Set();
    for (const c of COMMANDS) all.add(c.name);
    for (const c of COMMANDS) {
      for (const a of c.aliases || []) {
        expect(all.has(a)).toBe(false);
        all.add(a);
      }
    }
  });

  test('byName resolves canonical names and every alias to the same descriptor', () => {
    for (const c of COMMANDS) {
      expect(byName.get(c.name)).toBe(c);
      for (const a of c.aliases || []) expect(byName.get(a)).toBe(c);
    }
  });

  test('ALL_NAMES excludes hidden commands but includes their non-hidden peers', () => {
    expect(ALL_NAMES).not.toContain('quit');
    expect(ALL_NAMES).not.toContain('rm');
    expect(ALL_NAMES).toContain('grep');
    expect(ALL_NAMES).toContain('egrep'); // alias included
  });

  test('every visible descriptor has a summary', () => {
    for (const c of visibleCommands()) expect(typeof c.summary).toBe('string');
  });

  test('getCommand is case-insensitive and alias-aware', () => {
    expect(getCommand('GREP')).toBe(getCommand('grep'));
    expect(getCommand('egrep')).toBe(getCommand('grep'));
    expect(getCommand('definitely-not-a-command')).toBeNull();
  });

  test('there are 60+ invokable names (canonical + aliases)', () => {
    expect(byName.size).toBeGreaterThanOrEqual(60);
  });
});

describe('escapeHtml', () => {
  test('escapes the dangerous characters', () => {
    expect(escapeHtml('<script>alert("x")&\'')).toBe('&lt;script&gt;alert(&quot;x&quot;)&amp;&#39;');
  });
});
