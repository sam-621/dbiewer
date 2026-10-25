import { readFileSync } from 'node:fs';
import { exit } from 'node:process';

import { render } from './render.mjs';

const ROOT = new URL('..', import.meta.url);

const ROOT_FILES = [
  'template/CLAUDE.md',
  'template/README.md',
  'template/vscode/settings.json',
  'template/claude/skills/commit/SKILL.md.tmpl',
  'template/claude/skills/session-start/SKILL.md.tmpl'
];

const APP_TEMPLATES = [
  'template/app/CLAUDE.md',
  'template/app/commands.md',
  'template/app/agents/implementer.md.tmpl',
  'template/app/agents/reviewer.md.tmpl'
];

const APP_FILES = {
  backend: [
    ...APP_TEMPLATES,
    'presets/backend/architecture-ddd.md',
    'presets/backend/architecture-modular.md',
    'presets/backend/architecture-layered.md',
    'presets/backend/code-style.md',
    'presets/backend/testing.md',
    'presets/backend/database.md'
  ],
  frontend: [
    ...APP_TEMPLATES,
    'presets/frontend/architecture.md',
    'presets/frontend/code-style.md',
    'presets/frontend/testing.md'
  ],
  custom: [
    ...APP_TEMPLATES.filter(f => f !== 'template/app/commands.md'),
    'presets/custom/architecture.md',
    'presets/custom/code-style.md',
    'presets/custom/commands.md',
    'presets/custom/testing.md'
  ],
  site: ['template/app/CLAUDE.md']
};

const BACKEND_OPTIONS = {
  architecture: ['ddd', 'modular', 'layered'],
  api: ['graphql', 'rest', 'trpc'],
  db: ['knex', 'prisma', 'drizzle', 'none'],
  rls: [true, false],
  errors: ['return', 'throw'],
  tests: ['full', 'light', 'none']
};

const FRONTEND_OPTIONS = {
  framework: ['react-vite', 'next'],
  data: ['graphql', 'rest', 'trpc'],
  i18n: [['en', 'es'], false],
  uiLanguage: ['es', 'en'],
  tests: ['none', 'unit', 'e2e']
};

const CUSTOM_OPTIONS = {
  location: ['apps', 'packages'],
  tests: ['none', 'yes']
};

const GLOBAL_OPTIONS = {
  workspaces: [true, false],
  comments: ['none', 'why'],
  body: [true, false]
};

const LEFTOVERS = ['<!-- si', '<!-- /si', '{{', '}}'];

const combos = options =>
  Object.entries(options).reduce(
    (acc, [key, values]) => acc.flatMap(combo => values.map(value => ({ ...combo, [key]: value }))),
    [{}]
  );

const buildManifest = (globals, app) => ({
  project: 'acme-shop',
  description: 'Test',
  packageManager: 'pnpm',
  workspaces: globals.workspaces,
  style: { comments: globals.comments },
  commits: { body: globals.body },
  apps: [app, { name: 'www', kind: 'site', stack: 'Astro' }]
});

const sources = new Map();
const read = path => {
  if (!sources.has(path)) sources.set(path, readFileSync(new URL(path, ROOT), 'utf8'));
  return sources.get(path);
};

const errors = [];
let checked = 0;

for (const globals of combos(GLOBAL_OPTIONS)) {
  const apps = [
    ...combos(BACKEND_OPTIONS).map(o => ({ name: 'api', kind: 'backend', ...o })),
    ...combos(FRONTEND_OPTIONS).map(o => ({ name: 'web', kind: 'frontend', backend: 'api', ...o })),
    ...combos(CUSTOM_OPTIONS).map(o => ({ name: 'types', kind: 'custom', purpose: 'Shared types', ...o })),
    { name: 'www', kind: 'site', stack: 'Astro' }
  ];

  for (const app of apps) {
    const manifest = buildManifest(globals, app);
    const files = [...ROOT_FILES.map(f => [f, null]), ...APP_FILES[app.kind].map(f => [f, app])];

    for (const [path, target] of files) {
      const text = render(read(path), manifest, target);
      const found = LEFTOVERS.filter(marker => text.includes(marker));

      checked++;
      if (found.length) errors.push(`${path} ${JSON.stringify(target)} ${JSON.stringify(globals)}: ${found}`);
    }
  }
}

errors.slice(0, 20).forEach(error => console.log(error));
console.log(`${checked} renders, ${errors.length} con problemas`);
exit(errors.length ? 1 : 0);
