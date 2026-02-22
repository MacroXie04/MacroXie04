import profileImg from '../../assets/profile_img.jpeg';

const PROFILE = {
  type: 'profile',
  imgSrc: profileImg,
  name: 'Hongzhe Xie',
  role: 'Full Stack & Cloud Engineer',
  education: 'UC Merced · CS&E · Class of 2028',
  tagline: 'Dream it. Chase it. Code it.',
  email: 'xiehongzhe04@gmail.com',
  github: 'https://github.com/MacroXie04',
  phone: '+1 (206) 333-8881',
};

function txt(text, cls = '') {
  return { type: 'text', text, cls };
}

function html(content) {
  return { type: 'html', content };
}

const EXPERIENCE_ITEMS = [
  {
    title: 'Full-Stack Software Engineer',
    org: 'UC Merced',
    desc: 'Build and operate production web systems serving external business stakeholders through UC Merced\'s Innovate to Grow initiative. Translate business requirements into scalable backend architectures using Django and RESTful service design principles. Own end-to-end delivery lifecycle including database schema design, API development, cloud deployment, and production monitoring.',
  },
  {
    title: 'Attendee',
    org: 'Google I/O 2025',
    desc: 'Attended keynote and developer sessions on AI, Android, and web technologies. Participated in hands-on workshops utilizing the Agent Development Kit (ADK) and applying best practices in web performance optimization.',
  },
  {
    title: 'Python Software Engineer',
    org: 'China Academy of Building Research',
    desc: 'Participated in a semantic segmentation project using Python and deep learning to identify rooftop areas from aerial imagery. Preprocessed image datasets, annotated data, and trained models for optimizing solar panel placement analysis.',
  },
  {
    title: 'Participant',
    org: 'Microsoft AI Day 2024',
    desc: 'Engaged directly with Microsoft AI experts to discuss emerging innovations and real-world applications of artificial intelligence. Gained insights into the future direction of AI research, development, and enterprise integration.',
  },
  {
    title: 'Financial Data Analyst',
    org: 'Citibank',
    desc: 'Conducted financial analysis using Excel and Python, leveraging company fundamentals to evaluate performance. Created dashboards to visualize KPIs, enhancing clarity in economic reporting and investor decision-making.',
  },
];

const SKILL_GROUPS = [
  {
    category: 'Full-Stack Web Development',
    skills: ['Python', 'Django REST Framework', 'Vue.js', 'MySQL Schema Design', 'Docker', 'GitHub Actions CI/CD', 'SSH & Linux Ops'],
  },
  {
    category: 'Google Agent Development Kit (ADK)',
    skills: ['Agent Development Kit (ADK)', 'Multi-Modal Pipelines', 'Message-Passing Workflows'],
  },
  {
    category: 'Cybersecurity & Secure Systems',
    skills: ['WebAuthn / FIDO2 Passkeys', 'Multi-Factor Authentication', 'Security Audits (REST & GraphQL)', 'RBAC & Fine-Grained Permissions', 'Rate Limiting & Token Blacklisting', 'Automated Security Scanning', 'Postman Penetration Testing'],
  },
  {
    category: 'C++ GUI Application Development',
    skills: ['Bobcat UI (FLTK)', 'STEAMplug IDE', 'Dockerized C++ Toolchain'],
  },
];

function highlightPython(line) {
  const keywords = ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'in', 'not', 'and', 'or', 'True', 'False', 'None', 'self', 'with', 'as', 'try', 'except', 'pass'];
  let result = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (result.trim().startsWith('#') || result.trim() === '"""' || result.trim().startsWith('"""')) {
    return `<span class="t-comment">${result}</span>`;
  }

  result = result.replace(/"([^"]*)"/g, '<span class="t-string">"$1"</span>');
  result = result.replace(/'([^']*)'/g, "<span class=\"t-string\">'$1'</span>");
  keywords.forEach(kw => {
    result = result.replace(new RegExp(`\\b${kw}\\b`, 'g'), `<span class="t-keyword">${kw}</span>`);
  });
  return result;
}

