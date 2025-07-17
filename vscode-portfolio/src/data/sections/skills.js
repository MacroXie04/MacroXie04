export const skills = {
  title: 'skills.sql',
  icon: 'SQL',
  language: 'SQL',
  content: `/* ----------------------------------------------------------
   Insert your core skills
   ----------------------------------------------------------*/
INSERT INTO skill (developer_id, skill_name, category, level, notes) VALUES
-- Languages & Back-end
(1, 'Python',                'Language',  'Advanced',      'Primary language'),
(1, 'SQL',                   'Language',  'Advanced',      'PostgreSQL & MySQL'),
(1, 'C++',                   'Language',  'Advanced',  'React focus'),
(1, 'Java',                  'Language',  'Intermediate',  'Spring Boot focus'),
(1, 'JavaScript',            'Language',  'Intermediate',  'React focus'),
(1, 'VUE',                   'Language',  'Intermediate',  'front-end focus'),


-- Frameworks & Libraries
(1, 'Django',                'Framework', 'Advanced',      'REST APIs, ORM, auth'),
(1, 'Django REST Framework', 'Framework', 'Advanced',      'API design & JWT auth'),
(1, 'Spring Boot',           'Framework', 'Intermediate',  'Building RESTful services'),

-- DevOps & Tooling
(1, 'Git',                   'DevOps',    'Advanced',      'Feature-branch workflow'),
(1, 'GitHub Actions',        'DevOps',    'Advanced',      'CI/CD pipelines'),
(1, 'Docker',                'DevOps',    'Intermediate',  'Containerizing apps'),
(1, 'SSH & Linux',           'DevOps',    'Advanced',      'Remote deployment & debugging'),

-- Cloud & Deployment
(1, 'Tencent Cloud Platform', 'Cloud',     'Intermediate',  'Compute Engine, Cloud SQL'),

-- Data & AI
(1, 'Pandas / NumPy',        'Data',      'Intermediate',  'Data analysis & ETL'),
(1, 'Computer Vision',       'AI/ML',     'Intermediate',  'Semantic segmentation (roof PV)'),

-- Miscellaneous
(1, 'Excel (Advanced)',      'Data',      'Advanced',      'Financial KPI dashboards'),
(1, 'Cross-cultural Comms',  'Soft Skill','Advanced',      'Mentoring & collaboration');`
}; 