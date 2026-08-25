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
        txt('sudo: administrative access is disabled in this portfolio.', 't-error'),
        txt('Try: sudo make me a sandwich', 't-dim'),
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
