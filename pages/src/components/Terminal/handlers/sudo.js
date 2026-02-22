import { txt } from './shared';

export function isDestructiveRm(args) {
  const joined = args.join(' ');
  if (/-rf\b|-fr\b/.test(joined)) return true;
  if ((/-r\b|--recursive\b/.test(joined)) && (/-f\b|--force\b/.test(joined))) return true;
  if (/\brm\b/.test(joined) && /\brf\b|\bfr\b/.test(joined)) return true;
  return false;
}

export function handleSudo(parts) {
  const sub = parts[0]?.toLowerCase();

  if (isDestructiveRm(parts)) {
    return { bomb: true, output: [] };
  }

  if (!sub) {
    return {
      output: [
        txt(''),
        txt('usage: sudo -h | -K | -k | -V', 't-dim'),
        txt('usage: sudo -v [-ABkNnS] [-g group] [-h host] [-p prompt] [-u user]', 't-dim'),
        txt('usage: sudo -l [-ABkNnS] [-g group] [-h host] [-p prompt] [-U user]', 't-dim'),
        txt('            [-u user] [command [arg ...]]', 't-dim'),
        txt('usage: sudo [-ABbEHkNnPS] [-C num] [-D directory]', 't-dim'),
        txt('            [-g group] [-h host] [-p prompt] [-R directory] [-T timeout]', 't-dim'),
        txt('            [-u user] [VAR=value] [-i | -s] [command [arg ...]]', 't-dim'),
        txt('usage: sudo -e [-ABkNnS] [-C num] [-D directory]', 't-dim'),
        txt('            [-g group] [-h host] [-p prompt] [-R directory] [-T timeout]', 't-dim'),
        txt('            [-u user] file ...', 't-dim'),
        txt(''),
      ],
    };
  }

  if (sub === '-i' || sub === 'su') {
    return {
      output: [
        txt(''),
        txt('[sudo] password for visitor: ', 't-dim'),
        txt('sudo: no password supplied', 't-error'),
        txt(''),
      ],
    };
  }

  if (['apt-get', 'apt', 'brew', 'yum', 'dnf', 'pacman'].includes(sub)) {
    return {
      output: [
        txt(''),
        txt('[sudo] password for visitor: ', 't-dim'),
        txt('E: Could not open lock file — Permission denied (are you root?)', 't-error'),
        txt(''),
      ],
    };
  }

  return {
    output: [
      txt(''),
      txt('[sudo] password for visitor: ', 't-dim'),
      txt(`Sorry, user visitor is not allowed to execute '${parts.join(' ')}' as root.`, 't-error'),
      txt('This incident will be reported.', 't-dim'),
      txt(''),
    ],
  };
}
