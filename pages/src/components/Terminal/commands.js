import { txt } from './handlers/shared';
import { PROFILE } from './data/profile';
import { handleSudo, isDestructiveRm } from './handlers/sudo';
import { cmdHelp, cmdAbout, cmdExperience, cmdSkills, cmdContact, cmdSeventeen } from './handlers/infoCommands';
import { cmdLs, cmdCat, cmdGithub, cmdPwd, cmdEcho, cmdCd } from './handlers/fsCommands';
import {
  cmdUname, cmdDate, cmdUptime, cmdPing, cmdExit,
  cmdHistory as buildHistory, cmdSettings, cmdFont, cmdTheme, cmdColor,
  cmdMan, cmdWhich, cmdPrint, cmdDownloadCv,
} from './handlers/utilCommands';
export { getCompletions } from './utils/completions';

export function processCommand(input, settings = {}, cmdHistory = []) {
  const { fontSize, theme, accentColor } = settings;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (cmd === 'quit')     return { quit: true };
  if (cmd === 'clear')    return { clear: true };
  if (cmd === 'cat')      return { output: cmdCat(args[0]) };
  if (cmd === 'ls')       return cmdLs(args);
  if (cmd === 'sudo')     return handleSudo(args);
  if (cmd === 'history')  return buildHistory(cmdHistory);

  if (cmd === 'rm') {
    if (isDestructiveRm(args)) return { bomb: true, output: [] };
    return { output: [txt(''), txt('rm: permission denied', 't-error'), txt('')] };
  }

  const MAP = {
    help:       () => cmdHelp(),
    about:      () => cmdAbout(),
    whoami:     () => cmdAbout(),
    experience: () => cmdExperience(),
    skills:     () => cmdSkills(),
    contact:    () => cmdContact(),
    github:     () => cmdGithub(),
    pwd:        () => cmdPwd(),
    echo:       () => cmdEcho(args),
    cd:         () => cmdCd(args),
    uname:      () => cmdUname(args),
    date:       () => cmdDate(),
    uptime:     () => cmdUptime(),
    ping:       () => cmdPing(args),
    exit:       () => cmdExit(),
    settings:   () => cmdSettings({ fontSize, theme, color: accentColor }),
    font:       () => cmdFont(args, fontSize),
    theme:      () => cmdTheme(args, theme),
    color:      () => cmdColor(args, accentColor),
    man:        () => cmdMan(args),
    which:      () => cmdWhich(args),
    print:      () => cmdPrint(),
    cv:         () => cmdDownloadCv(),
    resume:     () => cmdDownloadCv(),
    download:   () => cmdDownloadCv(),
    seventeen:  () => cmdSeventeen(),
    svt:        () => cmdSeventeen(),
  };

  if (MAP[cmd]) return MAP[cmd]();

  return {
    output: [
      txt(''),
      txt(`${trimmed}: command not found. Type 'help' for available commands.`, 't-error'),
      txt(''),
    ],
  };
}

export function getWelcomeOutput() {
  return [
    txt(''),
    PROFILE,
    txt(''),
    txt("Welcome! Type 'help' to see available commands.", 't-dim'),
    txt(''),
  ];
}

export const QUICK_COMMANDS = ['help', 'about', 'experience', 'skills', 'contact', 'ls', 'github', 'resume', 'clear'];
