export const skills = {
  title: 'skills.sql',
  icon: 'SQL',
  language: 'SQL',
  content: `/* ----------------------------------------------------------
   Core skills grouped by primary focus areas
   ----------------------------------------------------------*/
INSERT INTO skill (developer_id, skill_name, category, level, notes) VALUES
-- Python Full-Stack Web Development
(1, 'Python',                    'Full-Stack Web',   'Advanced', 'Django REST apps and data-driven services'),
(1, 'Django REST Framework',     'Full-Stack Web',   'Advanced', 'JWT auth, ORM queries, API architecture'),
(1, 'Vue.js',                    'Full-Stack Web',   'Advanced', 'SPA front-ends integrated with DRF backends'),
(1, 'MySQL Schema Design',       'Full-Stack Web',   'Advanced', 'Normalized schemas, migrations, performance tuning'),
(1, 'Docker (Frontend & Backend)', 'Full-Stack Web', 'Advanced', 'Containerized deployment with auto-restart policies'),
(1, 'GitHub Actions CI/CD',      'Full-Stack Web',   'Advanced', 'Automated build, test, and deployment pipelines'),
(1, 'SSH & Linux Ops',           'Full-Stack Web',   'Advanced', 'Remote environment provisioning and recovery'),

-- Google Agent Development Kit (ADK)
(1, 'Agent Development Kit (ADK)', 'Agent Development', 'Advanced', 'Task-oriented agents combining LLM reasoning with tools'),
(1, 'Multi-Modal Pipelines',       'Agent Development', 'Advanced', 'Natural language + API orchestration and planning'),
(1, 'Message-Passing Workflows',   'Agent Development', 'Advanced', 'Modular task graphs enabling multi-agent collaboration'),

-- Cybersecurity & Secure Systems Development
(1, 'WebAuthn / FIDO2 Passkeys', 'Cybersecurity', 'Advanced', 'Passwordless authentication within Django + Vue stacks'),
(1, 'Multi-Factor Authentication', 'Cybersecurity', 'Advanced', 'Time-based and hardware factor integration'),
(1, 'Security Audits (REST & GraphQL)', 'Cybersecurity', 'Advanced', 'CSRF/XSS detection, HTTPS hardening in Nginx'),
(1, 'RBAC & Fine-Grained Permissions', 'Cybersecurity', 'Advanced', 'Role-scoped access enforcement for APIs and UIs'),
(1, 'Rate Limiting & Token Blacklisting', 'Cybersecurity', 'Advanced', 'Threat detection with audit logging and abuse prevention'),
(1, 'Automated Security Scanning', 'Cybersecurity', 'Advanced', 'Dependency and vulnerability checks wired into CI/CD'),
(1, 'Postman Penetration Testing', 'Cybersecurity', 'Advanced', 'Endpoint verification and exploit reproduction workflows'),

-- C++ GUI Application Development
(1, 'Bobcat UI (FLTK)',        'C++ GUI', 'Intermediate', 'Desktop interface design and event-driven patterns'),
(1, 'STEAMplug IDE',           'C++ GUI', 'Intermediate', 'Project orchestration, debugging, and release management'),
(1, 'Dockerized C++ Toolchain','C++ GUI', 'Advanced',     'Reproducible builds with consistent compiler environments');
`,
  contentPath: null
}; 