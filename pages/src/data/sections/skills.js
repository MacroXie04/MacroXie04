export const skills = {
  title: 'skills.sql',
  icon: 'SQL',
  language: 'SQL',
  content: `-- ============================================================
--  Developer Skill Registry  ·  Macro Xie
--  Schema v3.2  |  Last updated: 2026-02-22
-- ============================================================

-- ── Schema ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skill_domain (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(64)  NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS skill (
    id            SERIAL PRIMARY KEY,
    domain_id     INT          NOT NULL REFERENCES skill_domain(id),
    name          VARCHAR(128) NOT NULL,
    proficiency   SMALLINT     NOT NULL CHECK (proficiency BETWEEN 1 AND 10),
    years_exp     NUMERIC(3,1),
    tags          TEXT[],
    highlight     TEXT
);

-- ── Domain Definitions ───────────────────────────────────────
INSERT INTO skill_domain (id, name, description) VALUES
(1, 'Full-Stack Web',   'End-to-end product delivery: API design, SPA development, cloud infrastructure'),
(2, 'AI Agent Systems', 'Autonomous, goal-directed agents powered by LLM reasoning and tool use'),
(3, 'Cybersecurity',    'Secure-by-design architecture, threat modeling, and active hardening');

-- ── Skill Records ────────────────────────────────────────────
INSERT INTO skill
    (domain_id, name,                             proficiency, years_exp, tags,                                         highlight)
VALUES

-- Full-Stack Web
(1, 'Python',                                     9,  7.0, '{backend, scripting, data}',                  'Primary language across all production services'),
(1, 'Django REST Framework',                      9,  5.0, '{API, ORM, auth, JWT}',                       'JWT auth flows, querysets, custom permissions, serializer design'),
(1, 'Vue.js',                                     8,  2.0, '{SPA, reactivity, Vuex, Vite}',               'Component-driven SPAs with real-time state and DRF integration'),
(1, 'MySQL',                                      8,  4.0, '{schema-design, indexing, migrations}',        'Normalized schemas, query optimization, zero-downtime migrations'),
(1, 'Docker & Compose',                           9,  3.0, '{containers, networking, CI}',                 'Multi-service orchestration with health checks and restart policies'),
(1, 'GitHub Actions CI/CD',                       9,  3.0, '{automation, pipelines, deployment}',          'Matrix builds, artifact caching, gated deployments to cloud targets'),
(1, 'Linux & SSH Operations',                     8,  5.0, '{devops, provisioning, bash}',                 'Remote provisioning, process supervision, and incident recovery'),
(1, 'React & TypeScript',                         7,  2.0, '{frontend, hooks, type-safety}',               'This portfolio — hooks-first architecture with strict TypeScript'),
(1, 'AWS (EC2 · S3 · RDS)',                       8,  3.0, '{cloud, compute, storage, database}',          'Production deployments on EC2 with S3 storage and RDS managed databases'),
(1, 'Cloud Networking & VPC',                     8,  3.0, '{networking, load-balancing, DNS}',            'VPC design, security groups, ALB routing, and Route 53 DNS management'),
(1, 'Terraform (Infrastructure as Code)',         7,  3.0, '{IaC, provisioning, state-management}',        'Reproducible cloud infrastructure defined as versioned Terraform modules'),

-- AI Agent Systems
(2, 'Google Agent Development Kit (ADK)',          9,  1.0, '{LLM, orchestration, tools}',                 'Production agents combining reasoning, memory, and external APIs'),
(2, 'Multi-Agent Workflow Design',                 8,  3.0, '{DAG, message-passing, coordination}',        'Modular task graphs; parallel agents with shared context stores'),
(2, 'Prompt Engineering & Chain-of-Thought',       8,  4.0, '{few-shot, CoT, RAG}',                       'Structured prompting strategies for reliable, auditable outputs'),
(2, 'LLM API Integration',                         9,  4.0, '{Gemini, OpenAI, streaming, toolcalling}',   'Streaming responses, function calling, multi-modal input pipelines'),
(2, 'Evaluation & Observability',                  7,  1.0, '{evals, tracing, metrics}',                  'Automated regression evals and trace-level debugging for agents'),

-- Cybersecurity
(3, 'WebAuthn / FIDO2 Passkeys',                  9,  3.0, '{passwordless, hardware-key, biometric}',     'Full passkey flows inside Django + Vue — CTAP2 device support'),
(3, 'Multi-Factor Authentication (TOTP/FIDO)',     9,  3.0, '{TOTP, WebAuthn, 2FA}',                      'Time-based and hardware token flows with recovery-code backup'),
(3, 'RBAC & Fine-Grained Access Control',         9,  4.0, '{permissions, policy, enforcement}',          'Object-level permissions enforced at API, ORM, and UI layers'),
(3, 'REST & GraphQL Security Auditing',           8,  3.5, '{OWASP, CSRF, XSS, injection}',               'Systematic endpoint review: header hardening, Nginx TLS tuning'),
(3, 'Rate Limiting & Abuse Prevention',           8,  3.5, '{throttling, blacklisting, logging}',          'Sliding-window rate limits with JWT blacklisting and audit trails'),
(3, 'Automated Dependency Scanning',              8,  3.5, '{CVE, supply-chain, CI}',                     'Snyk / Dependabot in CI pipelines; triage and zero-day response'),
(3, 'Penetration Testing (API)',                  7,  3.0, '{Postman, exploit-repro, recon}',             'Structured exploit reproduction and regression-test harnesses');

-- ── Aggregate View ───────────────────────────────────────────
CREATE VIEW domain_summary AS
WITH ranked AS (
    SELECT
        d.name                                          AS domain,
        COUNT(s.id)                                     AS skill_count,
        ROUND(AVG(s.proficiency), 1)                    AS avg_proficiency,
        ROUND(SUM(s.years_exp), 1)                      AS total_years,
        ARRAY_AGG(s.name ORDER BY s.proficiency DESC)   AS skills
    FROM skill_domain d
    JOIN skill s ON s.domain_id = d.id
    GROUP BY d.name
)
SELECT
    domain,
    skill_count,
    avg_proficiency,
    total_years,
    skills[1:3]   AS top_skills
FROM ranked
ORDER BY avg_proficiency DESC;

SELECT * FROM domain_summary;
-- domain               | skill_count | avg_proficiency | total_years | top_skills
-- ---------------------|-------------|-----------------|-------------|----------------------------------
-- Cybersecurity         |           7 |             8.3 |        23.5 | {WebAuthn, MFA, RBAC}
-- Full-Stack Web        |          11 |             8.2 |        40.0 | {Python, Django, Docker}
-- AI Agent Systems      |           5 |             8.2 |        13.0 | {ADK, LLM Integration, Prompting}
`,
  contentPath: null
};
