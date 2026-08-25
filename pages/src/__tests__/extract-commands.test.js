import { COMMANDS } from '../components/Terminal/registry';

test('extract commands', () => {
  const meta = COMMANDS.map(cmd => {
    const out = {
      name: cmd.name,
      category: cmd.category,
      summary: cmd.summary || null,
    };
    if (cmd.aliases?.length) out.aliases = cmd.aliases;
    if (cmd.man) out.man = cmd.man;
    if (cmd.path) out.path = cmd.path;
    if (cmd.hidden) out.hidden = true;
    if (cmd.run?.name) out.handler = cmd.run.name;
    if (cmd.pre?.name) out.pre = cmd.pre.name;
    if (cmd.completer?.name) out.completer = cmd.completer.name;
    return out;
  });
  // This test is also a machine-readable registry export consumed by tooling.
  // eslint-disable-next-line no-console
  console.log('__JSON_START__' + JSON.stringify(meta) + '__JSON_END__');
  expect(true).toBe(true);
});