function highlightSQL(line) {
  const keywords = ['INSERT', 'INTO', 'VALUES', 'SELECT', 'FROM', 'WHERE', 'CREATE', 'TABLE', 'DROP', 'UPDATE', 'SET', 'DELETE', 'NULL', 'NOT', 'PRIMARY', 'KEY'];
  let result = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  if (result.trim().startsWith('--') || result.trim().startsWith('/*') || result.trim().startsWith('*') || result.trim().endsWith('*/')) {
    return `<span class="t-comment">${result}</span>`;
  }

  result = result.replace(/'([^']*)'/g, "<span class=\"t-string\">'$1'</span>");
  keywords.forEach(kw => {
    result = result.replace(new RegExp(`\\b${kw}\\b`, 'g'), `<span class="t-keyword">${kw}</span>`);
  });
  return result;
}

function highlightMarkdown(line) {
  const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (/^#{1,3} /.test(escaped)) return `<span class="t-blue">${escaped}</span>`;
  if (escaped.startsWith('- ') || escaped.startsWith('* ')) return `<span class="t-dim">${escaped}</span>`;
  if (escaped.startsWith('**') && escaped.endsWith('**')) return `<span class="t-green">${escaped}</span>`;
  return escaped;
}

function handleCat(file) {
  if (!file) {
    return [txt(''), txt('Usage: cat <file>', 't-error'), txt('')];
  }

  if (file === 'README.md' || file === 'readme.md') {
    const lines = [
      "# Hi, I'm Hongzhe Xie",
      '',
      'Dream it. Chase it. Code it.',
      '',
      '## Professional Summary',
      '- Full-Stack Software Engineer @ UC Merced (Innovate to Grow)',
      '- Google Agent Development Kit (ADK)',
      '- Cybersecurity & Secure Systems Development',
      '- C++ GUI Application Development',
      '',
      '## Education',
      '**University of California, Merced**',
      'Bachelor of Science in Computer Science & Engineering',
      'Class of 2028',
      '',
      '## Recent Highlights',
      '- Building production web systems at UC Merced\'s Innovate to Grow initiative.',
      '- Google I/O 2025: Hands-on with the Agent Development Kit (ADK)',
      '  and web performance best practices.',
      '',
      '## Contact',
      'xiehongzhe04@gmail.com',
      'github.com/MacroXie04',
      '+1 (206) 333-8881',
    ];
    return [txt(''), ...lines.map(l => html(highlightMarkdown(l))), txt('')];
  }

  if (file === 'experience.py') {
    const lines = [
      '"""',
      "Structured representation of Hongzhe Xie's professional experience.",
      '"""',
      '',
      'experiences = [',
      '    {',
      '        "title": "Full-Stack Software Engineer",',
      '        "organization": "UC Merced",',
      '        "summary": (',
      '            "Build and operate production web systems serving external business "',
      '            "stakeholders through UC Merced\'s Innovate to Grow initiative. "',
      '            "Translate business requirements into scalable backend architectures "',
      '            "using Django and RESTful service design principles."',
      '        ),',
      '    },',
      '    {',
      '        "title": "Attendee",',
      '        "organization": "Google I/O 2025",',
      '        "summary": (',
      '            "Attended keynote and developer sessions on AI, Android, and web "',
      '            "technologies. Participated in hands-on workshops utilizing the Agent "',
      '            "Development Kit (ADK) and applying best practices in web performance."',
      '        ),',
      '    },',
      '    {',
      '        "title": "Python Software Engineer",',
      '        "organization": "China Academy of Building Research",',
      '        "summary": (',
      '            "Participated in a semantic segmentation project using Python and deep "',
      '            "learning to identify rooftop areas from aerial imagery. Preprocessed "',
      '            "image datasets, annotated data, and trained models for optimizing "',
      '            "solar panel placement analysis."',
      '        ),',
      '    },',
      '    {',
      '        "title": "Participant",',
      '        "organization": "Microsoft AI Day 2024",',
      '        "summary": (',
      '            "Engaged directly with Microsoft AI experts to discuss emerging "',
      '            "innovations and real-world applications of artificial intelligence. "',
      '            "Gained insights into the future direction of AI research and "',
      '            "enterprise integration."',
      '        ),',
      '    },',
      '    {',
      '        "title": "Financial Data Analyst",',
      '        "organization": "Citibank",',
      '        "summary": (',
      '            "Conducted financial analysis using Excel and Python, leveraging "',
      '            "company fundamentals to evaluate performance. Created dashboards to "',
      '            "visualize KPIs, enhancing clarity in economic reporting and "',
      '            "investor decision-making."',
      '        ),',
      '    },',
      ']',
    ];
    return [txt(''), ...lines.map(l => html(highlightPython(l))), txt('')];
  }

  if (file === 'skills.sql') {
    const lines = [
      '/* ----------------------------------------------------------',
      '   Core skills grouped by primary focus areas',
      '   ----------------------------------------------------------*/',
      'INSERT INTO skill (developer_id, skill_name, category, level) VALUES',
      '-- Python Full-Stack Web Development',
      "(1, 'Python',                    'Full-Stack Web',   'Advanced'),",
      "(1, 'Django REST Framework',     'Full-Stack Web',   'Advanced'),",
      "(1, 'Vue.js',                    'Full-Stack Web',   'Advanced'),",
      "(1, 'MySQL Schema Design',       'Full-Stack Web',   'Advanced'),",
      "(1, 'Docker',                    'Full-Stack Web',   'Advanced'),",
      "(1, 'GitHub Actions CI/CD',      'Full-Stack Web',   'Advanced'),",
      "(1, 'SSH & Linux Ops',           'Full-Stack Web',   'Advanced'),",
      '',
      '-- Google Agent Development Kit (ADK)',
      "(1, 'Agent Development Kit (ADK)', 'Agent Development', 'Advanced'),",
      "(1, 'Multi-Modal Pipelines',       'Agent Development', 'Advanced'),",
      "(1, 'Message-Passing Workflows',   'Agent Development', 'Advanced'),",
      '',
      '-- Cybersecurity & Secure Systems Development',
      "(1, 'WebAuthn / FIDO2 Passkeys',         'Cybersecurity', 'Advanced'),",
      "(1, 'Multi-Factor Authentication',        'Cybersecurity', 'Advanced'),",
      "(1, 'Security Audits (REST & GraphQL)',    'Cybersecurity', 'Advanced'),",
      "(1, 'RBAC & Fine-Grained Permissions',    'Cybersecurity', 'Advanced'),",
      "(1, 'Rate Limiting & Token Blacklisting', 'Cybersecurity', 'Advanced'),",
      "(1, 'Automated Security Scanning',        'Cybersecurity', 'Advanced'),",
      "(1, 'Postman Penetration Testing',        'Cybersecurity', 'Advanced'),",
      '',
      '-- C++ GUI Application Development',
      "(1, 'Bobcat UI (FLTK)',        'C++ GUI', 'Intermediate'),",
      "(1, 'STEAMplug IDE',           'C++ GUI', 'Intermediate'),",
      "(1, 'Dockerized C++ Toolchain','C++ GUI', 'Advanced');",
    ];
    return [txt(''), ...lines.map(l => html(highlightSQL(l))), txt('')];
  }

  return [txt(''), txt(`cat: ${file}: No such file or directory`, 't-error'), txt('')];
}

const COMMANDS = {
  help: () => ({
    output: [
      txt(''),
      txt('Available commands:', 't-title'),
      txt(''),
      txt('  about        About me and contact info', 't-dim'),
      txt('  whoami       Alias for about', 't-dim'),
      txt('  experience   Work experience', 't-dim'),
      txt('  skills       Technical skills', 't-dim'),
      txt('  contact      Contact information', 't-dim'),
      txt('  ls           List files', 't-dim'),
      txt('  cat <file>   View file (README.md, experience.py, skills.sql)', 't-dim'),
      txt('  github       Open GitHub profile', 't-dim'),
      txt('  clear        Clear terminal', 't-dim'),
      txt(''),
    ],
  }),

  about: () => ({
    output: [
      txt(''),
      PROFILE,
      txt(''),
    ],
  }),

  whoami: () => COMMANDS.about(),

  experience: () => ({
    output: [
      txt(''),
      txt('Work Experience', 't-title'),
      txt(''),
      ...EXPERIENCE_ITEMS.flatMap((item, i) => [
        txt(`  ${item.title}`, 't-green'),
        txt(`  @ ${item.org}`, 't-blue'),
        txt(''),
        txt(`  ${item.desc}`, 't-dim'),
        ...(i < EXPERIENCE_ITEMS.length - 1 ? [txt('')] : []),
      ]),
      txt(''),
    ],
  }),

  skills: () => ({
    output: [
      txt(''),
      txt('Technical Skills', 't-title'),
      txt(''),
      ...SKILL_GROUPS.flatMap(group => [
        txt(`  ${group.category.toUpperCase()}`, 't-green'),
        txt('  ' + '\u2500'.repeat(Math.min(group.category.length + 2, 48)), 't-dim'),
        ...group.skills.map(s => txt(`    \u203a ${s}`, 't-dim')),
        txt(''),
      ]),
    ],
  }),

  contact: () => ({
    output: [
      txt(''),
      txt('Contact Information', 't-title'),
      txt(''),
      { type: 'link', text: '  \u2709  xiehongzhe04@gmail.com', href: 'mailto:xiehongzhe04@gmail.com' },
      { type: 'link', text: '  \u25a0  github.com/MacroXie04', href: 'https://github.com/MacroXie04' },
      txt('  \u260e  +1 (206) 333-8881', 't-dim'),
      txt(''),
    ],
  }),

  ls: (args) => {
    const target = args && args[0];
    if (!target || target === '.' || target === 'resume/' || target === 'resume') {
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
    return { output: [txt(''), txt(`ls: ${target}: No such file or directory`, 't-error'), txt('')] };
  },

  github: () => ({
    openUrl: 'https://github.com/MacroXie04',
    output: [txt(''), txt('Opening GitHub profile...', 't-green'), txt('')],
  }),

  settings: (_, currentFontSize) => ({
    output: [
      txt(''),
      txt('Settings', 't-title'),
      txt(''),
      txt(`  Font size   ${currentFontSize || 'medium'}`, 't-dim'),
      txt(''),
      txt('  Use  font <size>  to change font size.', 't-dim'),
      txt('  Available sizes: small  medium  large  xlarge', 't-dim'),
      txt(''),
    ],
  }),

  font: (args, currentFontSize) => {
    const SIZES = ['small', 'medium', 'large', 'xlarge'];
    const size = args && args[0] && args[0].toLowerCase();
    if (!size) {
      return {
        output: [
          txt(''),
          txt(`Current font size: ${currentFontSize || 'medium'}`, 't-dim'),
          txt('Usage: font <small|medium|large|xlarge>', 't-dim'),
          txt(''),
        ],
      };
    }
    if (!SIZES.includes(size)) {
      return {
        output: [
          txt(''),
          txt(`font: '${size}' is not a valid size. Use: small  medium  large  xlarge`, 't-error'),
          txt(''),
        ],
      };
    }
    return {
      action: 'setFontSize',
      value: size,
      output: [
        txt(''),
        txt(`Font size set to: ${size}`, 't-green'),
        txt(''),
      ],
    };
  },
};

export function processCommand(input, currentFontSize) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();

  if (cmd === 'clear') {
    return { clear: true };
  }

  if (cmd === 'cat') {
    return { output: handleCat(parts[1]) };
  }

  if (cmd === 'ls') {
    return COMMANDS.ls(parts.slice(1));
  }

  if (COMMANDS[cmd]) {
    return COMMANDS[cmd](parts.slice(1), currentFontSize);
  }

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

export const QUICK_COMMANDS = ['help', 'about', 'experience', 'skills', 'contact', 'ls', 'github', 'clear'];

const ALL_COMMANDS = ['about', 'cat', 'clear', 'contact', 'experience', 'font', 'github', 'help', 'ls', 'settings', 'skills', 'whoami'];
const CAT_FILES = ['README.md', 'experience.py', 'skills.sql'];

function commonPrefix(strs) {
  if (!strs.length) return '';
  return strs.reduce((prefix, str) => {
    let i = 0;
    while (i < prefix.length && i < str.length && prefix[i] === str[i]) i++;
    return prefix.slice(0, i);
  });
}

export function getCompletions(input) {
  const parts = input.split(/\s+/);
  const afterSpace = input.endsWith(' ');

  // Completing 'cat <file>'
  if (parts[0].toLowerCase() === 'cat' && (parts.length >= 2 || afterSpace)) {
    const partial = afterSpace ? '' : (parts[1] || '');
    const matches = CAT_FILES.filter(f => f.toLowerCase().startsWith(partial.toLowerCase()));
    const prefix = commonPrefix(matches);
    return { type: 'arg', prefix: 'cat ', partial, matches, common: prefix };
  }

  // Completing a command name (only first token, no space yet)
  if (parts.length === 1 && !afterSpace) {
    const partial = parts[0].toLowerCase();
    const matches = ALL_COMMANDS.filter(c => c.startsWith(partial));
    const prefix = commonPrefix(matches);
    return { type: 'cmd', partial, matches, common: prefix };
  }

  return { type: 'none', matches: [] };
}
